import type { PuzzleKind } from "../kind.js";
import { at, NO_ANSWER } from "../kind.js";

/** Four options, one truth. The backbone kind every pack ships. */
export const choice: PuzzleKind<"choice"> = {
  id: "choice",
  name: "Trivia",
  description: "Four options, one truth",
  icon: "book",
  timeMultiplier: 1,
  itemsPerQuestion: 1,

  build(items, { rng }) {
    const item = at(items, 0, "choice");
    const order = rng.shuffle(item.options.map((_, i) => i));
    return {
      kind: "choice",
      prompt: item.prompt,
      ...(item.media ? { media: [item.media] } : {}),
      view: { options: order.map((i) => at(item.options, i, "choice option")) },
      solution: {
        correct: order.indexOf(item.answer),
        ...(item.note ? { note: item.note } : {}),
      },
    };
  },

  grade(question, answer) {
    if (!answer) return NO_ANSWER;
    const right = answer.choice === question.solution.correct;
    if (right) return { fraction: 1, message: question.solution.note ?? "" };
    return { fraction: 0, message: question.solution.note ?? this.describeSolution(question) };
  },

  describeSolution(question) {
    return `The answer was ${at(question.view.options, question.solution.correct, "choice reveal")}.`;
  },
};
