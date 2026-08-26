import type { ChoiceItem } from "@candlelight/core";

export const choice: ChoiceItem[] = [
  { prompt: "Which is the largest country by area?", options: ["Canada", "China", "Russia", "the United States"], answer: 2 },
  { prompt: "What is the capital of Australia?", options: ["Sydney", "Canberra", "Melbourne", "Perth"], answer: 1 },
  { prompt: "Which country has the most people?", options: ["China", "India", "Indonesia", "the United States"], answer: 1 },
  { prompt: "Which is the smallest country by area?", options: ["Monaco", "Nauru", "San Marino", "Vatican City"], answer: 3 },
  { prompt: "Mount Everest sits on the border of Nepal and which country?", options: ["India", "China", "Bhutan", "Pakistan"], answer: 1 },
  { prompt: "Which continent has no permanent residents?", options: ["Antarctica", "Australia", "South America", "Africa"], answer: 0 },
  { prompt: "Which is the deepest ocean?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], answer: 2 },
  { prompt: "Lake Baikal, the world's deepest lake, is in which country?", options: ["Mongolia", "Kazakhstan", "Russia", "China"], answer: 2 },
  { prompt: "Which is the largest hot desert?", options: ["Gobi", "Kalahari", "Sahara", "Arabian"], answer: 2 },
  { prompt: "Which country is home to the Serengeti?", options: ["Kenya", "Tanzania", "Uganda", "Zambia"], answer: 1 },
];
