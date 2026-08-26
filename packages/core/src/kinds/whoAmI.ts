import type { PuzzleKind } from "../kind.js";
import { at, NO_ANSWER } from "../kind.js";

/**
 * Clues arrive one at a time, vague first. Answering on the first clue is
 * worth full marks; each extra clue costs the player some of the score.
 */
const CLUE_MULTIPLIERS = [1, 0.7, 0.45];

export const whoAmI: PuzzleKind<"whoAmI"> = {
  id: "whoAmI",
  name: "Who Am I",
  description: "Guess early, score more",
  icon: "owl",
  timeMultiplier: 2,
  itemsPerQuestion: 1,

  build(items, { rng }) {
    const item = at(items, 0, "whoAmI");
    const order = rng.shuffle(item.options.map((_, i) => i));
    return {
      kind: "whoAmI",
      prompt: "Who am I?",
      view: {
        clues: item.clues.slice(0, CLUE_MULTIPLIERS.length),
        options: order.map((i) => at(item.options, i, "whoAmI option")),
      },
      solution: { correct: order.indexOf(item.answer) },
    };
  },

  grade(question, answer) {
    if (!answer) return NO_ANSWER;
    if (answer.choice !== question.solution.correct) {
      return { fraction: 0, message: this.describeSolution(question) };
    }
    const clueIndex = Math.min(
      Math.max(answer.clueIndex ?? 0, 0),
      CLUE_MULTIPLIERS.length - 1,
    );
    return {
      fraction: at(CLUE_MULTIPLIERS, clueIndex, "clue multiplier"),
      message: `Solved on clue ${clueIndex + 1}.`,
    };
  },

  describeSolution(question) {
    return `It was ${at(question.view.options, question.solution.correct, "whoAmI reveal")}.`;
  },
};

export { CLUE_MULTIPLIERS };
