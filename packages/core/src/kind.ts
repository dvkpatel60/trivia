import type {
  AnswerFor,
  ContentPack,
  GradeResult,
  ItemFor,
  PuzzleKindId,
  Question,
} from "./types.js";
import type { Rng } from "./rng.js";

export interface BuildContext {
  rng: Rng;
  pack: ContentPack;
}

/**
 * Everything the engine needs to know about one puzzle kind.
 *
 * Adding a kind means adding a file that exports one of these and registering
 * it in `kinds/index.ts`. Nothing else in the engine, the server, or the
 * content packs needs to change — only the web app has to supply a renderer.
 */
export interface PuzzleKind<K extends PuzzleKindId> {
  id: K;
  /** Shown on the setup screen. */
  name: string;
  description: string;
  /** Icon id the web app maps to an SVG symbol. */
  icon: string;
  /** Scales the round timer: a matching puzzle needs longer than a true/false. */
  timeMultiplier: number;
  /** How many authored items one generated question consumes. */
  itemsPerQuestion: number;
  /** Kinds that sort into pack-declared buckets need `pack.categories`. */
  needsCategories?: boolean;
  /** True when every item carries media, so hosts can skip it on slow links. */
  usesMedia?: boolean;
  /**
   * Narrows the pool before items are drawn.
   *
   * For kinds whose items only make sense beside their own kind — sorting
   * items that share a set of buckets, say. A question then draws from one
   * group rather than mixing houses with continents.
   */
  groupKey?(item: ItemFor[K]): string;

  build(items: Array<ItemFor[K]>, ctx: BuildContext): Question<K>;

  /** `answer` is null when the player ran out of time or never responded. */
  grade(question: Question<K>, answer: AnswerFor[K] | null): GradeResult;

  /** Plain-language correct answer, for the reveal screen. */
  describeSolution(question: Question<K>): string;
}

export const NO_ANSWER: GradeResult = { fraction: 0, message: "No answer submitted." };

/** Indexed access under `noUncheckedIndexedAccess`, with a loud failure. */
export function at<T>(items: readonly T[], index: number, what: string): T {
  const value = items[index];
  if (value === undefined) {
    throw new Error(`${what}: index ${index} out of range (length ${items.length})`);
  }
  return value;
}
