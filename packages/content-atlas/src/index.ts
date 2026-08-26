import type { ContentPack } from "@curio/core";

import { categorySets } from "./categories.js";
import { choice } from "./items/choice.js";
import { truefalse } from "./items/truefalse.js";
import { match } from "./items/match.js";
import { unscramble } from "./items/unscramble.js";
import { oddOneOut } from "./items/oddOneOut.js";
import { whoAmI } from "./items/whoAmI.js";
import { categorize } from "./items/categorize.js";
import { sequence } from "./items/sequence.js";
import { imageChoice } from "./items/imageChoice.js";

/**
 * A second topic, built only from the public engine types — no engine change
 * was needed to add it. Its categories are continents rather than houses and
 * its palette is its own, which is the whole point: the app themes itself
 * from whichever pack is in play.
 */
export const atlasPack: ContentPack = {
  id: "atlas",
  name: "Atlas",
  tagline: "The world, roughly",
  blurb: "Rivers, capitals, flags, and the places people always misplace.",
  atmosphere: {
    // Chart-paper navy with a horizon at the foot of the screen and a faint
    // graticule: precise where Candlelight is secretive.
    hue: 236,
    mood: "deep",
    signature: {
      accent: "#4fa3c7",
      support: "#6fb98f",
      warn: "#e07a5f",
      extra: "#f2cc8f",
    },
    texture: ["grid"],
    // A skyline of peaks, weather crossing it, and something making the trip.
    scenery: ["peaks", "clouds", "planes"],
    display: "spaceGrotesk",
  },
  /**
   * Atlas is precise where Candlelight is secretive: flat colour, clean
   * geometry, the look of a plate torn from an atlas.
   */
  art: {
    style: "flat vector illustration, engraved atlas plate, clean geometric shapes, fine linework",
    palette: "chart navy, paper cream, ocean teal, sun ochre, muted terracotta",
    composition: "straight-on orthographic view, generous margin, flat even lighting",
    avoid: "photorealism, gradients, drop shadows, 3d render",
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
    sequence,
    imageChoice,
  },
};

export default atlasPack;
