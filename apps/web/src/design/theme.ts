import { derivePalette, paletteVariables, type ContentPack } from "@curio/core";

/**
 * Put a pack's world onto the document.
 *
 * Everything visual resolves through these custom properties and the two
 * data attributes, so switching topic re-skins the entire app — palette,
 * display face, and background treatment — without a single component
 * knowing which pack is in play.
 */
export function applyPack(pack: ContentPack): void {
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
