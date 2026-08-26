import type { PuzzleKind } from "../kind.js";
import { at, NO_ANSWER } from "../kind.js";
import { normalizeWord } from "../text.js";
import { derange } from "../rng.js";

/** Letters, jumbled. */
export const unscramble: PuzzleKind<"unscramble"> = {
  id: "unscramble",
  name: "Unscramble",
  description: "Letters, jumbled",
  icon: "key",
  timeMultiplier: 1.5,
  itemsPerQuestion: 1,

  build(items, { rng }) {
    const item = at(items, 0, "unscramble");
    const letters = item.word.split("");
    return {
      kind: "unscramble",
      prompt: item.hint,
      view: {
        tiles: derange(letters, rng, (a, b) => a === b),
        length: letters.length,
      },
      solution: { word: item.word },
    };
  },

  grade(question, answer) {
    if (!answer) return NO_ANSWER;
    const right = normalizeWord(answer.word ?? "") === normalizeWord(question.solution.word);
    return right
      ? { fraction: 1, message: "" }
      : { fraction: 0, message: this.describeSolution(question) };
  },

  describeSolution(question) {
    return `The word was ${question.solution.word}.`;
  },
};
