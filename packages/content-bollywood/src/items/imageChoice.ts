import { artMedia, type GeneratedArt, type ImageChoiceItem } from "@curio/core";

/**
 * Picture rounds, in two kinds.
 *
 * The first few are drawn here as SVG — flat bands and shapes, pure geometry —
 * so the pack always has a working picture round with no binary assets and
 * nothing to fetch. The rest are generated: they carry an `art` block, and
 * `npm run art` turns each subject plus the pack's art direction into a file
 * under `apps/web/public/packs/bollywood/`.
 *
 * The hand-drawn four used to be pairs of colour bands asking which decade a
 * poster palette came from. That question dies with a pack that only spans
 * two decades — cream over black is not an answer anyone can give about the
 * gap between 2004 and 2016 — so they draw equipment instead. A picture round
 * is only a question if the picture carries the answer.
 */

const svg = (body: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">${body}</svg>`,
  )}`;

/** Three stumps, two bails, a strip of grass. */
const stumps = svg(
  `<rect width="120" height="80" fill="#f0e6d2"/>` +
    `<rect y="62" width="120" height="18" fill="#3fa088"/>` +
    `<rect x="46" y="20" width="6" height="46" fill="#8a5a2b"/>` +
    `<rect x="57" y="20" width="6" height="46" fill="#8a5a2b"/>` +
    `<rect x="68" y="20" width="6" height="46" fill="#8a5a2b"/>` +
    `<rect x="47" y="15" width="15" height="4" fill="#c8452f"/>` +
    `<rect x="58" y="15" width="15" height="4" fill="#c8452f"/>`,
);

/** A hooked stick and a ball on turf. */
const hockeyStick = svg(
  `<rect width="120" height="80" fill="#f0e6d2"/>` +
    `<rect y="58" width="120" height="22" fill="#3fa088"/>` +
    `<path d="M40 12 L50 12 L60 52 L48 52 Z" fill="#8a5a2b"/>` +
    `<path d="M48 52 L60 52 Q76 54 76 66 L64 66 Q64 60 48 62 Z" fill="#8a5a2b"/>` +
    `<circle cx="92" cy="64" r="7" fill="#c8452f"/>`,
);

/** A circular mat inside a square one. */
const wrestlingMat = svg(
  `<rect width="120" height="80" fill="#f0e6d2"/>` +
    `<rect x="18" y="6" width="84" height="68" fill="#c8452f"/>` +
    `<circle cx="60" cy="40" r="27" fill="#e2a13a"/>` +
    `<circle cx="60" cy="40" r="14" fill="none" stroke="#c8452f" stroke-width="3"/>`,
);

/** Lanes, and a line to break. */
const runningTrack = svg(
  `<rect width="120" height="80" fill="#3fa088"/>` +
    `<rect y="14" width="120" height="52" fill="#c8452f"/>` +
    `<rect y="26" width="120" height="2" fill="#f0e6d2"/>` +
    `<rect y="38" width="120" height="2" fill="#f0e6d2"/>` +
    `<rect y="50" width="120" height="2" fill="#f0e6d2"/>` +
    `<rect x="86" y="14" width="4" height="52" fill="#f0e6d2"/>`,
);

/*
 * Subjects are single, archetypal objects on purpose.
 *
 * The first pass asked for a chawl courtyard, a dabbawala's stacked tins, a
 * Filmfare statuette and an auto-rickshaw, and a general text-to-image model
 * rendered a European balcony, an unreadable striped slab, a woman in a
 * saree and a four-wheeled van. None of them could be answered from the
 * picture. What survives is what the model already knows how to draw: an
 * instrument, a field, a procession, a stall, a reel.
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
  note?: string,
): ImageChoiceItem => ({
  prompt,
  art,
  media: artMedia("bollywood", art, alt),
  options,
  // Subjects are written for the first option, and the engine shuffles.
  answer: 0,
  ...(note ? { note } : {}),
});

export const imageChoice: ImageChoiceItem[] = [
  {
    prompt: "Which sport is played with this?",
    media: { src: stumps, alt: "Three stumps and two bails on a strip of grass", aspect: 1.5 },
    options: ["Cricket", "Field hockey", "Kabaddi", "Wrestling"],
    answer: 0,
    note: "Lagaan spends its last hour in front of exactly this.",
  },
  {
    prompt: "Which sport is played with this?",
    media: { src: hockeyStick, alt: "A hooked stick and a ball on turf", aspect: 1.5 },
    options: ["Field hockey", "Cricket", "Boxing", "Wrestling"],
    answer: 0,
    note: "Chak De! India, and seventy minutes.",
  },
  {
    prompt: "Which sport is contested on this?",
    media: { src: wrestlingMat, alt: "A circular mat inside a square one", aspect: 1.5 },
    options: ["Wrestling", "Boxing", "Kabaddi", "Judo"],
    answer: 0,
    note: "Dangal and Sultan both end here.",
  },
  {
    prompt: "Which sport is this ground marked for?",
    media: { src: runningTrack, alt: "Marked lanes with a finish line across them", aspect: 1.5 },
    options: ["Athletics", "Swimming", "Cycling", "Boxing"],
    answer: 0,
    note: "Bhaag Milkha Bhaag, and a fourth place at Rome.",
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
    "Band Baaja Baaraat planned these for a living.",
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
