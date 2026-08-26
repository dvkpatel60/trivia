import type { PuzzleKind } from "../kind.js";
import { at, NO_ANSWER } from "../kind.js";
import { tally } from "../text.js";

/**
 * Sixteen tiles hiding four groups of four.
 *
 * The best party puzzle there is, because the difficulty is not recall — it
 * is that most tiles look like they belong to two groups at once, and only
 * one arrangement resolves all four. Partial credit per group found, so a
 * table that spots two still scores.
 */
export const connections: PuzzleKind<"connections"> = {
  id: "connections",
  name: "Connections",
  description: "Sixteen tiles, four hidden groups",
  icon: "grid",
  timeMultiplier: 3,
  itemsPerQuestion: 1,

  build(items, { rng }) {
    const item = at(items, 0, "connections");
    const tiles = rng.shuffle(item.groups.flatMap((group) => group.members));
    const first = at(item.groups, 0, "connections group");

    return {
      kind: "connections",
      prompt: "Find the four groups.",
      view: {
        tiles,
        groupSize: first.members.length,
        groupCount: item.groups.length,
      },
      solution: {
        groups: item.groups.map((group) => ({ label: group.label, members: [...group.members] })),
      },
    };
  },

  grade(question, answer) {
    if (!answer || !Array.isArray(answer.groups)) return NO_ANSWER;

    const key = (members: readonly string[]) => [...members].sort().join(" ");
    const wanted = new Set(question.solution.groups.map((group) => key(group.members)));

    // A group counts only if it matches exactly, and each solution group can
    // be claimed once — otherwise submitting the same four tiles four times
    // would score full marks.
    const claimed = new Set<string>();
    for (const group of answer.groups) {
      if (!Array.isArray(group)) continue;
      const signature = key(group);
      if (wanted.has(signature)) claimed.add(signature);
    }

    const total = question.solution.groups.length;
    return {
      fraction: total === 0 ? 0 : claimed.size / total,
      message: tally(claimed.size, total, "group"),
    };
  },

  describeSolution(question) {
    return question.solution.groups
      .map((group) => `${group.label}: ${group.members.join(", ")}`)
      .join(" | ");
  },
};
