import type { ContentPack } from "../types.js";

/** A tiny pack that exercises every kind, used across the engine tests. */
export const fixturePack: ContentPack = {
  id: "fixture",
  name: "Fixture",
  tagline: "test pack",
  blurb: "Not for humans.",
  atmosphere: {
    hue: 276,
    mood: "enigmatic",
    signature: { accent: "#e8b55c", support: "#3f9c7d", warn: "#c2543a", extra: "#8878d6" },
    texture: ["grain"],
    display: "fraunces",
  },
  categorySets: [
    {
      id: "greek",
      prompt: "Alpha or beta?",
      categories: [
        { id: "alpha", label: "Alpha" },
        { id: "beta", label: "Beta" },
      ],
    },
    {
      id: "parity",
      prompt: "Odd or even?",
      categories: [
        { id: "odd", label: "Odd" },
        { id: "even", label: "Even" },
      ],
    },
  ],
  items: {
    choice: [
      { prompt: "Q1?", options: ["right1", "w1", "w2", "w3"], answer: 0 },
      { prompt: "Q2?", options: ["w1", "right2", "w2", "w3"], answer: 1, note: "because" },
      { prompt: "Q3?", options: ["w1", "w2", "right3", "w3"], answer: 2 },
      { prompt: "Q4?", options: ["w1", "w2", "w3", "right4"], answer: 3 },
      { prompt: "Q5?", options: ["right5", "w1", "w2", "w3"], answer: 0 },
      { prompt: "retired", options: ["a", "b"], answer: 0, retired: true },
    ],
    truefalse: [
      { statement: "true one", answer: true },
      { statement: "false one", answer: false, note: "nope" },
    ],
    match: [
      { left: "L1", right: "R1" },
      { left: "L2", right: "R2" },
      { left: "L3", right: "R3" },
      { left: "L4", right: "R4" },
    ],
    unscramble: [{ word: "PHOENIX", hint: "rises" }],
    oddOneOut: [{ items: ["a", "b", "c", "odd"], answer: 3, why: "it is odd" }],
    whoAmI: [
      {
        clues: ["vague", "warmer", "obvious"],
        options: ["target", "x", "y", "z"],
        answer: 0,
      },
    ],
    categorize: [
      { label: "one", set: "greek", category: "alpha" },
      { label: "two", set: "greek", category: "beta" },
      { label: "three", set: "greek", category: "alpha" },
      { label: "seven", set: "parity", category: "odd" },
      { label: "eight", set: "parity", category: "even" },
      { label: "nine", set: "parity", category: "odd" },
    ],
    sequence: [{ title: "Order these", items: ["first", "second", "third", "fourth"] }],
    connections: [
      {
        groups: [
          { label: "Reds", members: ["crimson", "scarlet", "ruby", "cherry"] },
          { label: "Blues", members: ["navy", "azure", "cobalt", "teal"] },
          { label: "Greens", members: ["emerald", "olive", "jade", "moss"] },
          { label: "Yellows", members: ["amber", "gold", "lemon", "ochre"] },
        ],
      },
      {
        groups: [
          { label: "Cats", members: ["lion", "tiger", "lynx", "puma"] },
          { label: "Dogs", members: ["wolf", "dingo", "coyote", "jackal"] },
          { label: "Birds", members: ["heron", "osprey", "grebe", "swift"] },
          { label: "Fish", members: ["carp", "tench", "roach", "bream"] },
        ],
      },
    ],
    imageChoice: [
      {
        prompt: "What is this?",
        media: { src: "data:image/svg+xml,<svg/>", alt: "a square" },
        options: ["square", "circle", "triangle", "hexagon"],
        answer: 0,
      },
    ],
  },
};
