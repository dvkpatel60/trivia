import type { ContentPack } from "@curio/core";

import { categorySets } from "./categories.js";
import { choice } from "./items/choice.js";
import { truefalse } from "./items/truefalse.js";
import { match } from "./items/match.js";
import { unscramble } from "./items/unscramble.js";
import { oddOneOut } from "./items/oddOneOut.js";
import { whoAmI } from "./items/whoAmI.js";
import { categorize } from "./items/categorize.js";
import { connections } from "./items/connections.js";
import { sequence } from "./items/sequence.js";
import { imageChoice } from "./items/imageChoice.js";

/**
 * A century of Hindi cinema.
 *
 * A pack is data: items, the categories its sorting puzzles use, and an
 * atmosphere the app themes itself with. It imports types from the engine
 * and nothing else — no pack can reach into game logic.
 */
export const bollywoodPack: ContentPack = {
  id: "bollywood",
  name: "Bollywood",
  tagline: "A century of Hindi cinema",
  blurb: "Songs, dynasties, and the films everyone can quote.",
  atmosphere: {
    /*
     * Marigold, against a ground pulled almost to black.
     *
     * `warm` rather than `enigmatic`: a hand-painted hoarding is lit, not
     * mysterious, and the warm ladder gives the surfaces enough amber that
     * the accent reads as a bulb rather than as a highlighter.
     */
    hue: 34,
    mood: "warm",
    signature: {
      accent: "#e8a33d",
      support: "#3fa088",
      warn: "#e0653f",
      extra: "#8b6ad4",
    },
    /* The beam from the back of the hall, and the dark at the edges. */
    texture: ["projector", "vignette"],
    /*
     * A single-screen cinema: the marquee over the entrance, marigolds hung
     * for the opening, and the film running past. It used to declare
     * `embers` and `planes` — Candlelight's candle sparks and Atlas's
     * aeroplanes — which were what existed rather than what belonged.
     */
    scenery: ["bulbs", "garland", "filmstrip"],
    display: "spaceGrotesk",
  },
  /**
   * Every generated image in this pack is a hand-painted hoarding: flat
   * poster colour, hard light, and a single subject filling the frame — so a
   * picture round reads as a row of billboards from one street rather than
   * four unrelated pictures.
   */
  art: {
    style:
      "hand-painted Indian film poster illustration, bold flat brushwork, saturated poster colour, hard directional light, mid-century billboard style",
    palette: "marigold yellow, vermilion red, deep teal, ink black outlines, warm cream ground",
    composition: "single subject centred and filling the frame, plain flat background, no depth of field",
    avoid: "photorealism, 3d render, neon, cartoon, anime, western comic art",
  },
  categorySets,
  items: {
    choice,
    truefalse,
    match,
    unscramble,
    oddOneOut,
    whoAmI,
    categorize,
    connections,
    sequence,
    imageChoice,
  },
};

export default bollywoodPack;
