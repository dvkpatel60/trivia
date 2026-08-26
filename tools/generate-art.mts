/**
 * Generate picture-round art with Cloudflare Workers AI.
 *
 * Run offline, by a person, with a key in `.env`. Nothing at runtime — not
 * the app, not the Netlify functions — ever talks to Cloudflare or sees the
 * token; this writes PNGs into `apps/web/public/packs/` and then it is done.
 *
 *   npm run art -- --dry-run          show every prompt, call nothing
 *   npm run art -- --pack hogwarts    generate one pack
 *   npm run art -- --only place-greathall
 *   npm run art -- --force            redo images that already exist
 *
 * Images are seeded from their art id, so a rerun reproduces the same
 * picture. Regenerating one item leaves the rest of the pack alone.
 */

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  ART_SIZE,
  composeNegativePrompt,
  composePrompt,
  livingItems,
  seedForArt,
  type ArtDirection,
  type ContentPack,
  type GeneratedArt,
} from "@curio/core";
import { PACKS } from "@curio/content";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_ROOT = path.join(ROOT, "apps/web/public/packs");

/**
 * Free-tier text-to-image models, and what each will actually accept.
 *
 * The capability flags are not decoration. SDXL takes a seed, a negative
 * prompt, and an explicit size — the three things this pipeline is built on,
 * which is why it is the default. flux-1-schnell is faster and arguably
 * prettier, but it accepts a prompt and a step count and nothing else: no
 * seed, so its output is not reproducible, and no size, so it returns its own
 * square rather than the shape the packs declare.
 */
interface ModelSpec {
  id: string;
  /** Honours `seed`, so a rerun reproduces the same picture. */
  seeded: boolean;
  /** Honours `width`/`height`, so it returns `ART_SIZE`. */
  sized: boolean;
  /** Honours `negative_prompt`. */
  negatives: boolean;
  body(prompt: string, seed: number, negative: string): Record<string, unknown>;
}

const MODELS = {
  sdxl: {
    id: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    seeded: true,
    sized: true,
    negatives: true,
    body: (prompt, seed, negative) => ({
      prompt,
      negative_prompt: negative,
      num_steps: 20,
      width: ART_SIZE.width,
      height: ART_SIZE.height,
      seed,
    }),
  },
  flux: {
    id: "@cf/black-forest-labs/flux-1-schnell",
    seeded: false,
    sized: false,
    negatives: false,
    /* Distilled: more than 8 steps buys nothing, and nothing else is allowed. */
    body: (prompt) => ({ prompt, steps: 8 }),
  },
} satisfies Record<string, ModelSpec>;

type ModelName = keyof typeof MODELS;

interface Options {
  dryRun: boolean;
  force: boolean;
  pack?: string;
  only?: string;
  limit: number;
  model: ModelName;
}

function parseArgs(argv: string[]): Options {
  const value = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const model = (value("--model") ?? "sdxl") as ModelName;
  if (!(model in MODELS)) {
    throw new Error(`Unknown model "${model}". Try: ${Object.keys(MODELS).join(", ")}`);
  }
  return {
    dryRun: argv.includes("--dry-run"),
    force: argv.includes("--force"),
    pack: value("--pack"),
    only: value("--only"),
    limit: Number(value("--limit") ?? Infinity),
    model,
  };
}

/** Read `.env` without a dependency; real environment variables win. */
async function loadEnv(): Promise<void> {
  try {
    const raw = await readFile(path.join(ROOT, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, value] = match;
      if (key && !process.env[key]) process.env[key] = value?.replace(/^["']|["']$/g, "") ?? "";
    }
  } catch {
    // No .env is fine when the variables are already exported.
  }
}

/** Overridable so the pipeline can be exercised against a local stub. */
const API = process.env.CLOUDFLARE_API_BASE ?? "https://api.cloudflare.com/client/v4";

/**
 * The account id, discovered if it wasn't supplied.
 *
 * Workers AI is addressed per account, and a token alone doesn't say which.
 * A token scoped only to Workers AI can't list accounts, hence the pointed
 * error rather than a bare 403.
 */
async function resolveAccountId(token: string): Promise<string> {
  const configured = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (configured) return configured;

  const response = await fetch(`${API}/accounts`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const body = (await response.json()) as {
    success?: boolean;
    result?: Array<{ id: string; name: string }>;
    errors?: Array<{ message: string }>;
  };

  const first = body.result?.[0];
  if (!response.ok || !body.success || !first) {
    const reason = body.errors?.map((error) => error.message).join("; ") ?? response.statusText;
    throw new Error(
      `Couldn't discover the account id (${reason}).\n` +
        `Set CLOUDFLARE_ACCOUNT_ID in .env — it's on the right of any zone's overview page,\n` +
        `or at dash.cloudflare.com → Workers & Pages → the URL contains it.`,
    );
  }
  if ((body.result?.length ?? 0) > 1) {
    console.log(`  several accounts on this token; using "${first.name}"`);
  }
  return first.id;
}

interface Job {
  pack: ContentPack;
  direction: ArtDirection;
  art: GeneratedArt;
  alt: string;
  prompt: string;
  negative: string;
  seed: number;
  file: string;
}

function collect(options: Options): Job[] {
  const jobs: Job[] = [];

  for (const pack of PACKS) {
    if (options.pack && pack.id !== options.pack) continue;
    const direction = pack.art;

    for (const item of livingItems(pack, "imageChoice")) {
      if (!item.art) continue;
      if (options.only && item.art.id !== options.only) continue;
      if (!direction) {
        console.warn(`  ! ${pack.id}/${item.art.id}: pack declares no art direction, skipping`);
        continue;
      }
      jobs.push({
        pack,
        direction,
        art: item.art,
        alt: item.media.alt,
        prompt: composePrompt(item.art, direction),
        negative: composeNegativePrompt(direction),
        seed: seedForArt(item.art.id),
        file: path.join(OUT_ROOT, pack.id, `${item.art.id}.png`),
      });
    }
  }

  return jobs.slice(0, options.limit);
}

const exists = async (file: string): Promise<boolean> => {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

/**
 * Workers AI rejects an unknown field by naming it, like:
 *   Additional or unevaluated properties '/seed' at '/' not allowed
 * Pulling that name out lets one bad field be dropped and the call retried,
 * rather than the whole run failing on a schema that changed under us.
 */
function rejectedProperty(detail: string): string | null {
  const match = /properties '\/([A-Za-z0-9_]+)'/.exec(detail);
  return match?.[1] ?? null;
}

/** One image. Returns the PNG bytes. */
async function generate(
  job: Job,
  account: string,
  token: string,
  model: ModelName,
): Promise<Uint8Array> {
  const spec: ModelSpec = MODELS[model];
  let body = spec.body(job.prompt, job.seed, job.negative);
  let response: Response | undefined;

  // At most a couple of goes: enough to shed fields a model has stopped
  // accepting, without looping if something else is wrong.
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(`${API}/accounts/${account}/ai/run/${spec.id}`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) break;

    const detail = await response.text();
    const unwanted = response.status === 400 ? rejectedProperty(detail) : null;
    if (!unwanted || !(unwanted in body)) {
      throw new Error(`${response.status} ${response.statusText} — ${detail.slice(0, 300)}`);
    }

    console.log(`    (${spec.id} rejects "${unwanted}" — dropping it and retrying)`);
    const { [unwanted]: _dropped, ...rest } = body;
    body = rest;
  }

  if (!response || !response.ok) {
    throw new Error("gave up after retrying without the rejected fields");
  }

  // flux answers with JSON carrying base64; SDXL answers with raw image bytes.
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const payload = (await response.json()) as {
      success?: boolean;
      result?: { image?: string };
      errors?: Array<{ message: string }>;
    };
    const image = payload.result?.image;
    if (!image) {
      throw new Error(payload.errors?.map((error) => error.message).join("; ") ?? "no image returned");
    }
    return Buffer.from(image, "base64");
  }
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * A record of what produced each file, written beside the images.
 *
 * Not read by the app — it exists so a prompt change is reviewable in a diff
 * and a picture can always be traced back to the words that made it.
 */
async function writeManifest(packId: string, jobs: Job[], model: string): Promise<void> {
  const file = path.join(OUT_ROOT, packId, "manifest.json");
  const previous = await readFile(file, "utf8").then(
    (raw) => JSON.parse(raw) as { images?: Record<string, unknown> },
    () => ({ images: {} as Record<string, unknown> }),
  );

  const images = { ...(previous.images ?? {}) };
  const spec = Object.values(MODELS).find((entry) => entry.id === model);
  for (const job of jobs) {
    images[job.art.id] = {
      subject: job.art.subject,
      alt: job.alt,
      prompt: job.prompt,
      // Recorded only when the model actually used it — otherwise it would
      // read like a promise of reproducibility this run cannot keep.
      ...(spec?.seeded ? { seed: job.seed } : {}),
      model,
      generatedAt: new Date().toISOString(),
    };
  }

  await writeFile(file, `${JSON.stringify({ pack: packId, images }, null, 2)}\n`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  await loadEnv();

  const jobs = collect(options);
  if (jobs.length === 0) {
    console.log("Nothing to generate. Add an `art` block to an imageChoice item.");
    return;
  }

  const spec: ModelSpec = MODELS[options.model];
  console.log(`${jobs.length} image${jobs.length === 1 ? "" : "s"} · model ${spec.id}\n`);
  if (!spec.sized) {
    console.log(
      `  note: ${spec.id} ignores width and height, so images come back square`,
      `rather than ${ART_SIZE.width}x${ART_SIZE.height}. They are cropped to fit.\n`,
    );
  }
  if (!spec.seeded) {
    console.log(`  note: ${spec.id} takes no seed, so a rerun will not reproduce these.\n`);
  }

  if (options.dryRun) {
    for (const job of jobs) {
      console.log(`── ${job.pack.id}/${job.art.id}  seed ${job.seed}`);
      console.log(`   ${job.prompt}`);
      if (spec.negatives) console.log(`   avoid: ${job.negative}`);
      console.log();
    }
    console.log("Dry run: nothing was generated and no request was made.");
    return;
  }

  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN is not set. Copy .env.example to .env.");

  const account = await resolveAccountId(token);
  const done: Record<string, Job[]> = {};
  let made = 0;
  let skipped = 0;

  for (const job of jobs) {
    const label = `${job.pack.id}/${job.art.id}`;
    if (!options.force && (await exists(job.file))) {
      console.log(`  · ${label} — already there`);
      skipped += 1;
      continue;
    }

    try {
      const bytes = await generate(job, account, token, options.model);
      await mkdir(path.dirname(job.file), { recursive: true });
      await writeFile(job.file, bytes);
      (done[job.pack.id] ??= []).push(job);
      made += 1;
      console.log(`  ✓ ${label} — ${(bytes.byteLength / 1024).toFixed(0)}kb`);
    } catch (error) {
      console.error(`  ✗ ${label} — ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const [packId, packJobs] of Object.entries(done)) {
    await writeManifest(packId, packJobs, spec.id);
  }

  console.log(`\n${made} generated, ${skipped} already present.`);
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
