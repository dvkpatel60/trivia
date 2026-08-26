import type { Atmosphere } from "./atmosphere.js";

/**
 * The vocabulary every other package speaks.
 *
 * A note on the shape of `Question`: the answer to a puzzle lives in a single
 * `solution` field rather than being scattered across the question object.
 * That is deliberate. Publishing a question to a client is `toPublicQuestion`,
 * which drops exactly one key. There is no list of secret field names to keep
 * in sync, so a new puzzle kind cannot leak its answer by forgetting to
 * register a field.
 */

/** A picture, diagram, or other visual a puzzle can hang off. */
export interface MediaRef {
  /** Absolute URL, app-relative path, or data URI. */
  src: string;
  /** Required: puzzles are unplayable for screen-reader users without it. */
  alt: string;
  /** Attribution, shown on the reveal screen rather than during play. */
  credit?: string;
  /** width / height, used to reserve layout space before the image loads. */
  aspect?: number;
}

export type PuzzleKindId =
  | "choice"
  | "truefalse"
  | "match"
  | "unscramble"
  | "oddOneOut"
  | "whoAmI"
  | "categorize"
  | "sequence"
  | "imageChoice";

/* ── authored content, one shape per kind ─────────────────────────────── */

export interface ChoiceItem {
  prompt: string;
  options: string[];
  /** Index into `options` as authored; shuffled at generation time. */
  answer: number;
  note?: string;
  media?: MediaRef;
  /** Author's escape hatch: keep the item in the file but out of rotation. */
  retired?: boolean;
}

export interface TrueFalseItem {
  statement: string;
  answer: boolean;
  /** Shown when the player gets it wrong; explains the trap. */
  note?: string;
  retired?: boolean;
}

export interface MatchItem {
  left: string;
  right: string;
  retired?: boolean;
}

export interface UnscrambleItem {
  word: string;
  hint: string;
  retired?: boolean;
}

export interface OddOneOutItem {
  items: string[];
  answer: number;
  why: string;
  retired?: boolean;
}

export interface WhoAmIItem {
  /** Ordered vague to obvious. Answering early scores more. */
  clues: string[];
  options: string[];
  answer: number;
  retired?: boolean;
}

export interface CategorizeItem {
  label: string;
  /** Must match a category id declared by the pack. */
  category: string;
  retired?: boolean;
}

export interface SequenceItem {
  title: string;
  /** Authored in the correct order; shuffled at generation time. */
  items: string[];
  retired?: boolean;
}

export interface ImageChoiceItem {
  prompt: string;
  media: MediaRef;
  options: string[];
  answer: number;
  note?: string;
  retired?: boolean;
}

export interface ItemFor {
  choice: ChoiceItem;
  truefalse: TrueFalseItem;
  match: MatchItem;
  unscramble: UnscrambleItem;
  oddOneOut: OddOneOutItem;
  whoAmI: WhoAmIItem;
  categorize: CategorizeItem;
  sequence: SequenceItem;
  imageChoice: ImageChoiceItem;
}

/* ── what the player sees ─────────────────────────────────────────────── */

export interface ChoiceView {
  options: string[];
}
export interface TrueFalseView {
  statement: string;
}
export interface MatchView {
  left: string[];
  right: string[];
}
export interface UnscrambleView {
  tiles: string[];
  length: number;
}
export interface OddOneOutView {
  options: string[];
}
export interface WhoAmIView {
  clues: string[];
  options: string[];
}
export interface CategorizeView {
  labels: string[];
  categories: Category[];
}
export interface SequenceView {
  items: string[];
}
export interface ImageChoiceView {
  options: string[];
}

export interface ViewFor {
  choice: ChoiceView;
  truefalse: TrueFalseView;
  match: MatchView;
  unscramble: UnscrambleView;
  oddOneOut: OddOneOutView;
  whoAmI: WhoAmIView;
  categorize: CategorizeView;
  sequence: SequenceView;
  imageChoice: ImageChoiceView;
}

/* ── what only the grader sees ────────────────────────────────────────── */

export interface ChoiceSolution {
  correct: number;
  note?: string;
}
export interface TrueFalseSolution {
  correct: boolean;
  note?: string;
}
export interface MatchSolution {
  /** left label -> right label */
  truth: Record<string, string>;
}
export interface UnscrambleSolution {
  word: string;
}
export interface OddOneOutSolution {
  correct: number;
  why: string;
}
export interface WhoAmISolution {
  correct: number;
}
export interface CategorizeSolution {
  /** Category id per label, positionally aligned with `view.labels`. */
  truth: string[];
}
export interface SequenceSolution {
  /** Correct final position for each item in `view.items`. */
  positions: number[];
}
export interface ImageChoiceSolution {
  correct: number;
  note?: string;
}

export interface SolutionFor {
  choice: ChoiceSolution;
  truefalse: TrueFalseSolution;
  match: MatchSolution;
  unscramble: UnscrambleSolution;
  oddOneOut: OddOneOutSolution;
  whoAmI: WhoAmISolution;
  categorize: CategorizeSolution;
  sequence: SequenceSolution;
  imageChoice: ImageChoiceSolution;
}

/* ── what the player sends back ───────────────────────────────────────── */

export interface ChoiceAnswer {
  choice: number;
}
export interface TrueFalseAnswer {
  value: boolean;
}
export interface MatchAnswer {
  pairs: Array<[string, string]>;
}
export interface UnscrambleAnswer {
  word: string;
}
export interface OddOneOutAnswer {
  choice: number;
}
export interface WhoAmIAnswer {
  choice: number;
  /** 0-based index of the last clue revealed when they committed. */
  clueIndex: number;
}
export interface CategorizeAnswer {
  /** Category id per label, positionally aligned with `view.labels`. */
  assignments: string[];
}
export interface SequenceAnswer {
  /** Item indices in the order the player arranged them. */
  order: number[];
}
export interface ImageChoiceAnswer {
  choice: number;
}

export interface AnswerFor {
  choice: ChoiceAnswer;
  truefalse: TrueFalseAnswer;
  match: MatchAnswer;
  unscramble: UnscrambleAnswer;
  oddOneOut: OddOneOutAnswer;
  whoAmI: WhoAmIAnswer;
  categorize: CategorizeAnswer;
  sequence: SequenceAnswer;
  imageChoice: ImageChoiceAnswer;
}

/* ── questions ────────────────────────────────────────────────────────── */

export interface Question<K extends PuzzleKindId = PuzzleKindId> {
  kind: K;
  prompt: string;
  media?: MediaRef[];
  view: ViewFor[K];
  /** Stripped by `toPublicQuestion` before a question crosses the wire. */
  solution: SolutionFor[K];
}

export type PublicQuestion<K extends PuzzleKindId = PuzzleKindId> = Omit<Question<K>, "solution">;

export type AnyQuestion = { [K in PuzzleKindId]: Question<K> }[PuzzleKindId];
export type AnyPublicQuestion = { [K in PuzzleKindId]: PublicQuestion<K> }[PuzzleKindId];
export type AnyAnswer = AnswerFor[PuzzleKindId];

/* ── grading ──────────────────────────────────────────────────────────── */

export interface GradeResult {
  /** 0..1. Partial credit is normal for match, categorize, and sequence. */
  fraction: number;
  /** Player-facing explanation, shown whether they were right or wrong. */
  message: string;
}

/* ── content packs ────────────────────────────────────────────────────── */

export interface Category {
  id: string;
  label: string;
  /** Optional flavour line, e.g. a house's animal. */
  sub?: string;
  color?: string;
}

export interface ContentPack {
  id: string;
  name: string;
  tagline: string;
  blurb: string;
  /** The mood the app derives this pack's whole palette and type from. */
  atmosphere: Atmosphere;
  /** Required if the pack ships `categorize` items. */
  categories?: Category[];
  items: { [K in PuzzleKindId]?: Array<ItemFor[K]> };
}

/* ── game configuration ───────────────────────────────────────────────── */

/**
 * How a game is paced.
 *
 * - `live`  — everyone answers the same question at the same time, on a
 *             shared server deadline. A party in one room or one call.
 * - `async` — the host opens a round and each player plays it whenever they
 *             like, on their own clock. A group chat over hours or days.
 * - `local` — one device, passed around. Never touches the network.
 */
export type Pacing = "live" | "async" | "local";

export interface GameConfig {
  packId: string;
  pacing: Pacing;
  rounds: number;
  questionsPerRound: number;
  basePoints: number;
  timerOn: boolean;
  seconds: number;
  speedBonus: boolean;
  streakBonus: boolean;
  /** Each round draws from a single kind instead of mixing. */
  themedRounds: boolean;
  /** Multiplayer: keep scores sealed until the host closes the round. */
  hideAnswers: boolean;
  /** Local pass-and-play: show a handoff screen between players. */
  passScreen: boolean;
  /**
   * Async only: close a round automatically this long after it opens.
   * null leaves it open until the host closes it.
   */
  roundOpenMinutes: number | null;
  kinds: Partial<Record<PuzzleKindId, boolean>>;
}
