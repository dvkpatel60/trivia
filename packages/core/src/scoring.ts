import type { GameConfig } from "./types.js";

export interface ScoreLine {
  label: string;
  points: number;
}

export interface ScoreResult {
  total: number;
  streak: number;
  lines: ScoreLine[];
}

/** A correct answer at full speed is worth 1.5x base; the streak stacks on top. */
export const SPEED_BONUS_SHARE = 0.5;
export const STREAK_STEP = 25;

/**
 * Points for one answer.
 *
 * `elapsedMs` is measured client-side and is therefore a hint, not a fact. It
 * only ever *adds* a bonus that is clamped to the round's own time limit, so
 * the worst a lying client can do is claim the speed bonus it would have got
 * by answering instantly. Correctness — the part worth cheating for — is
 * decided here from the server's own copy of the solution.
 */
export function scoreAnswer(
  config: GameConfig,
  fraction: number,
  elapsedMs: number | null,
  streakBefore: number,
  /** The window this particular question had, which varies by kind. */
  limitMs = config.seconds * 1000,
): ScoreResult {
  const clamped = Math.max(0, Math.min(1, fraction));
  const base = Math.round(config.basePoints * clamped);
  const lines: ScoreLine[] = [{ label: "base", points: base }];
  let total = base;
  let streak = streakBefore;

  if (clamped > 0 && config.speedBonus && config.timerOn && elapsedMs != null) {
    const limit = limitMs;
    const remaining = Math.max(0, limit - Math.max(0, elapsedMs));
    const bonus = Math.round(
      config.basePoints * SPEED_BONUS_SHARE * (limit === 0 ? 0 : remaining / limit) * clamped,
    );
    if (bonus > 0) {
      total += bonus;
      lines.push({ label: "speed", points: bonus });
    }
  }

  if (clamped >= 0.999) {
    streak += 1;
    if (config.streakBonus && streak > 1) {
      const bonus = STREAK_STEP * (streak - 1);
      total += bonus;
      lines.push({ label: `streak x${streak}`, points: bonus });
    }
  } else {
    streak = 0;
  }

  return { total, streak, lines };
}

/** Seconds a single question is allowed, scaled by how fiddly its kind is. */
export function questionSeconds(config: GameConfig, timeMultiplier: number): number {
  return Math.round(config.seconds * timeMultiplier);
}
