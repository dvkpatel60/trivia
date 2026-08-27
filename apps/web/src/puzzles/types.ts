import type { AnswerFor, AnyPublicQuestion, PuzzleKindId } from "@curio/core";

export interface PuzzleProps<K extends PuzzleKindId = PuzzleKindId> {
  question: Extract<AnyPublicQuestion, { kind: K }>;
  /** True once the answer is locked in — during the reveal, or out of time. */
  locked: boolean;
  /**
   * Report the answer as it currently stands, or null while it isn't one yet.
   *
   * A puzzle *stages*; it never submits. The dock owns the single Submit
   * button, so every kind confirms in the same place with the same gesture,
   * and a player can change their mind right up until they tap it. Call this
   * as often as the working state changes — it is stable across renders, so
   * it is safe as an effect dependency.
   */
  onStage(answer: AnswerFor[K] | null): void;
  /**
   * Submit the staged answer, for a kind with a keyboard gesture of its own.
   *
   * Only a text field needs this: Enter has meant "send" in a text field
   * since long before this app, and losing it to a dock button would be a
   * regression. Everything else leaves it alone.
   */
  onSubmit?(): void;
  /** The right answer in prose, available only after the round reveals. */
  solution?: string | null;
  /**
   * Shared identity handed to whichever element the player commits with, so
   * it can travel into the verdict on the next screen. Kinds that have no
   * single "thing you tapped" simply ignore it.
   */
  morphId?: string;
}
