import type { SequenceItem } from "@curio/core";

/** Authored in the correct order; the engine shuffles before serving. */
export const sequence: SequenceItem[] = [
  { title: "Order by population, smallest first", items: ["Iceland", "New Zealand", "Canada", "Japan", "India"] },
  { title: "Order these rivers by length, shortest first", items: ["Thames", "Rhine", "Mississippi", "Nile"] },
  { title: "Order these cities from west to east", items: ["Lisbon", "Paris", "Vienna", "Istanbul"] },
  { title: "Order these peaks by height, shortest first", items: ["Mont Blanc", "Kilimanjaro", "Denali", "Everest"] },
  { title: "Order by area, smallest first", items: ["Vatican City", "Monaco", "Malta", "Iceland"] },
  { title: "Order these oceans by size, smallest first", items: ["Arctic", "Southern", "Indian", "Atlantic", "Pacific"] },
];
