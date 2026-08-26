import type { PuzzleKind } from "../kind.js";
import { at, NO_ANSWER } from "../kind.js";

/**
 * Same shape as `choice`, but the prompt is a picture. Kept as its own kind
 * rather than an optional field on `choice` so a host can switch image
 * puzzles off wholesale (slow connection, projector, radio-style play) and so
 * renderers can lay it out image-first.
 */
export const imageChoice: PuzzleKind<"imageChoice"> = {
  id: "imageChoice",
  name: "Picture Round",
  description: "Name what you're looking at",
  icon: "frame",
  timeMultiplier: 1.2,
  itemsPerQuestion: 1,
  usesMedia: true,

  build(items, { rng }) {
    const item = at(items, 0, "imageChoice");
    const order = rng.shuffle(item.options.map((_, i) => i));
    return {
      kind: "imageChoice",
      prompt: item.prompt,
      media: [item.media],
      view: { options: order.map((i) => at(item.options, i, "imageChoice option")) },
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
    return `That was ${at(question.view.options, question.solution.correct, "imageChoice reveal")}.`;
  },
};
