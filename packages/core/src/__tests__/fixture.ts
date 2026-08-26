import type { ContentPack } from "../types.js";

/** A tiny pack that exercises every kind, used across the engine tests. */
export const fixturePack: ContentPack = {
  id: "fixture",
  name: "Fixture",
  tagline: "test pack",
  blurb: "Not for humans.",
  theme: {
    accent: "#e8b55c",
    support: "#3f9c7d",
    warn: "#c2543a",
    extra: "#8878d6",
    backdrop: "#0d0f14",
    surface: "#171a22",
  },
  categories: [
    { id: "alpha", label: "Alpha" },
    { id: "beta", label: "Beta" },
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
      { label: "one", category: "alpha" },
      { label: "two", category: "beta" },
      { label: "three", category: "alpha" },
    ],
    sequence: [{ title: "Order these", items: ["first", "second", "third", "fourth"] }],
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
