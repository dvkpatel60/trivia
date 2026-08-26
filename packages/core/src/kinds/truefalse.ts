import type { PuzzleKind } from "../kind.js";
import { at, NO_ANSWER } from "../kind.js";

/** Quick, and merciless. */
export const truefalse: PuzzleKind<"truefalse"> = {
  id: "truefalse",
  name: "True or False",
  description: "Quick, and merciless",
  icon: "scale",
  timeMultiplier: 0.65,
  itemsPerQuestion: 1,

  build(items) {
    const item = at(items, 0, "truefalse");
    return {
      kind: "truefalse",
      prompt: item.statement,
      view: { statement: item.statement },
      solution: {
        correct: item.answer,
        ...(item.note ? { note: item.note } : {}),
      },
    };
  },

  grade(question, answer) {
    if (!answer) return NO_ANSWER;
    const right = answer.value === question.solution.correct;
    if (right) return { fraction: 1, message: question.solution.note ?? "" };
    return { fraction: 0, message: question.solution.note ?? this.describeSolution(question) };
  },

  describeSolution(question) {
    return `It's ${question.solution.correct ? "true" : "false"}.`;
  },
};
