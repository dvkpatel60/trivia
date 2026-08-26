import type { PackTheme } from "@candlelight/core";

/**
 * Push a pack's palette onto the document.
 *
 * Every colour in the stylesheet resolves through these custom properties,
 * so a pack switch re-themes the whole app and no component needs to know
 * which topic is in play.
 */
export function applyTheme(theme: PackTheme): void {
  const root = document.documentElement.style;
  root.setProperty("--accent", theme.accent);
  root.setProperty("--support", theme.support);
  root.setProperty("--warn", theme.warn);
  root.setProperty("--extra", theme.extra);
  root.setProperty("--backdrop", theme.backdrop);
  root.setProperty("--surface", theme.surface);
}
