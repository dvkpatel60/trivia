import type { ImageChoiceItem } from "@curio/core";

/**
 * A picture round built from house colours rather than shipped artwork, so
 * the pack stays self-contained: no binary assets, no external hosts, and
 * nothing for the artifact CSP or an offline device to fail to load.
 *
 * Real packs can point `media.src` at anything — a bundled file under
 * `apps/web/public`, a CDN URL, or a data URI like these.
 */
const bands = (top: string, bottom: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">` +
      `<rect width="120" height="40" fill="${top}"/>` +
      `<rect y="40" width="120" height="40" fill="${bottom}"/>` +
      `</svg>`,
  )}`;

const HOUSES = ["Gryffindor", "Slytherin", "Ravenclaw", "Hufflepuff"];

export const imageChoice: ImageChoiceItem[] = [
  {
    prompt: "Whose colours are these?",
    media: { src: bands("#740001", "#d3a625"), alt: "Scarlet above gold", aspect: 1.5 },
    options: HOUSES,
    answer: 0,
    note: "Scarlet and gold.",
  },
  {
    prompt: "Whose colours are these?",
    media: { src: bands("#1a472a", "#aaaaaa"), alt: "Dark green above silver", aspect: 1.5 },
    options: HOUSES,
    answer: 1,
    note: "Green and silver.",
  },
  {
    prompt: "Whose colours are these?",
    media: { src: bands("#0e1a40", "#946b2d"), alt: "Midnight blue above bronze", aspect: 1.5 },
    options: HOUSES,
    answer: 2,
    note: "Blue and bronze.",
  },
  {
    prompt: "Whose colours are these?",
    media: { src: bands("#ecb939", "#372e29"), alt: "Yellow above near-black", aspect: 1.5 },
    options: HOUSES,
    answer: 3,
    note: "Yellow and black.",
  },
];
