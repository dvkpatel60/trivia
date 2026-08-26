import type { ComponentType } from "react";
import type { PuzzleKindId } from "@candlelight/core";

import { Categorize } from "./Categorize.js";
import { Choice } from "./Choice.js";
import { ImageChoice } from "./ImageChoice.js";
import { Match } from "./Match.js";
import { OddOneOut } from "./OddOneOut.js";
import { Sequence } from "./Sequence.js";
import { TrueFalse } from "./TrueFalse.js";
import { Unscramble } from "./Unscramble.js";
import { WhoAmI } from "./WhoAmI.js";
import type { PuzzleProps } from "./types.js";

/**
 * The rendering half of the kind registry.
 *
 * Written as a mapped type over `PuzzleKindId`, so adding a kind to the
 * engine and forgetting to build a screen for it is a compile error rather
 * than a blank card in a live game.
 */
type Renderers = { [K in PuzzleKindId]: ComponentType<PuzzleProps<K>> };

export const PUZZLES: Renderers = {
  choice: Choice,
  truefalse: TrueFalse,
  match: Match,
  unscramble: Unscramble,
  oddOneOut: OddOneOut,
  whoAmI: WhoAmI,
  categorize: Categorize,
  sequence: Sequence,
  imageChoice: ImageChoice,
};

export type { PuzzleProps } from "./types.js";
