/**
 * The game API. One POST endpoint, one `op` per request.
 *
 * This file is deliberately thin. Every rule about who may do what and when a
 * phase ends lives in `@candlelight/core`, where it is tested without a
 * network. What is left here is I/O: read the blobs, call the engine, write
 * back, and hold the connection open when a client is waiting for something
 * to happen.
 */

import {
  advance,
  createGame,
  defaultConfig,
  GameError,
  hostAdvance,
  joinGame,
  removePlayer,
  sanitizeConfig,
  seedFor,
  startGame,
  submitAnswers,
  toPublicGame,
  touchPlayer,
  createRng,
  type EngineContext,
  type GameRequest,
  type GameState,
} from "@candlelight/core";
import { resolvePack } from "@candlelight/content";

import {
  cleanup,
  createMain,
  exists,
  loadGame,
  saveMain,
  savePlayer,
  signature,
} from "../lib/storage.mts";

/* ── how long a held request waits ────────────────────────────────────── */

/**
 * Netlify's default function timeout is 10s, so the hold has to finish well
 * inside it. Even at 6.5s this turns a 2s polling loop into roughly a third
 * of the invocations while making transitions land in well under a second.
 */
const HOLD_MS = 6_500;
const CYCLE_MS = 600;
/** Finished games are swept an hour after they end. */
const CLEANUP_AFTER_MS = 60 * 60_000;

const CODE_WORDS = [
  "NIFFLER", "THESTRAL", "MANDRAKE", "BOGGART", "PENSIEVE", "PORTKEY",
  "GRINDYLOW", "KNEAZLE", "AUGUREY", "BOWTRUCKLE", "OCCAMY", "DEMIGUISE",
  "MOONCALF", "RUNESPOOR", "HIPPOGRIFF", "SNIDGET", "CLABBERT", "JOBBERKNOLL",
];

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const fail = (message: string, code: string, status: number): Response =>
  json({ error: message, code }, status);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STATUS_FOR: Record<string, number> = {
  not_found: 404,
  forbidden: 403,
  conflict: 409,
  bad_request: 400,
};

/** The engine context for a given game and moment. */
function contextFor(game: GameState, now: number): EngineContext {
  return {
    pack: resolvePack(game.config.packId),
    // Seeded from the game's identity, so whichever request ends up dealing a
    // round produces exactly the questions any other request would have.
    rngFor: (round) => createRng(seedFor(game.code, round)),
    now,
  };
}

async function claimCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)] as string;
    const code = `${word}-${10 + Math.floor(Math.random() * 90)}`;
    if (!(await exists(code))) return code;
  }
  return `GAME-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/**
 * Bring a game up to date before answering with it.
 *
 * This is the whole scheduler. Nothing runs on a timer, so a request that
 * arrives after a deadline is what moves the game past it — and because a
 * long poll is always in flight during live play, that happens within a
 * cycle of the deadline itself.
 */
async function advanceIfDue(game: GameState, now: number): Promise<boolean> {
  const moved = advance(game, contextFor(game, now));
  if (moved) await saveMain(game, now);
  return moved;
}

const envelope = (game: GameState, now: number, extra: Record<string, unknown> = {}) =>
  json({ game: toPublicGame(game), serverNow: now, ...extra });

/* ── operations ───────────────────────────────────────────────────────── */

async function handle(body: GameRequest): Promise<Response> {
  const now = Date.now();

  switch (body.op) {
    case "create": {
      if (!body.hostId) return fail("hostId is required.", "bad_request", 400);
      const config = sanitizeConfig(body.config, defaultConfig("hogwarts").packId);
      const pack = resolvePack(config.packId);
      const code = await claimCode();
      const game = createGame({
        code,
        hostId: body.hostId,
        hostName: body.hostName ?? "Host",
        config: { ...config, packId: pack.id },
        now,
      });
      await createMain(game, now);
      return envelope(game, now, { code });
    }

    case "join": {
      const loaded = await loadGame(body.code);
      if (!loaded) return fail("No game with that code.", "not_found", 404);
      const { game } = loaded;

      joinGame(game, body.playerId, body.playerName ?? "", now);
      await saveMain(game, now);
      const player = game.players[body.playerId];
      if (player) await savePlayer(game.code, player);
      return envelope(game, now);
    }

    case "start": {
      const loaded = await loadGame(body.code);
      if (!loaded) return fail("No game with that code.", "not_found", 404);
      const { game } = loaded;

      startGame(game, body.hostId, contextFor(game, now));
      await saveMain(game, now);
      return envelope(game, now);
    }

    case "advance": {
      const loaded = await loadGame(body.code);
      if (!loaded) return fail("No game with that code.", "not_found", 404);
      const { game } = loaded;

      hostAdvance(game, body.hostId, contextFor(game, now));
      await saveMain(game, now);
      return envelope(game, now);
    }

    case "submit": {
      const loaded = await loadGame(body.code);
      if (!loaded) return fail("No game with that code.", "not_found", 404);
      const { game } = loaded;

      const outcome = submitAnswers(game, body.playerId, body.round, body.answers ?? {}, now);

      // Only this player's record is written. Nobody else's is touched, which
      // is what makes simultaneous answers safe without a lock.
      const player = game.players[body.playerId];
      if (player) await savePlayer(game.code, player);

      // Their answer may have been the last one the round was waiting for.
      await advanceIfDue(game, now);

      return envelope(game, now, {
        results: outcome.results,
        roundScore: outcome.roundScore,
        streak: outcome.streak,
      });
    }

    case "leave": {
      const loaded = await loadGame(body.code);
      if (!loaded) return fail("No game with that code.", "not_found", 404);
      const { game } = loaded;
      removePlayer(game, body.playerId);
      await saveMain(game, now);
      return envelope(game, now);
    }

    case "state":
      return await handleState(body, now);

    case "cleanup": {
      const result = await cleanup(CLEANUP_AFTER_MS, now);
      return json({ ...result, serverNow: now });
    }

    default:
      return fail(`Unknown op: ${String((body as { op?: string }).op)}`, "bad_request", 400);
  }
}

/**
 * Read state, optionally holding the connection until something changes.
 *
 * A client passes the version it already has. If the game has moved on, it
 * gets the new state immediately. If not, and it asked to wait, the request
 * parks here — cheap signature checks each cycle, a full read only when
 * something actually moved or a phase deadline came due.
 */
async function handleState(
  body: Extract<GameRequest, { op: "state" }>,
  startedAt: number,
): Promise<Response> {
  const first = await loadGame(body.code);
  if (!first) return fail("No game with that code.", "not_found", 404);

  const since = Number(body.since ?? 0);
  let { game, version } = first;

  const presenceChanged = touchPlayer(game, body.playerId, startedAt);
  const moved = await advanceIfDue(game, startedAt);

  if (presenceChanged && body.playerId) {
    const player = game.players[body.playerId];
    if (player) await savePlayer(game.code, player);
  }

  if (moved || presenceChanged || version > since || !body.wait) {
    const reloaded = moved || presenceChanged ? await loadGame(body.code) : null;
    const current = reloaded ?? { game, version };
    return envelope(current.game, Date.now(), {});
  }

  // Nothing new yet, and the caller is willing to wait for it.
  let lastSignature = await signature(body.code);
  const deadline = startedAt + HOLD_MS;

  while (Date.now() < deadline) {
    await sleep(CYCLE_MS);
    const now = Date.now();

    const current = await signature(body.code);
    const phaseDue = isPhaseDue(game, now);
    if (current === lastSignature && !phaseDue) continue;
    lastSignature = current;

    const next = await loadGame(body.code);
    if (!next) return fail("That game has gone.", "not_found", 404);
    game = next.game;
    version = next.version;

    const advanced = await advanceIfDue(game, now);
    if (advanced || version > since) {
      const settled = advanced ? await loadGame(body.code) : null;
      return envelope(settled?.game ?? game, Date.now(), {});
    }
  }

  return json({ unchanged: true, version, serverNow: Date.now() });
}

function isPhaseDue(game: GameState, now: number): boolean {
  const phase = game.phase;
  return "endsAt" in phase && phase.endsAt != null && now >= phase.endsAt;
}

/* ── entry point ──────────────────────────────────────────────────────── */

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return fail("POST only.", "bad_request", 405);

  let body: GameRequest;
  try {
    body = (await req.json()) as GameRequest;
  } catch {
    return fail("Body must be JSON.", "bad_request", 400);
  }

  try {
    return await handle(body);
  } catch (error) {
    if (error instanceof GameError) {
      return fail(error.message, error.code, STATUS_FOR[error.code] ?? 400);
    }
    const message = error instanceof Error ? error.message : String(error);
    return fail(message, "server_error", 500);
  }
};
