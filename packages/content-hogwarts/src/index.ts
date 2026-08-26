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
  name: "Candlelight",
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
    texture: ["emberGlow", "grain", "vignette"],
    display: "fraunces",
  },
  /**
   * Every generated image in this pack is painted, lit by one warm source,
   * and darkened at the edges — so a picture round reads as a set of plates
   * from the same book rather than four unrelated pictures.
   */
  art: {
    style:
      "candlelit oil painting on aged canvas, chiaroscuro, soft impasto brushwork, museum plate",
    palette: "deep indigo shadows, antique gold highlights, muted emerald and oxblood accents",
    composition: "three-quarter view, shallow depth of field, dark vignetted background",
    avoid: "modern objects, photography, neon, plastic",
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
