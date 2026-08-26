import type { ContentPack } from "@candlelight/core";

import { houses } from "./categories.js";
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
  theme: {
    accent: "#e8b55c",
    support: "#3f9c7d",
    warn: "#c2543a",
    extra: "#8878d6",
    backdrop: "#0d0f14",
    surface: "#171a22",
  },
  categories: houses,
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

export default hogwartsPack;
