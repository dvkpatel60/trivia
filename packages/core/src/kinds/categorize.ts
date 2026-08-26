import type { PuzzleKind } from "../kind.js";
import { at, NO_ANSWER } from "../kind.js";
import { tally } from "../text.js";

/**
 * Sort each item into one of the pack's declared buckets.
 *
 * Hogwarts houses in one set, creature natures in another, continents in a
 * third — the categories come from `pack.categorySets`, never from this file.
 * `groupKey` keeps a question inside a single set, so the buckets on screen
 * always belong together.
 */
export const categorize: PuzzleKind<"categorize"> = {
  id: "categorize",
  name: "Sort It",
  description: "Put each one in its place",
  icon: "hat",
  timeMultiplier: 1.4,
  itemsPerQuestion: 3,
  needsCategories: true,
  groupKey: (item) => item.set,

  build(items, { pack }) {
    const first = at(items, 0, "categorize");
    const set = (pack.categorySets ?? []).find((candidate) => candidate.id === first.set);

    if (!set || set.categories.length < 2) {
      throw new Error(
        `Pack "${pack.id}" has categorize items in set "${first.set}", but no such set with two or more categories.`,
      );
    }

    return {
      kind: "categorize",
      prompt: set.prompt,
      view: {
        labels: items.map((item) => item.label),
        categories: set.categories,
      },
      solution: { truth: items.map((item) => item.category) },
    };
  },

  grade(question, answer) {
    if (!answer || !Array.isArray(answer.assignments)) return NO_ANSWER;
    const total = question.solution.truth.length;
    let right = 0;
    question.solution.truth.forEach((category, index) => {
      if (answer.assignments[index] === category) right++;
    });
    return { fraction: total === 0 ? 0 : right / total, message: tally(right, total, "item") };
  },

  describeSolution(question) {
    const labelFor = (id: string) =>
      question.view.categories.find((category) => category.id === id)?.label ?? id;
    return question.view.labels
      .map((label, index) => `${label} — ${labelFor(question.solution.truth[index] ?? "")}`)
      .join("; ");
  },
};
