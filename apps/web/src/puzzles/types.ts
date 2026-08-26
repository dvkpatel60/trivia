import type { AnswerFor, AnyPublicQuestion, PuzzleKindId } from "@candlelight/core";

export interface PuzzleProps<K extends PuzzleKindId = PuzzleKindId> {
  question: Extract<AnyPublicQuestion, { kind: K }>;
  /** True once the answer is locked in — during the reveal, or out of time. */
  locked: boolean;
  /** Called once, when the player commits. */
  onCommit(answer: AnswerFor[K]): void;
  /** The right answer in prose, available only after the round reveals. */
  solution?: string | null;
}
