import { getKind } from "./kinds/index.js";
import { availableKinds, livingItems } from "./pack.js";
import type { Rng } from "./rng.js";
import type { AnyQuestion, ContentPack, GameConfig, ItemFor, PuzzleKindId } from "./types.js";

/**
 * Which item indices a game has already spent, per kind. Carried across
 * rounds so a five-round game doesn't ask the same question twice until the
 * pool genuinely runs dry.
 */
export type KindUsage = Partial<Record<PuzzleKindId, number[]>>;

export interface BuildRoundOptions {
  pack: ContentPack;
  config: GameConfig;
  roundIndex: number;
  rng: Rng;
  /** Mutated in place, and returned, so callers can persist it with the game. */
  usage?: KindUsage;
}

export interface BuiltRound {
  questions: AnyQuestion[];
  usage: KindUsage;
  /** Set when `themedRounds` is on: the single kind this round drew from. */
  themeKind?: PuzzleKindId;
}

/** Kinds the host enabled that this pack can actually deal. */
export function playableKinds(pack: ContentPack, config: GameConfig): PuzzleKindId[] {
  const enabled = availableKinds(pack).filter((id) => config.kinds[id] !== false);
  return enabled.length > 0 ? enabled : availableKinds(pack);
}

/** Draw `count` unused item indices, recycling the pool once it's exhausted. */
function drawIndices(rng: Rng, usage: KindUsage, kindId: PuzzleKindId, poolSize: number, count: number): number[] {
  const spent = usage[kindId] ?? [];
  let available = Array.from({ length: poolSize }, (_, i) => i).filter((i) => !spent.includes(i));

  if (available.length < count) {
    // Pool exhausted. Start it over rather than repeating within one question.
    usage[kindId] = [];
    available = Array.from({ length: poolSize }, (_, i) => i);
  }

  const drawn = rng.shuffle(available).slice(0, count);
  usage[kindId] = [...(usage[kindId] ?? []), ...drawn];
  return drawn;
}

export function buildQuestion(
  kindId: PuzzleKindId,
  pack: ContentPack,
  rng: Rng,
  usage: KindUsage,
): AnyQuestion {
  const kind = getKind(kindId);
  const pool = livingItems(pack, kindId);
  if (pool.length < kind.itemsPerQuestion) {
    throw new Error(
      `Pack "${pack.id}" cannot build a ${kindId} question: needs ${kind.itemsPerQuestion} items, has ${pool.length}.`,
    );
  }
  const picked = drawIndices(rng, usage, kindId, pool.length, kind.itemsPerQuestion).map(
    (i) => pool[i] as ItemFor[PuzzleKindId],
  );

  // Same correlation TypeScript cannot follow as in `gradeQuestion`.
  const build = kind.build as (items: unknown[], ctx: { rng: Rng; pack: ContentPack }) => AnyQuestion;
  return build(picked, { rng, pack });
}

export function buildRound({
  pack,
  config,
  roundIndex,
  rng,
  usage = {},
}: BuildRoundOptions): BuiltRound {
  const kinds = playableKinds(pack, config);
  if (kinds.length === 0) {
    throw new Error(`Pack "${pack.id}" has no playable puzzle kinds.`);
  }

  const count = Math.max(1, config.questionsPerRound);
  const questions: AnyQuestion[] = [];

  if (config.themedRounds) {
    const themeKind = kinds[roundIndex % kinds.length] as PuzzleKindId;
    for (let i = 0; i < count; i++) questions.push(buildQuestion(themeKind, pack, rng, usage));
    return { questions, usage, themeKind };
  }

  // Deal from a reshuffled deck of kinds so a mixed round spreads evenly
  // instead of clumping by chance.
  const deck: PuzzleKindId[] = [];
  while (deck.length < count) deck.push(...rng.shuffle(kinds));
  for (let i = 0; i < count; i++) {
    questions.push(buildQuestion(deck[i] as PuzzleKindId, pack, rng, usage));
  }
  return { questions, usage };
}
