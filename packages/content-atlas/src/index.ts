import type { ContentPack } from "@candlelight/core";

import { continents } from "./categories.js";
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
  theme: {
    accent: "#4fa3c7",
    support: "#6fb98f",
    warn: "#e07a5f",
    extra: "#f2cc8f",
    backdrop: "#0b1220",
    surface: "#141d2b",
  },
  categories: continents,
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
