import type { CategorySet } from "@curio/core";

/** Atlas sorts by where a thing is, and by what kind of thing it is. */
export const categorySets: CategorySet[] = [
  {
    id: "continents",
    prompt: "Which continent?",
    categories: [
      { id: "africa", label: "Africa", color: "#e07a5f" },
      { id: "asia", label: "Asia", color: "#f2cc8f" },
      { id: "europe", label: "Europe", color: "#4fa3c7" },
      { id: "americas", label: "Americas", color: "#6fb98f" },
      { id: "oceania", label: "Oceania", color: "#8878d6" },
    ],
  },
  {
    id: "water",
    prompt: "Sea, lake, or river?",
    categories: [
      { id: "sea", label: "Sea", color: "#4fa3c7" },
      { id: "lake", label: "Lake", color: "#6fb98f" },
      { id: "river", label: "River", color: "#f2cc8f" },
    ],
  },
];
