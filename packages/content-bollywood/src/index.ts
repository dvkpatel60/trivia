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
 * Hindi cinema at full volume: 2000 to 2019.
 *
 * A pack is data: items, the categories its sorting puzzles use, and an
 * atmosphere the app themes itself with. It imports types from the engine
 * and nothing else — no pack can reach into game logic.
 *
 * The window is the point. A pack spanning the whole century asks a table to
 * hold Mughal-e-Azam and Gully Boy in the same round, and the questions
 * flatten into dates nobody at a party can place. Two decades that one room
 * mostly lived through gives every item a chance of being argued about —
 * which is the game.
 */
export const bollywoodPack: ContentPack = {
  id: "bollywood",
  name: "Bollywood",
  tagline: "The multiplex years, 2000–2019",
  blurb: "Two decades of Hindi cinema at its loudest — the hits, the item numbers, and the lines nobody has stopped quoting.",
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
     * A single-screen cinema on an opening night: the marquee over the
     * entrance, marigolds hung for the première, and the film running past.
     * The multiplex replaced the building over these two decades, but the
     * first-day-first-show crowd outside it is what the pack is about.
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
