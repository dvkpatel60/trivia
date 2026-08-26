import type { ImageChoiceItem } from "@curio/core";

/**
 * A picture round drawn as SVG rather than shipped as image files.
 *
 * Flags are simple geometry, so building them here keeps the pack a single
 * self-contained module: nothing to host, nothing to fetch, and no binary
 * assets in git. A pack with photographs would instead point `media.src` at
 * files under `apps/web/public/packs/<id>/` or at a CDN — the engine only
 * ever sees a string.
 */

const svg = (body: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">${body}</svg>`,
  )}`;

const verticalBands = (left: string, middle: string, right: string): string =>
  svg(
    `<rect width="40" height="80" fill="${left}"/>` +
      `<rect x="40" width="40" height="80" fill="${middle}"/>` +
      `<rect x="80" width="40" height="80" fill="${right}"/>`,
  );

const horizontalBands = (top: string, middle: string, bottom: string): string =>
  svg(
    `<rect width="120" height="26.7" fill="${top}"/>` +
      `<rect y="26.7" width="120" height="26.6" fill="${middle}"/>` +
      `<rect y="53.3" width="120" height="26.7" fill="${bottom}"/>`,
  );

/** A Nordic cross: the upright sits left of centre. */
const nordicCross = (field: string, cross: string): string =>
  svg(
    `<rect width="120" height="80" fill="${field}"/>` +
      `<rect x="36" width="14" height="80" fill="${cross}"/>` +
      `<rect y="33" width="120" height="14" fill="${cross}"/>`,
  );

const centredCross = (field: string, cross: string): string =>
  svg(
    `<rect width="120" height="80" fill="${field}"/>` +
      `<rect x="53" y="18" width="14" height="44" fill="${cross}"/>` +
      `<rect x="38" y="33" width="44" height="14" fill="${cross}"/>`,
  );

const disc = (field: string, circle: string): string =>
  svg(`<rect width="120" height="80" fill="${field}"/><circle cx="60" cy="40" r="22" fill="${circle}"/>`);

const OPTIONS = {
  japan: ["Japan", "Bangladesh", "Palau", "South Korea"],
  france: ["France", "Netherlands", "Italy", "Russia"],
  sweden: ["Sweden", "Norway", "Finland", "Denmark"],
  swiss: ["Switzerland", "Denmark", "Georgia", "England"],
  germany: ["Germany", "Belgium", "Austria", "Lithuania"],
  austria: ["Austria", "Latvia", "Poland", "Indonesia"],
} as const;

export const imageChoice: ImageChoiceItem[] = [
  {
    prompt: "Which country's flag is this?",
    media: { src: disc("#ffffff", "#bc002d"), alt: "A red circle centred on a white field", aspect: 1.5 },
    options: [...OPTIONS.japan],
    answer: 0,
  },
  {
    prompt: "Which country's flag is this?",
    media: {
      src: verticalBands("#002395", "#ffffff", "#ed2939"),
      alt: "Three vertical bands: blue, white, red",
      aspect: 1.5,
    },
    options: [...OPTIONS.france],
    answer: 0,
  },
  {
    prompt: "Which country's flag is this?",
    media: {
      src: nordicCross("#005293", "#fecb00"),
      alt: "A yellow Nordic cross on a blue field",
      aspect: 1.5,
    },
    options: [...OPTIONS.sweden],
    answer: 0,
  },
  {
    prompt: "Which country's flag is this?",
    media: {
      src: centredCross("#d52b1e", "#ffffff"),
      alt: "A white cross centred on a red field",
      aspect: 1.5,
    },
    options: [...OPTIONS.swiss],
    answer: 0,
  },
  {
    prompt: "Which country's flag is this?",
    media: {
      src: horizontalBands("#000000", "#dd0000", "#ffce00"),
      alt: "Three horizontal bands: black, red, gold",
      aspect: 1.5,
    },
    options: [...OPTIONS.germany],
    answer: 0,
  },
  {
    prompt: "Which country's flag is this?",
    media: {
      src: horizontalBands("#ed2939", "#ffffff", "#ed2939"),
      alt: "Three horizontal bands: red, white, red",
      aspect: 1.5,
    },
    options: [...OPTIONS.austria],
    answer: 0,
  },
];
