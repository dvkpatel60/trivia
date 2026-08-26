import { getKind } from "./kinds/index.js";
import type {
  AnswerFor,
  AnyPublicQuestion,
  AnyQuestion,
  GradeResult,
  PublicQuestion,
  PuzzleKindId,
  Question,
} from "./types.js";

/**
 * The only way a question crosses the wire.
 *
 * Every secret a puzzle holds lives under `solution`, so publishing is one
 * omission rather than a denylist of field names that new kinds keep
 * forgetting to extend.
 */
export function toPublicQuestion<K extends PuzzleKindId>(question: Question<K>): PublicQuestion<K> {
  const { solution: _solution, ...visible } = question;
  return visible;
}

export function toPublicQuestions(questions: readonly AnyQuestion[]): AnyPublicQuestion[] {
  return questions.map((question) => toPublicQuestion(question) as AnyPublicQuestion);
}

/**
 * Grade one answer against its question.
 *
 * The cast is the one place the engine leaves the type system's care.
 * `question.kind` correlates `question` with the right grader at runtime, but
 * TypeScript cannot follow that correlation through an indexed lookup — so it
 * is asserted here, once, instead of in every caller.
 */
export function gradeQuestion(question: AnyQuestion, answer: unknown): GradeResult {
  const kind = getKind(question.kind) as {
    grade(q: AnyQuestion, a: unknown): GradeResult;
  };
  return kind.grade(question, (answer ?? null) as AnswerFor[PuzzleKindId] | null);
}

/** Plain-language correct answer, for reveal screens. Server-side only. */
export function describeSolution(question: AnyQuestion): string {
  const kind = getKind(question.kind) as { describeSolution(q: AnyQuestion): string };
  return kind.describeSolution(question);
}
