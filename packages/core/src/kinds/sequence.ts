import type { PuzzleKind } from "../kind.js";
import { at, NO_ANSWER } from "../kind.js";
import { derange } from "../rng.js";
import { tally } from "../text.js";

/** Drag the shuffled items back into their correct order. */
export const sequence: PuzzleKind<"sequence"> = {
  id: "sequence",
  name: "Put In Order",
  description: "Sequence it correctly",
  icon: "hourglass",
  timeMultiplier: 1.8,
  itemsPerQuestion: 1,

  build(items, { rng }) {
    const item = at(items, 0, "sequence");
    // Shuffle the *indices* so the solution can record where each shown item belongs.
    const order = derange(
      item.items.map((_, i) => i),
      rng,
      (a, b) => a === b,
    );
    return {
      kind: "sequence",
      prompt: item.title,
      view: { items: order.map((i) => at(item.items, i, "sequence item")) },
      solution: { positions: order.slice() },
    };
  },

  grade(question, answer) {
    if (!answer || !Array.isArray(answer.order)) return NO_ANSWER;
    const total = question.view.items.length;
    let right = 0;
    answer.order.forEach((itemIndex, position) => {
      if (question.solution.positions[itemIndex] === position) right++;
    });
    return { fraction: total === 0 ? 0 : right / total, message: tally(right, total, "item") };
  },

  describeSolution(question) {
    return question.view.items
      .map((label, i) => ({ label, position: at(question.solution.positions, i, "sequence reveal") }))
      .sort((a, b) => a.position - b.position)
      .map((entry, i) => `${i + 1}. ${entry.label}`)
      .join("  ");
  },
};
