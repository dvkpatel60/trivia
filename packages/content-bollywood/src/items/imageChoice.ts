import { artMedia, type GeneratedArt, type ImageChoiceItem } from "@curio/core";

/**
 * Picture rounds, in two kinds.
 *
 * The first few are drawn here as SVG — flat bands of colour, pure geometry —
 * so the pack always has a working picture round with no binary assets and
 * nothing to fetch. The rest are generated: they carry an `art` block, and
 * `npm run art` turns each subject plus the pack's art direction into a file
 * under `apps/web/public/packs/bollywood/`.
 */

const bands = (top: string, bottom: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">` +
      `<rect width="120" height="40" fill="${top}"/>` +
      `<rect y="40" width="120" height="40" fill="${bottom}"/>` +
      `</svg>`,
  )}`;

const ERAS = ["The 1950s", "The 1970s", "The 1990s", "The 2010s"];

/*
 * Subjects are single, archetypal objects on purpose.
 *
 * The first pass asked for a chawl courtyard, a dabbawala's stacked tins, a
 * Filmfare statuette and an auto-rickshaw, and a general text-to-image model
 * rendered a European balcony, an unreadable striped slab, a woman in a
 * saree and a four-wheeled van. None of them could be answered from the
 * picture. What survives is what the model already knows how to draw: an
 * instrument, a field, a procession, a stall, a reel. That is the same
 * lesson as keeping a pack's subjects in one register — a picture round is
 * only a question if the picture carries the answer.
 */

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
  media: artMedia("bollywood", art, alt),
  options,
  // Subjects are written for the first option, and the engine shuffles.
  answer: 0,
});

export const imageChoice: ImageChoiceItem[] = [
  {
    prompt: "Which era does this poster palette belong to?",
    media: { src: bands("#f0ece1", "#2b2b2b"), alt: "Cream above near-black", aspect: 1.5 },
    options: ERAS,
    answer: 0,
    note: "Black and white, and hand-painted.",
  },
  {
    prompt: "Which era does this poster palette belong to?",
    media: { src: bands("#c8452f", "#e2a13a"), alt: "Burnt red above ochre", aspect: 1.5 },
    options: ERAS,
    answer: 1,
    note: "Hand-painted hoardings, in fire colours.",
  },
  {
    prompt: "Which era does this poster palette belong to?",
    media: { src: bands("#e9e4f0", "#d95d9a"), alt: "Pale lilac above hot pink", aspect: 1.5 },
    options: ERAS,
    answer: 2,
    note: "Chiffon, mustard fields and a lot of pink.",
  },
  {
    prompt: "Which era does this poster palette belong to?",
    media: { src: bands("#101820", "#3fa088"), alt: "Near-black above teal", aspect: 1.5 },
    options: ERAS,
    answer: 3,
    note: "Digital grade, teal and orange.",
  },

  /* ── generated ── */

  generated(
    {
      id: "object-tabla",
      subject:
        "a pair of hand drums, one small and wooden and one larger and metal, sitting on a cloth ring",
    },
    "A pair of hand drums on a cloth ring",
    "Which instrument is this?",
    ["Tabla", "Dholak", "Mridangam", "Pakhawaj"],
  ),
  generated(
    {
      id: "object-harmonium",
      subject:
        "a small boxed keyboard with hand-pumped bellows at the back, open on a low table",
      },
    "A small boxed keyboard with hand-pumped bellows",
    "Which instrument is this?",
    ["Harmonium", "Accordion", "Melodica", "Piano"],
  ),
  generated(
    {
      id: "place-mustardfield",
      subject:
        "a field of yellow flowering mustard stretching to a low horizon, a dirt track running through it",
    },
    "A field of yellow flowering mustard with a dirt track",
    "Which crop is in flower here?",
    ["Mustard", "Sunflower", "Cotton", "Sugarcane"],
  ),
  generated(
    {
      id: "scene-baraat",
      subject:
        "a wedding procession in a street at night, a decorated horse, a brass band and strings of lights carried on poles",
    },
    "A night wedding procession with a decorated horse and a brass band",
    "What is this procession called?",
    ["A baraat", "A vidaai", "A sangeet", "A mehndi"],
  ),
  generated(
    {
      id: "scene-chaistall",
      subject:
        "a roadside tea stall with a kettle on a burner, glass tumblers in a rack and a bench alongside",
    },
    "A roadside tea stall with a kettle, glass tumblers and a bench",
    "What is being sold here?",
    ["Chai", "Lassi", "Coffee", "Sugarcane juice"],
  ),
  generated(
    {
      id: "object-reel",
      subject:
        "a metal film reel lying open beside its round tin case, a length of film unspooled across the table",
    },
    "A metal film reel beside its tin case with film unspooled",
    "What is this?",
    ["A film reel", "A record", "A cable drum", "A clock spring"],
  ),
];
