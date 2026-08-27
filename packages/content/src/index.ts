/**
 * The pack registry.
 *
 * Both the browser and the Netlify function resolve packs through here, so
 * they always agree on what "hogwarts" means. Adding a topic is: create a
 * package, import it, add it to `PACKS`.
 */

import {
  availableKinds,
  derivePalette,
  validatePack,
  type Atmosphere,
  type ContentPack,
  type Palette,
  type PuzzleKindId,
} from "@curio/core";
import { hogwartsPack } from "@curio/content-hogwarts";
import { atlasPack } from "@curio/content-atlas";
import { bollywoodPack } from "@curio/content-bollywood";

export const PACKS: ContentPack[] = [hogwartsPack, atlasPack, bollywoodPack];

/** The pack a fresh game starts on. */
export const DEFAULT_PACK_ID = hogwartsPack.id;

const byId = new Map(PACKS.map((pack) => [pack.id, pack]));

export function findPack(id: string | undefined): ContentPack | undefined {
  return id ? byId.get(id) : undefined;
}

/**
 * Resolve a pack id, falling back to the default. Used on the request path,
 * where an unknown id from an old link shouldn't take the game down.
 */
export function resolvePack(id: string | undefined): ContentPack {
  return findPack(id) ?? (hogwartsPack as ContentPack);
}

export interface PackSummary {
  id: string;
  name: string;
  tagline: string;
  blurb: string;
  atmosphere: Atmosphere;
  /** Derived once here so pickers can preview a pack without re-deriving. */
  palette: Palette;
  kinds: PuzzleKindId[];
  itemCount: number;
}

/** Everything the pack picker needs, without shipping the answers. */
export function packSummaries(): PackSummary[] {
  return PACKS.map((pack) => ({
    id: pack.id,
    name: pack.name,
    tagline: pack.tagline,
    blurb: pack.blurb,
    atmosphere: pack.atmosphere,
    palette: derivePalette(pack.atmosphere),
    kinds: availableKinds(pack),
    itemCount: Object.values(pack.items).reduce((sum, items) => sum + (items?.length ?? 0), 0),
  }));
}

export { hogwartsPack, atlasPack, bollywoodPack, validatePack };
