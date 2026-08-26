import type { PuzzleKind } from "../kind.js";
import { NO_ANSWER } from "../kind.js";
import { tally } from "../text.js";

/**
 * Pair each left-hand item with its right-hand counterpart. The pack decides
 * what the columns mean — spells to effects, capitals to countries, elements
 * to symbols — so the kind itself carries no topic.
 */
export const match: PuzzleKind<"match"> = {
  id: "match",
  name: "Pair Up",
  description: "Match each item to its partner",
  icon: "wand",
  timeMultiplier: 2,
  itemsPerQuestion: 4,

  build(items, { rng }) {
    return {
      kind: "match",
      prompt: "Pair each item with its match.",
      view: {
        left: items.map((pair) => pair.left),
        right: rng.shuffle(items.map((pair) => pair.right)),
      },
      solution: {
        truth: Object.fromEntries(items.map((pair) => [pair.left, pair.right])),
      },
    };
  },

  grade(question, answer) {
    if (!answer || !Array.isArray(answer.pairs)) return NO_ANSWER;
    const chosen = new Map<string, string>();
    for (const pair of answer.pairs) {
      if (Array.isArray(pair) && pair[0] && pair[1]) chosen.set(pair[0], pair[1]);
    }
    const total = question.view.left.length;
    let right = 0;
    for (const left of question.view.left) {
      if (chosen.get(left) === question.solution.truth[left]) right++;
    }
    return { fraction: total === 0 ? 0 : right / total, message: tally(right, total, "pair") };
  },

  describeSolution(question) {
    return question.view.left.map((left) => `${left} — ${question.solution.truth[left]}`).join("; ");
  },
};
