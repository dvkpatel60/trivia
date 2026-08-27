import { derivePalette, paletteVariables, type Atmosphere } from "@curio/core";

/**
 * Anything with a world: a content pack, or the app's own `HOUSE`.
 *
 * Named structurally rather than as `ContentPack`, because the shell has an
 * atmosphere and no questions, and there is no reason for the theming layer
 * to know the difference.
 */
export interface Themed {
  id: string;
  atmosphere: Atmosphere;
}

/**
 * Put a world onto the document.
 *
 * Everything visual resolves through these custom properties and the two
 * data attributes, so switching topic re-skins the entire app — palette,
 * display face, and background treatment — without a single component
 * knowing which pack is in play.
 */
export function applyPack(pack: Themed): void {
  const root = document.documentElement;
  const variables = paletteVariables(derivePalette(pack.atmosphere));

  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value);
  }

  root.dataset.display = pack.atmosphere.display;
  root.dataset.pack = pack.id;

  // Keeps the browser's own chrome — address bar, overscroll — in the
  // pack's world rather than flashing white at the edges.
  const meta = document.querySelector('meta[name="theme-color"]');
  const backdrop = variables["--surface"];
  if (meta && backdrop) meta.setAttribute("content", backdrop);
}
