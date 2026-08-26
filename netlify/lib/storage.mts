/**
 * Blob storage for games, split so that no two parties ever write the same key.
 *
 * `@netlify/blobs` offers no conditional write — there is no `onlyIfMatch`,
 * so there is no way to do compare-and-swap and no way to build a lock. A
 * single game blob would therefore lose writes: in live play everyone answers
 * the same question within a second of each other, so two submissions racing
 * through read-modify-write would silently drop one.
 *
 * The fix is layout, not locking:
 *
 *   g/<CODE>            lifecycle — phase, config, questions, roster
 *   g/<CODE>/p/<ID>     one player's answers and score
 *
 * A player writes only their own key. The lifecycle key is written by the
 * host's own actions and by whichever request happens to advance the phase —
 * and those transitions are deterministic given the same input state, right
 * down to the questions, which are dealt from a seed derived from the game
 * code and round number. Two requests racing to advance therefore compute the
 * same next state, so last-write-wins is not lossy.
 *
 * If Netlify Blobs ever grows conditional writes, this collapses back to one
 * key and a CAS loop.
 */

import { getStore, type Store } from "@netlify/blobs";
import type { AnyQuestion, GameState, PlayerState, RoundState } from "@curio/core";
import type { Phase } from "@curio/core";
import type { GameConfig } from "@curio/core";

const STORE_NAME = "curio-games";

/** The lifecycle record: everything except what players did. */
interface MainRecord {
  code: string;
  hostId: string;
  phase: Phase;
  config: GameConfig;
  createdAt: number;
  updatedAt: number;
  version: number;
  rounds: Record<number, RoundState<AnyQuestion>>;
  usage: Record<string, number[]>;
  /** Identity only — scores live in each player's own record. */
  roster: Record<string, { id: string; name: string; color: string; joinedAt: number }>;
}

/** One player's record, written by that player and nobody else. */
interface PlayerRecord extends PlayerState {
  /** Bumped on every write; folded into the composite version clients poll on. */
  rev: number;
}

export interface LoadedGame {
  game: GameState;
  /** main.version + every player's rev. Moves whenever anything changes. */
  version: number;
}

let cached: Store | undefined;
function store(): Store {
  cached ??= getStore({ name: STORE_NAME, consistency: "strong" });
  return cached;
}

const mainKey = (code: string) => `g/${code}`;
const playerPrefix = (code: string) => `g/${code}/p/`;
const playerKey = (code: string, id: string) => `${playerPrefix(code)}${id}`;

/* ── reads ────────────────────────────────────────────────────────────── */

export async function readMain(code: string): Promise<MainRecord | null> {
  return (await store().get(mainKey(code), { type: "json" })) as MainRecord | null;
}

async function readPlayer(code: string, id: string): Promise<PlayerRecord | null> {
  return (await store().get(playerKey(code, id), { type: "json" })) as PlayerRecord | null;
}

/** Assemble the shape the engine works on out of its separate keys. */
export async function loadGame(code: string): Promise<LoadedGame | null> {
  const main = await readMain(code);
  if (!main) return null;

  const ids = Object.keys(main.roster);
  const records = await Promise.all(ids.map((id) => readPlayer(code, id)));

  const players: Record<string, PlayerState> = {};
  let version = main.version;

  ids.forEach((id, index) => {
    const identity = main.roster[id];
    if (!identity) return;
    const record = records[index];
    version += record?.rev ?? 0;
    players[id] = record
      ? // Identity comes from the roster so a rename shows up for everyone,
        // even before that player next writes their own record.
        { ...record, name: identity.name, color: identity.color, joinedAt: identity.joinedAt }
      : { ...identity, lastSeenAt: identity.joinedAt, score: 0, streak: 0, rounds: {} };
  });

  const game: GameState = {
    code: main.code,
    hostId: main.hostId,
    phase: main.phase,
    config: main.config,
    createdAt: main.createdAt,
    updatedAt: main.updatedAt,
    version,
    players,
    rounds: main.rounds,
    usage: main.usage,
  };

  return { game, version };
}

/**
 * A cheap change detector: one metadata read plus one list, no bodies.
 *
 * The long poll runs this every cycle and only pays for a full assemble when
 * the signature moves — which is what keeps a held request from costing one
 * read per player per cycle.
 */
export async function signature(code: string): Promise<string | null> {
  const [main, listing] = await Promise.all([
    store().getMetadata(mainKey(code)),
    store().list({ prefix: playerPrefix(code) }),
  ]);
  if (!main) return null;
  const players = listing.blobs
    .map((blob) => `${blob.key}:${blob.etag}`)
    .sort()
    .join("|");
  return `${main.etag ?? ""}~${players}`;
}

/* ── writes ───────────────────────────────────────────────────────────── */

/** Write the lifecycle record. Never touches a player's answers. */
export async function saveMain(game: GameState, now: number): Promise<void> {
  const roster: MainRecord["roster"] = {};
  for (const player of Object.values(game.players)) {
    roster[player.id] = {
      id: player.id,
      name: player.name,
      color: player.color,
      joinedAt: player.joinedAt,
    };
  }

  const record: MainRecord = {
    code: game.code,
    hostId: game.hostId,
    phase: game.phase,
    config: game.config,
    createdAt: game.createdAt,
    updatedAt: now,
    // Derived from the main record alone; player revs are added back on read.
    version: (await readMain(game.code))?.version ?? 0,
    rounds: game.rounds,
    usage: game.usage,
    roster,
  };
  record.version += 1;

  await store().set(mainKey(game.code), JSON.stringify(record));
}

/** Write one player's record. Only ever called for the requesting player. */
export async function savePlayer(code: string, player: PlayerState): Promise<void> {
  const existing = await readPlayer(code, player.id);
  const record: PlayerRecord = { ...player, rev: (existing?.rev ?? 0) + 1 };
  await store().set(playerKey(code, player.id), JSON.stringify(record));
}

export async function createMain(game: GameState, now: number): Promise<void> {
  await saveMain(game, now);
  const host = game.players[game.hostId];
  if (host) await savePlayer(game.code, host);
}

export async function exists(code: string): Promise<boolean> {
  return (await store().getMetadata(mainKey(code))) !== null;
}

/* ── housekeeping ─────────────────────────────────────────────────────── */

export interface CleanupResult {
  removed: number;
}

/** Drop finished games, and games nobody touched, after `maxAgeMs`. */
export async function cleanup(maxAgeMs: number, now: number): Promise<CleanupResult> {
  const listing = await store().list({ prefix: "g/" });
  let removed = 0;

  for (const blob of listing.blobs) {
    // Only consider lifecycle keys; player keys go with their game.
    if (blob.key.includes("/p/")) continue;
    const main = (await store().get(blob.key, { type: "json" })) as MainRecord | null;
    if (!main) continue;

    const idle = now - (main.updatedAt ?? main.createdAt ?? 0);
    const finished = main.phase?.name === "final";
    if (!(finished && idle > maxAgeMs) && !(idle > maxAgeMs * 6)) continue;

    for (const id of Object.keys(main.roster ?? {})) {
      await store().delete(playerKey(main.code, id));
    }
    await store().delete(blob.key);
    removed += 1;
  }

  return { removed };
}
