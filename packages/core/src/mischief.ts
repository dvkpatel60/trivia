/**
 * Rigged standings.
 *
 * A host can put the scoreboard in on the joke: everyone else is shown a
 * pittance while the host's own total runs normally, and the truth lands at
 * `final`. Nothing here touches scoring. `scoreAnswer` and the phase machine
 * work in true points from first question to last; this module only decides
 * what a *published* total looks like on the way past `toPublicGame`.
 *
 * Three rules keep it a joke rather than a bug report.
 *
 * **The lie is a pure function of the truth.** Not accumulated noise, not a
 * stored fudge factor — `shown = round(true * scale)` with a scale fixed by
 * the config. So any request computes the same standings (which is what the
 * split storage needs: two requests racing still agree), nothing extra is
 * written to a player's own key, and a shown total can never go *down*,
 * because a true total never does. A scoreboard that slides backwards reads
 * as a broken app, and the reveal stops being funny.
 *
 * **Order among the marks is preserved exactly.** A single positive
 * multiplier is order-preserving by construction, so the real contest —
 * you against the person next to you — stays honest and legible. Nobody
 * disengages because their actual rival is still where they expect, and
 * nobody is robbed at the reveal of a win they earned. The host takes the
 * entire fall, alone, which is who signed up for it.
 *
 * **The receipts stay true.** `Ledger` itemises every answer — "base +100,
 * speed +40, streak x2" — and those numbers are never touched. So the truth
 * is on screen all evening and the reveal is "it was in front of you the
 * whole time" rather than "the app lied to your face". It does mean a
 * determined player can add up their own receipts and catch the standings
 * out, and that is the intended tell, not a leak to be plugged.
 */

import { SPEED_BONUS_SHARE } from "./scoring.js";
import type { GameConfig } from "./types.js";

export type MischiefMode = "off" | "houseRules";

export const MISCHIEF_MODES: readonly MischiefMode[] = ["off", "houseRules"] as const;

export function isMischiefMode(value: unknown): value is MischiefMode {
  return typeof value === "string" && (MISCHIEF_MODES as readonly string[]).includes(value);
}

/**
 * What a flawless round is shown as under `houseRules`.
 *
 * Nineteen rather than twenty so that "under twenty a round" is true of a
 * player who answers everything correctly at full speed — the ceiling, not
 * an average. A streak can carry someone past it, and that is deliberate:
 * the alternative is clamping, which would flatten the top of the table into
 * a dead heat and throw away the order this whole thing is built to keep.
 */
export const HOUSE_PERFECT_ROUND = 19;

/**
 * The multiplier applied to everyone who is not the host.
 *
 * Derived from the config rather than from anybody's actual score. Scaling
 * against the observed leader would look neater and would be a bug: as the
 * leader pulls away the divisor grows, and a player who has a quiet round
 * watches their own total shrink.
 */
export function houseScale(config: GameConfig): number {
  const perfectRound =
    config.basePoints * (1 + (config.speedBonus ? SPEED_BONUS_SHARE : 0)) * config.questionsPerRound;
  if (!Number.isFinite(perfectRound) || perfectRound <= 0) return 1;
  return HOUSE_PERFECT_ROUND / perfectRound;
}

/**
 * One player's total, as the table should see it.
 *
 * The host's own score is published untouched. If the host plays badly the
 * gap is small and the bit falls flat, which is fair — they are the one
 * person here who can do something about that.
 */
export function shownScore(
  score: number,
  playerId: string,
  hostId: string,
  config: GameConfig,
): number {
  if (config.mischief !== "houseRules") return score;
  if (playerId === hostId) return score;
  return Math.round(score * houseScale(config));
}

/** True when a mode is active and the game has not yet come clean. */
export function isRigged(config: GameConfig): boolean {
  return config.mischief !== "off";
}

/**
 * What the table was told, handed over once the truth is out.
 *
 * Published only at `final`, alongside the real scores, so the last screen
 * can animate from the fiction to the fact and say by how much it lied. The
 * client never computes this for itself — the server decides what was shown,
 * the same way it decides everything else that scores.
 */
export interface MischiefReveal {
  mode: MischiefMode;
  /** Player id to the total they were looking at a moment ago. */
  shown: Record<string, number>;
  /** The host, who was in on it. */
  hostId: string;
}
