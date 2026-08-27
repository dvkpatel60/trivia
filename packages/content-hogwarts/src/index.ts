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
 * The pack the game was originally built around.
 *
 * A pack is data: items, the categories its sorting puzzles use, and a
 * palette the app themes itself with. It imports types from the engine and
 * nothing else — no pack can reach into game logic.
 */
export const hogwartsPack: ContentPack = {
  id: "hogwarts",
  name: "Harry Potter",
  tagline: "Wizarding world trivia",
  blurb: "Spells, houses, and the people who made a mess of them.",
  atmosphere: {
    // Indigo pulled almost to black, with candle-gold used sparingly: light
    // appears only on the things you can actually do something with.
    hue: 276,
    mood: "enigmatic",
    signature: {
      accent: "#e8b55c",
      support: "#3f9c7d",
      warn: "#c2543a",
      extra: "#8878d6",
    },
    // Two soft washes and a vignette: the night this pack was built around.
    texture: ["nightGlow", "vignette"],
    // A sky over it, candles burning upward, embers, and a key drifting past.
    scenery: ["stars", "candles", "embers", "keys"],
    /*
     * Cormorant Garamond over letterspaced monospace — the pairing the
     * earlier wizarding build used, and the thing people actually responded
     * to. The palette was already identical; this is what was missing.
     */
    display: "cormorant",
    interface: "plexMono",
  },
  /**
   * Every generated image in this pack is painted, lit by one warm source,
   * and darkened at the edges — so a picture round reads as a set of plates
   * from the same book rather than four unrelated pictures.
   */
  art: {
    style:
      "dark atmospheric fantasy illustration, magical candlelit scene, rich jewel tones, detailed painterly style, dramatic lighting with warm golden highlights against deep shadows",
    palette: "deep indigo shadows, antique gold highlights, muted emerald and oxblood accents, rich purple undertones",
    composition: "three-quarter view, shallow depth of field, dark vignetted background with magical ambient glow",
    avoid: "modern objects, photography, neon, plastic, cartoon, anime",
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

export default hogwartsPack;
