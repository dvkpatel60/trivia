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

/** Draw `count` unused indices from `candidates`, recycling once exhausted. */
function drawIndices(
  rng: Rng,
  usage: KindUsage,
  kindId: PuzzleKindId,
  candidates: number[],
  count: number,
): number[] {
  const spent = usage[kindId] ?? [];
  let available = candidates.filter((index) => !spent.includes(index));

  if (available.length < count) {
    // This pool is spent. Forget what it has used rather than repeating an
    // item inside a single question.
    usage[kindId] = spent.filter((index) => !candidates.includes(index));
    available = candidates;
  }

  const drawn = rng.shuffle(available).slice(0, count);
  usage[kindId] = [...(usage[kindId] ?? []), ...drawn];
  return drawn;
}

/**
 * Which slice of the pool this question may draw from.
 *
 * Most kinds draw from everything. Kinds with a `groupKey` — sorting, whose
 * items only make sense beside others that share their buckets — pick one
 * group first, so a question never mixes houses with continents.
 */
function candidatesFor(
  kind: { groupKey?(item: never): string; itemsPerQuestion: number },
  pool: readonly unknown[],
  rng: Rng,
): number[] {
  const all = pool.map((_, index) => index);
  if (!kind.groupKey) return all;

  const groups = new Map<string, number[]>();
  for (const index of all) {
    const key = kind.groupKey(pool[index] as never);
    const bucket = groups.get(key);
    if (bucket) bucket.push(index);
    else groups.set(key, [index]);
  }

  const viable = [...groups.values()].filter((group) => group.length >= kind.itemsPerQuestion);
  return rng.pick(viable) ?? all;
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

  const candidates = candidatesFor(kind, pool, rng);
  if (candidates.length < kind.itemsPerQuestion) {
    throw new Error(
      `Pack "${pack.id}" cannot build a ${kindId} question: no group has ${kind.itemsPerQuestion} items.`,
    );
  }

  const picked = drawIndices(rng, usage, kindId, candidates, kind.itemsPerQuestion).map(
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
