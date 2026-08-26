import type { Category } from "@candlelight/core";

/**
 * The buckets `categorize` puzzles sort into. The engine knows nothing about
 * houses — it just asks the pack what the categories are.
 */
export const houses: Category[] = [
  { id: "gryffindor", label: "Gryffindor", sub: "Lion", color: "#c2543a" },
  { id: "slytherin", label: "Slytherin", sub: "Serpent", color: "#3f9c7d" },
  { id: "ravenclaw", label: "Ravenclaw", sub: "Eagle", color: "#4fa3c7" },
  { id: "hufflepuff", label: "Hufflepuff", sub: "Badger", color: "#e8b55c" },
];
