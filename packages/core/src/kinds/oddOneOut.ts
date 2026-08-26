import type { PuzzleKind } from "../kind.js";
import { at, NO_ANSWER } from "../kind.js";

/** Three belong, one doesn't. */
export const oddOneOut: PuzzleKind<"oddOneOut"> = {
  id: "oddOneOut",
  name: "Odd One Out",
  description: "Three belong, one doesn't",
  icon: "eye",
  timeMultiplier: 1,
  itemsPerQuestion: 1,

  build(items, { rng }) {
    const item = at(items, 0, "oddOneOut");
    const order = rng.shuffle(item.items.map((_, i) => i));
    return {
      kind: "oddOneOut",
      prompt: "Which one doesn't belong?",
      view: { options: order.map((i) => at(item.items, i, "oddOneOut option")) },
      solution: { correct: order.indexOf(item.answer), why: item.why },
    };
  },

  grade(question, answer) {
    if (!answer) return NO_ANSWER;
    const right = answer.choice === question.solution.correct;
    return { fraction: right ? 1 : 0, message: question.solution.why };
  },

  describeSolution(question) {
    const odd = at(question.view.options, question.solution.correct, "oddOneOut reveal");
    return `${odd} — ${question.solution.why}`;
  },
};
