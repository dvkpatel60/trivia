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
 * Free-tier text-to-image models.
 *
 * flux-1-schnell is the default: fastest, and the best looking of the free
 * models. It takes no negative prompt, which is why the constraints are
 * folded into the positive prompt instead. SDXL is the fallback when a pack
 * needs the negatives honoured properly.
 */
const MODELS = {
  flux: {
    id: "@cf/black-forest-labs/flux-1-schnell",
    /** flux-schnell is distilled; more than 8 steps buys nothing. */
    body: (prompt: string, seed: number) => ({ prompt, steps: 8, seed }),
    negatives: false,
  },
  sdxl: {
    id: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    body: (prompt: string, seed: number, negative: string) => ({
      prompt,
      negative_prompt: negative,
      num_steps: 20,
      width: ART_SIZE.width,
      height: ART_SIZE.height,
      seed,
    }),
    negatives: true,
  },
} as const;

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
  const model = (value("--model") ?? "flux") as ModelName;
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

/** One image. Returns the PNG bytes. */
async function generate(
  job: Job,
  account: string,
  token: string,
  model: ModelName,
): Promise<Uint8Array> {
  const spec = MODELS[model];
  const body =
    spec.negatives === true
      ? (spec.body as (p: string, s: number, n: string) => unknown)(job.prompt, job.seed, job.negative)
      : (spec.body as (p: string, s: number) => unknown)(job.prompt, job.seed);

  const response = await fetch(`${API}/accounts/${account}/ai/run/${spec.id}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${response.status} ${response.statusText} — ${detail.slice(0, 300)}`);
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
  for (const job of jobs) {
    images[job.art.id] = {
      subject: job.art.subject,
      alt: job.alt,
      prompt: job.prompt,
      seed: job.seed,
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

  console.log(`${jobs.length} image${jobs.length === 1 ? "" : "s"} · model ${MODELS[options.model].id}\n`);

  if (options.dryRun) {
    for (const job of jobs) {
      console.log(`── ${job.pack.id}/${job.art.id}  seed ${job.seed}`);
      console.log(`   ${job.prompt}`);
      if (MODELS[options.model].negatives) console.log(`   avoid: ${job.negative}`);
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
    await writeManifest(packId, packJobs, MODELS[options.model].id);
  }

  console.log(`\n${made} generated, ${skipped} already present.`);
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
