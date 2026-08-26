import type { PuzzleKind } from "../kind.js";
import type { PuzzleKindId } from "../types.js";

import { choice } from "./choice.js";
import { truefalse } from "./truefalse.js";
import { match } from "./match.js";
import { unscramble } from "./unscramble.js";
import { oddOneOut } from "./oddOneOut.js";
import { whoAmI } from "./whoAmI.js";
import { categorize } from "./categorize.js";
import { connections } from "./connections.js";
import { sequence } from "./sequence.js";
import { imageChoice } from "./imageChoice.js";

/**
 * The registry. Every kind the game knows about, keyed by id.
 *
 * `Registry` is written as a mapped type so TypeScript rejects a registry
 * that is missing a kind or files one under the wrong key.
 */
type Registry = { [K in PuzzleKindId]: PuzzleKind<K> };

export const KINDS: Registry = {
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
};

export const KIND_IDS = Object.keys(KINDS) as PuzzleKindId[];

export function getKind<K extends PuzzleKindId>(id: K): PuzzleKind<K> {
  const kind = KINDS[id];
  if (!kind) throw new Error(`Unknown puzzle kind: ${id}`);
  return kind;
}

export function isKindId(value: string): value is PuzzleKindId {
  return Object.prototype.hasOwnProperty.call(KINDS, value);
}

export {
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
};
