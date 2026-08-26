import { artMedia, type GeneratedArt, type ImageChoiceItem } from "@curio/core";

/**
 * Picture rounds, in two kinds.
 *
 * The first few are drawn here as SVG — house colours, pure geometry — so the
 * pack always has a working picture round with no binary assets and nothing
 * to fetch. The rest are generated: they carry an `art` block, and
 * `npm run art` turns each subject plus the pack's art direction into a file
 * under `apps/web/public/packs/hogwarts/`.
 */

const bands = (top: string, bottom: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">` +
      `<rect width="120" height="40" fill="${top}"/>` +
      `<rect y="40" width="120" height="40" fill="${bottom}"/>` +
      `</svg>`,
  )}`;

const HOUSES = ["Gryffindor", "Slytherin", "Ravenclaw", "Hufflepuff"];

/**
 * One generated item.
 *
 * The subject is plain description only — no style, no colours, no camera.
 * Those come from the pack's art direction, which is the whole reason a
 * picture round looks like a set rather than four unrelated pictures.
 */
const generated = (
  art: GeneratedArt,
  alt: string,
  prompt: string,
  options: string[],
): ImageChoiceItem => ({
  prompt,
  art,
  media: artMedia("hogwarts", art, alt),
  options,
  // Subjects are written for the first option, and the engine shuffles.
  answer: 0,
});

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

  /* ── generated ── */

  generated(
    {
      id: "creature-phoenix",
      subject:
        "a majestic crimson and gold firebird perched on a stone plinth, wings half spread, embers falling from its feathers",
    },
    "A crimson and gold firebird perched on a stone plinth, embers falling from its wings",
    "What is this creature?",
    ["A phoenix", "A griffin", "An augurey", "A firecrab"],
  ),
  generated(
    {
      id: "creature-hippogriff",
      subject:
        "a proud beast with the head and front talons of an eagle and the body and hindquarters of a grey horse, standing in a courtyard",
    },
    "A beast with an eagle's head and talons and a grey horse's body, standing in a courtyard",
    "What is this creature?",
    ["A hippogriff", "A thestral", "A centaur", "A chimaera"],
  ),
  generated(
    {
      id: "object-pensieve",
      subject:
        "a wide shallow carved stone basin on a pedestal, filled with a swirling silvery liquid that glows faintly",
    },
    "A carved stone basin on a pedestal filled with swirling silver liquid",
    "What object is this?",
    ["A Pensieve", "A cauldron", "A scrying bowl", "A font"],
  ),
  generated(
    {
      id: "object-timeturner",
      subject:
        "a small golden hourglass suspended inside three nested rotating rings on a fine chain, resting on dark velvet",
    },
    "A small golden hourglass inside three nested rings on a chain, on dark velvet",
    "What object is this?",
    ["A Time-Turner", "A Sneakoscope", "A Remembrall", "A Deluminator"],
  ),
  generated(
    {
      id: "place-greathall",
      subject:
        "a vast medieval banqueting hall with four long wooden tables, hundreds of candles floating in mid air, and an enchanted ceiling showing a starry night sky",
    },
    "A vast hall with four long tables, floating candles, and a ceiling showing a starry sky",
    "Where is this?",
    ["The Great Hall", "The Room of Requirement", "The Leaky Cauldron", "Gringotts"],
  ),
];
