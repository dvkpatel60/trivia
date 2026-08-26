import type { PuzzleKind } from "../kind.js";
import { NO_ANSWER } from "../kind.js";
import { tally } from "../text.js";

/**
 * Sort each item into one of the pack's declared buckets. Hogwarts houses in
 * one pack, continents or phyla in another — the categories come from
 * `pack.categories`, never from this file.
 */
export const categorize: PuzzleKind<"categorize"> = {
  id: "categorize",
  name: "Sort It",
  description: "Put each one in its place",
  icon: "hat",
  timeMultiplier: 1.4,
  itemsPerQuestion: 3,
  needsCategories: true,

  build(items, { pack }) {
    const categories = pack.categories ?? [];
    if (categories.length < 2) {
      throw new Error(`Pack "${pack.id}" ships categorize items but declares no categories.`);
    }
    return {
      kind: "categorize",
      prompt: `Sort each one.`,
      view: {
        labels: items.map((item) => item.label),
        categories,
      },
      solution: { truth: items.map((item) => item.category) },
    };
  },

  grade(question, answer) {
    if (!answer || !Array.isArray(answer.assignments)) return NO_ANSWER;
    const total = question.solution.truth.length;
    let right = 0;
    question.solution.truth.forEach((category, i) => {
      if (answer.assignments[i] === category) right++;
    });
    return { fraction: total === 0 ? 0 : right / total, message: tally(right, total, "item") };
  },

  describeSolution(question) {
    const labelFor = (id: string) =>
      question.view.categories.find((category) => category.id === id)?.label ?? id;
    return question.view.labels
      .map((label, i) => `${label} — ${labelFor(question.solution.truth[i] ?? "")}`)
      .join("; ");
  },
};
