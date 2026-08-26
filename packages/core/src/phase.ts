/**
 * The server-owned phase machine.
 *
 * A game is always in exactly one phase, and the phase carries its own
 * deadline. Clients render from `phase` alone — they never infer what screen
 * to show by cross-referencing timers and answer counts, which is what made
 * the original single-file version so hard to reason about.
 *
 * Nothing here schedules anything. There is no cron per game on Netlify, so
 * phases advance *lazily on read*: whoever polls past a deadline advances the
 * machine and writes it back. With long-polling somebody is always reading,
 * so transitions land within a few hundred milliseconds — and the game keeps
 * running even if the host closes their laptop.
 */

import type { GameConfig } from "./types.js";

export type Phase =
  | { name: "lobby"; startedAt: number }
  /** live: everyone is answering question `index` of `round`. */
  | { name: "question"; round: number; index: number; startedAt: number; endsAt: number | null }
  /** live: the short beat where the answer is shown before moving on. */
  | { name: "beat"; round: number; index: number; startedAt: number; endsAt: number }
  /** live: end-of-round leaderboard. */
  | { name: "standings"; round: number; startedAt: number; endsAt: number | null }
  /** async: `round` is open; play it whenever. */
  | { name: "open"; round: number; startedAt: number; endsAt: number | null }
  /** async: `round` is closed and its answers are on the table. */
  | { name: "reveal"; round: number; startedAt: number }
  | { name: "final"; startedAt: number };

export type PhaseName = Phase["name"];

/** How long the answer stays on screen between live questions. */
export const BEAT_MS = 4_000;
/** How long the live leaderboard holds before the next round starts. */
export const STANDINGS_MS = 8_000;
/**
 * A submission this late still counts. Network latency shouldn't cost a
 * player their answer — but the speed bonus is still scored against the real
 * deadline, so there's nothing to game here.
 */
export const SUBMIT_GRACE_MS = 1_500;

export type GameStatus = "lobby" | "playing" | "done";

export function gameStatus(phase: Phase): GameStatus {
  if (phase.name === "lobby") return "lobby";
  if (phase.name === "final") return "done";
  return "playing";
}

/** The round a phase concerns, or null in the lobby and at the end. */
export function phaseRound(phase: Phase): number | null {
  return "round" in phase ? phase.round : null;
}

/** The question a live phase concerns, or null everywhere else. */
export function phaseQuestion(phase: Phase): number | null {
  return "index" in phase ? phase.index : null;
}

/** True while players should be able to submit answers. */
export function isPlayable(phase: Phase): boolean {
  return phase.name === "question" || phase.name === "open";
}

/** Milliseconds until this phase's deadline, or null if it has none. */
export function timeLeft(phase: Phase, now: number): number | null {
  const endsAt = "endsAt" in phase ? phase.endsAt : null;
  return endsAt == null ? null : Math.max(0, endsAt - now);
}

/** Seconds a live question gets, stretched by how fiddly its kind is. */
export function questionDurationMs(config: GameConfig, timeMultiplier: number): number {
  return Math.round(config.seconds * timeMultiplier) * 1000;
}
