import type { CategorySet } from "@curio/core";

/**
 * The ways this pack sorts things.
 *
 * A sorting question draws from one set at a time, so the buckets on screen
 * always belong together. The engine knows nothing about houses or curses —
 * it only asks the pack what the categories are.
 */
export const categorySets: CategorySet[] = [
  {
    id: "houses",
    prompt: "Sort each one into a house.",
    categories: [
      { id: "gryffindor", label: "Gryffindor", sub: "Lion", color: "#c2543a" },
      { id: "slytherin", label: "Slytherin", sub: "Serpent", color: "#3f9c7d" },
      { id: "ravenclaw", label: "Ravenclaw", sub: "Eagle", color: "#4fa3c7" },
      { id: "hufflepuff", label: "Hufflepuff", sub: "Badger", color: "#e8b55c" },
    ],
  },
  {
    id: "creatures",
    prompt: "What sort of thing is it?",
    categories: [
      { id: "beast", label: "Beast", sub: "Flesh and claw", color: "#c2543a" },
      { id: "being", label: "Being", sub: "Reasoning mind", color: "#4fa3c7" },
      { id: "spirit", label: "Spirit", sub: "Never quite alive", color: "#8878d6" },
      { id: "plant", label: "Plant", sub: "Rooted", color: "#3f9c7d" },
    ],
  },
  {
    id: "magic",
    prompt: "Spell, potion, or object?",
    categories: [
      { id: "spell", label: "Spell", sub: "Cast aloud", color: "#e8b55c" },
      { id: "potion", label: "Potion", sub: "Brewed", color: "#3f9c7d" },
      { id: "object", label: "Object", sub: "Held in the hand", color: "#8878d6" },
    ],
  },
  {
    id: "places",
    prompt: "Where in the wizarding world?",
    categories: [
      { id: "hogwarts", label: "Hogwarts", sub: "The castle", color: "#c2543a" },
      { id: "london", label: "London", sub: "Hidden in plain sight", color: "#4fa3c7" },
      { id: "elsewhere", label: "Elsewhere", sub: "Further afield", color: "#8878d6" },
    ],
  },
];
