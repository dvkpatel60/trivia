import { KIND_IDS } from "./kinds/index.js";
import type { GameConfig, PuzzleKindId } from "./types.js";

export const DEFAULT_CONFIG: Omit<GameConfig, "packId"> = {
  pacing: "live",
  roundOpenMinutes: null,
  rounds: 3,
  questionsPerRound: 4,
  basePoints: 100,
  timerOn: true,
  seconds: 30,
  speedBonus: true,
  streakBonus: true,
  themedRounds: true,
  hideAnswers: true,
  passScreen: true,
  kinds: Object.fromEntries(KIND_IDS.map((id) => [id, true])) as Record<PuzzleKindId, boolean>,
};

export function defaultConfig(packId: string): GameConfig {
  return { ...DEFAULT_CONFIG, packId, kinds: { ...DEFAULT_CONFIG.kinds } };
}

export const CONFIG_LIMITS = {
  rounds: { min: 1, max: 10 },
  questionsPerRound: { min: 1, max: 10 },
  basePoints: { min: 50, max: 500, step: 25 },
  seconds: { min: 10, max: 120, step: 5 },
} as const;

/** Non-numeric junk from a client falls back rather than poisoning state with NaN. */
const clamp = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback;

/**
 * Anything arriving from a client is a suggestion. This is what the server
 * actually plays with — an unbounded `rounds` or `basePoints` from a crafted
 * request would otherwise sit in storage forever.
 */
export function sanitizeConfig(input: unknown, fallbackPackId: string): GameConfig {
  const raw = (input ?? {}) as Partial<GameConfig>;
  const base = defaultConfig(
    typeof raw.packId === "string" && raw.packId.trim() ? raw.packId : fallbackPackId,
  );

  const kinds: Partial<Record<PuzzleKindId, boolean>> = {};
  for (const id of KIND_IDS) {
    kinds[id] = raw.kinds?.[id] !== false;
  }
  if (!KIND_IDS.some((id) => kinds[id])) {
    for (const id of KIND_IDS) kinds[id] = true;
  }

  return {
    ...base,
    rounds: clamp(
      Number(raw.rounds ?? base.rounds),
      CONFIG_LIMITS.rounds.min,
      CONFIG_LIMITS.rounds.max,
      base.rounds,
    ),
    questionsPerRound: clamp(
      Number(raw.questionsPerRound ?? base.questionsPerRound),
      CONFIG_LIMITS.questionsPerRound.min,
      CONFIG_LIMITS.questionsPerRound.max,
      base.questionsPerRound,
    ),
    basePoints: clamp(
      Number(raw.basePoints ?? base.basePoints),
      CONFIG_LIMITS.basePoints.min,
      CONFIG_LIMITS.basePoints.max,
      base.basePoints,
    ),
    seconds: clamp(
      Number(raw.seconds ?? base.seconds),
      CONFIG_LIMITS.seconds.min,
      CONFIG_LIMITS.seconds.max,
      base.seconds,
    ),
    pacing: raw.pacing === "async" || raw.pacing === "local" ? raw.pacing : "live",
    roundOpenMinutes:
      raw.roundOpenMinutes == null || !Number.isFinite(Number(raw.roundOpenMinutes))
        ? null
        : clamp(Number(raw.roundOpenMinutes), 1, 60 * 24 * 7, 60),
    timerOn: raw.timerOn !== false,
    speedBonus: raw.speedBonus !== false,
    streakBonus: raw.streakBonus !== false,
    themedRounds: raw.themedRounds !== false,
    hideAnswers: raw.hideAnswers !== false,
    passScreen: raw.passScreen !== false,
    kinds,
  };
}
