/**
 * A pack's atmosphere, and the palette derived from it.
 *
 * Packs used to ship six flat hex values, which is far too thin to build a
 * product on: no hover states, no depth, no guarantee anything was readable.
 * Instead a pack declares *intent* — a hue, a mood, a display face, and a
 * texture or two — and the system derives a full ramp from it.
 *
 * The derivation is here rather than in the web app so a test can walk every
 * shipped pack and assert its text passes WCAG AA. A pack cannot ship an
 * unreadable palette.
 */

import { contrastRatio, css, ensureContrast, hexToOklch, type Oklch } from "./color.js";

/**
 * How dark and how saturated a pack's world is.
 *
 * - `enigmatic` — near-black, barely-there chroma, light used sparingly.
 *   For topics with an air of secrecy.
 * - `deep` — dark but clearly coloured; confident rather than mysterious.
 * - `warm` — dark with a lit, amber-leaning ground.
 * - `stark` — very low chroma, high contrast. Clinical and precise.
 */
export type Mood = "enigmatic" | "deep" | "warm" | "stark";

/** Background treatments, drawn by the app from this vocabulary. */
export type Texture = "grain" | "emberGlow" | "horizonGlow" | "grid" | "vignette";

/** Display faces a pack may set for its headings and question prompts. */
export type DisplayFace = "fraunces" | "spaceGrotesk" | "inter";

export interface Atmosphere {
  /** Base hue in OKLCH degrees; the surfaces are tinted toward it. */
  hue: number;
  mood: Mood;
  /** The colours that carry the pack's identity, as authored hex. */
  signature: {
    accent: string;
    support: string;
    warn: string;
    extra: string;
  };
  texture: Texture[];
  display: DisplayFace;
}

interface MoodShape {
  /** Lightness of the darkest surface. */
  floor: number;
  /** Lightness added by the time you reach the topmost surface. */
  lift: number;
  /** How much of the base hue bleeds into the surfaces. */
  chroma: number;
  /** Lightness of primary text. */
  ink: number;
}

const MOODS: Record<Mood, MoodShape> = {
  enigmatic: { floor: 0.16, lift: 0.1, chroma: 0.018, ink: 0.95 },
  deep: { floor: 0.2, lift: 0.12, chroma: 0.038, ink: 0.96 },
  warm: { floor: 0.19, lift: 0.11, chroma: 0.03, ink: 0.96 },
  stark: { floor: 0.17, lift: 0.13, chroma: 0.006, ink: 0.98 },
};

/** Steps in the surface ramp, darkest first. */
export const SURFACE_STEPS = 5;

export interface Palette {
  /** Backdrop through to the most raised surface. */
  surface: Oklch[];
  /** Primary, dimmed, and faint text. */
  ink: [Oklch, Oklch, Oklch];
  accent: Oklch;
  support: Oklch;
  warn: Oklch;
  extra: Oklch;
  line: Oklch;
  /** Ink that reads on top of a filled accent — a button label. */
  onAccent: Oklch;
}

/** WCAG AA for body text. Everything derived here is held to it. */
export const AA_CONTRAST = 4.5;
/** AA for large text, which is what dimmed and faint labels are used for. */
export const AA_LARGE_CONTRAST = 3;

export function derivePalette(atmosphere: Atmosphere): Palette {
  const shape = MOODS[atmosphere.mood];
  const { hue } = atmosphere;

  const surface: Oklch[] = Array.from({ length: SURFACE_STEPS }, (_, step) => ({
    l: shape.floor + (shape.lift * step) / (SURFACE_STEPS - 1),
    // Raised surfaces pick up slightly more colour, so depth reads as warmth
    // rather than as a flat grey wash.
    c: shape.chroma * (1 + step * 0.22),
    h: hue,
  }));

  const backdrop = surface[0] as Oklch;
  const raised = surface[SURFACE_STEPS - 1] as Oklch;

  const inkPrimary: Oklch = { l: shape.ink, c: 0.008, h: hue };
  // Dimmed and faint text sit on the *raised* surface, which is the lightest
  // thing they will ever appear on, so contrast holds everywhere.
  const inkDim = ensureContrast({ l: 0.74, c: 0.012, h: hue }, raised, AA_LARGE_CONTRAST);
  const inkFaint = ensureContrast({ l: 0.62, c: 0.014, h: hue }, raised, AA_LARGE_CONTRAST);

  const signature = (hex: string) => ensureContrast(hexToOklch(hex), raised, AA_LARGE_CONTRAST);

  const accent = signature(atmosphere.signature.accent);

  return {
    surface,
    ink: [inkPrimary, inkDim, inkFaint],
    accent,
    support: signature(atmosphere.signature.support),
    warn: signature(atmosphere.signature.warn),
    extra: signature(atmosphere.signature.extra),
    line: { l: backdrop.l + 0.14, c: shape.chroma * 1.4, h: hue },
    // A filled accent button needs a label that reads on it, and the accents
    // are light, so this lands dark and hue-matched rather than pure black.
    onAccent: ensureContrast({ l: 0.16, c: 0.03, h: accent.h }, accent, AA_CONTRAST),
  };
}

/** The palette as CSS custom properties, ready to set on :root. */
export function paletteVariables(palette: Palette): Record<string, string> {
  const variables: Record<string, string> = {
    "--ink": css(palette.ink[0]),
    "--ink-dim": css(palette.ink[1]),
    "--ink-faint": css(palette.ink[2]),
    "--accent": css(palette.accent),
    "--support": css(palette.support),
    "--warn": css(palette.warn),
    "--extra": css(palette.extra),
    "--line": css(palette.line),
    "--on-accent": css(palette.onAccent),
  };
  palette.surface.forEach((swatch, step) => {
    variables[`--surface-${step}`] = css(swatch);
  });
  return variables;
}

export interface ContrastProblem {
  pair: string;
  ratio: number;
  required: number;
}

/**
 * Everything the eye has to resolve, checked. Run over every pack in a test.
 */
export function contrastProblems(palette: Palette): ContrastProblem[] {
  const problems: ContrastProblem[] = [];
  const backdrop = palette.surface[0] as Oklch;
  const raised = palette.surface[SURFACE_STEPS - 1] as Oklch;

  const check = (pair: string, a: Oklch, b: Oklch, required: number) => {
    const ratio = contrastRatio(a, b);
    if (ratio < required) problems.push({ pair, ratio, required });
  };

  check("ink on backdrop", palette.ink[0], backdrop, AA_CONTRAST);
  check("ink on raised", palette.ink[0], raised, AA_CONTRAST);
  check("dim ink on raised", palette.ink[1], raised, AA_LARGE_CONTRAST);
  check("faint ink on raised", palette.ink[2], raised, AA_LARGE_CONTRAST);
  check("accent on raised", palette.accent, raised, AA_LARGE_CONTRAST);
  check("support on raised", palette.support, raised, AA_LARGE_CONTRAST);
  check("warn on raised", palette.warn, raised, AA_LARGE_CONTRAST);
  check("label on accent", palette.onAccent, palette.accent, AA_CONTRAST);

  return problems;
}
