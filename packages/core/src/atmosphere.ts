/**
 * A pack's atmosphere, and the palette derived from it.
 *
 * Packs declare *intent* — a hue, a mood, a display face, a texture or two —
 * and the whole palette falls out of it. The derivation follows Material 3's
 * tonal model: roles keep the hue an author picked but take their lightness
 * from a fixed tonal ladder, which is what makes surfaces, containers and
 * text sit in a consistent hierarchy no matter what colour a pack chose.
 *
 * It lives here rather than in the web app so a test can walk every shipped
 * pack and assert its text passes WCAG AA. A pack cannot ship an unreadable
 * palette.
 */

import { contrastRatio, css, ensureContrast, hexToOklch, type Oklch } from "./color.js";

/**
 * How dark and how saturated a pack's world is.
 *
 * - `enigmatic` — near-black, barely-there chroma, light used sparingly.
 * - `deep` — dark but clearly coloured; confident rather than mysterious.
 * - `warm` — dark with a lit, amber-leaning ground.
 * - `stark` — very low chroma, high contrast. Clinical and precise.
 */
export type Mood = "enigmatic" | "deep" | "warm" | "stark";

/**
 * Background treatments, drawn by the app from this vocabulary.
 *
 * Deliberately short. The glow layers that used to live here were flat bands
 * pinned to the bottom of the screen, and a band that stops partway up reads
 * as a seam between the background and the content rather than as ground.
 * What a pack's world is made of belongs in `scenery`, which moves.
 */
export type Texture = "grid" | "vignette";

/**
 * Objects that drift through a pack's background.
 *
 * A closed vocabulary rather than free-form data, for the same reason
 * `Texture` is one: a pack is plain data bundled into the client, so it
 * declares *which* things belong in its world and the app decides how to
 * draw them. The web app holds a renderer per member as a mapped type, so
 * adding a name here without drawing it is a compile error.
 *
 * Everything here is drawn as opacity over the pack's surface, with no hue
 * of its own, so a piece is a lightening of whatever ground it drifts
 * across. A signature colour on an object this large reads as something
 * pasted over the screen rather than as part of it. Nothing in this layer
 * uses a gradient either — wide gradients band on dark surfaces, which is
 * what made the old orb mesh look like noise.
 */
export type Scenery =
  | "embers"
  | "candles"
  | "keys"
  | "peaks"
  | "clouds"
  | "planes";

/** Display faces a pack may set for its headings and question prompts. */
export type DisplayFace = "fraunces" | "spaceGrotesk" | "inter";

export interface Atmosphere {
  /** Base hue in OKLCH degrees; surfaces are tinted toward it. */
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
  /**
   * What moves in the background. Optional: a pack that declares none still
   * gets a readable ground, it just does not have a cast of its own.
   */
  scenery?: Scenery[];
  display: DisplayFace;
}

interface MoodShape {
  /** Shifts the whole tonal ladder up or down. */
  lift: number;
  /** Chroma carried by surfaces — how much the base hue bleeds in. */
  surfaceChroma: number;
  /** Scales the chroma of the signature colours. */
  roleChroma: number;
}

const MOODS: Record<Mood, MoodShape> = {
  enigmatic: { lift: 0, surfaceChroma: 0.016, roleChroma: 1 },
  deep: { lift: 3, surfaceChroma: 0.034, roleChroma: 1.08 },
  warm: { lift: 2, surfaceChroma: 0.028, roleChroma: 1.05 },
  stark: { lift: 1, surfaceChroma: 0.004, roleChroma: 0.72 },
};

/**
 * The tonal stops this app uses, named for what they are rather than for a
 * number. These are Material 3's dark-scheme assignments.
 */
const TONE = {
  surface: 7,
  containerLowest: 4,
  containerLow: 11,
  container: 14,
  containerHigh: 19,
  containerHighest: 24,
  onSurface: 92,
  onSurfaceVariant: 79,
  outline: 62,
  outlineVariant: 31,
  role: 80,
  onRole: 22,
  roleContainer: 33,
  onRoleContainer: 91,
} as const;

/**
 * How much of the foreground colour is composited over a surface when a
 * control is hovered, focused, or pressed.
 *
 * One shared set of numbers is the entire reason Material components feel
 * like the same object under a finger. Every interactive surface in the app
 * uses these rather than inventing its own hover colour.
 */
export const STATE_LAYER = {
  hover: 0.08,
  focus: 0.1,
  press: 0.12,
  drag: 0.16,
} as const;

/** A colour role: the thing itself, what reads on it, and its container pair. */
export interface Role {
  base: Oklch;
  on: Oklch;
  container: Oklch;
  onContainer: Oklch;
}

export interface Palette {
  /** The page itself. */
  surface: Oklch;
  /** Container ladder, lowest to highest. Elevation is a tonal step, not a shadow. */
  containers: [Oklch, Oklch, Oklch, Oklch, Oklch];
  onSurface: Oklch;
  onSurfaceVariant: Oklch;
  outline: Oklch;
  outlineVariant: Oklch;
  accent: Role;
  support: Role;
  warn: Role;
  extra: Role;
}

/** WCAG AA for body text. */
export const AA_CONTRAST = 4.5;
/** AA for large text, which is what dimmed labels and outlines are held to. */
export const AA_LARGE_CONTRAST = 3;

export function derivePalette(atmosphere: Atmosphere): Palette {
  const shape = MOODS[atmosphere.mood];
  const { hue } = atmosphere;

  /** A neutral step on the ladder, tinted toward the pack's hue. */
  const neutral = (tone: number, chromaScale = 1): Oklch => ({
    l: Math.max(0, Math.min(1, (tone + shape.lift) / 100)),
    c: shape.surfaceChroma * chromaScale,
    h: hue,
  });

  const surface = neutral(TONE.surface);
  const containers: [Oklch, Oklch, Oklch, Oklch, Oklch] = [
    neutral(TONE.containerLowest, 0.9),
    neutral(TONE.containerLow, 1.05),
    neutral(TONE.container, 1.15),
    neutral(TONE.containerHigh, 1.3),
    neutral(TONE.containerHighest, 1.45),
  ];
  const highest = containers[4];

  const onSurface = neutral(TONE.onSurface, 0.5);
  const onSurfaceVariant = ensureContrast(
    neutral(TONE.onSurfaceVariant, 0.7),
    highest,
    AA_LARGE_CONTRAST,
  );
  const outline = ensureContrast(neutral(TONE.outline, 0.8), highest, AA_LARGE_CONTRAST);
  const outlineVariant = neutral(TONE.outlineVariant, 0.9);

  /**
   * A signature colour keeps the hue and character the author chose, but
   * takes its lightness from the tonal ladder — which is what stops one
   * pack's "accent" being a pale wash and another's being unreadable.
   */
  const role = (hex: string): Role => {
    const authored = hexToOklch(hex);
    const chroma = authored.c * shape.roleChroma;
    const at = (tone: number, chromaScale = 1): Oklch => ({
      l: Math.max(0, Math.min(1, (tone + shape.lift) / 100)),
      c: chroma * chromaScale,
      h: authored.h,
    });

    const base = ensureContrast(at(TONE.role), highest, AA_LARGE_CONTRAST);
    return {
      base,
      on: ensureContrast(at(TONE.onRole, 0.6), base, AA_CONTRAST),
      container: at(TONE.roleContainer, 0.85),
      onContainer: ensureContrast(
        at(TONE.onRoleContainer, 0.45),
        at(TONE.roleContainer, 0.85),
        AA_CONTRAST,
      ),
    };
  };

  return {
    surface,
    containers,
    onSurface,
    onSurfaceVariant,
    outline,
    outlineVariant,
    accent: role(atmosphere.signature.accent),
    support: role(atmosphere.signature.support),
    warn: role(atmosphere.signature.warn),
    extra: role(atmosphere.signature.extra),
  };
}

/** The palette as CSS custom properties, ready to set on :root. */
export function paletteVariables(palette: Palette): Record<string, string> {
  const variables: Record<string, string> = {
    "--surface": css(palette.surface),
    "--surface-lowest": css(palette.containers[0]),
    "--surface-low": css(palette.containers[1]),
    "--surface-container": css(palette.containers[2]),
    "--surface-high": css(palette.containers[3]),
    "--surface-highest": css(palette.containers[4]),
    "--on-surface": css(palette.onSurface),
    "--on-surface-variant": css(palette.onSurfaceVariant),
    "--outline": css(palette.outline),
    "--outline-variant": css(palette.outlineVariant),
    "--state-hover": String(STATE_LAYER.hover),
    "--state-focus": String(STATE_LAYER.focus),
    "--state-press": String(STATE_LAYER.press),
  };

  const roles = { accent: palette.accent, support: palette.support, warn: palette.warn, extra: palette.extra };
  for (const [name, value] of Object.entries(roles)) {
    variables[`--${name}`] = css(value.base);
    variables[`--on-${name}`] = css(value.on);
    variables[`--${name}-container`] = css(value.container);
    variables[`--on-${name}-container`] = css(value.onContainer);
  }

  return variables;
}

export interface ContrastProblem {
  pair: string;
  ratio: number;
  required: number;
}

/** Everything the eye has to resolve, checked. Run over every pack in a test. */
export function contrastProblems(palette: Palette): ContrastProblem[] {
  const problems: ContrastProblem[] = [];
  const highest = palette.containers[4];

  const check = (pair: string, a: Oklch, b: Oklch, required: number) => {
    const ratio = contrastRatio(a, b);
    if (ratio < required) problems.push({ pair, ratio, required });
  };

  check("on-surface over surface", palette.onSurface, palette.surface, AA_CONTRAST);
  check("on-surface over highest container", palette.onSurface, highest, AA_CONTRAST);
  check("on-surface-variant over highest", palette.onSurfaceVariant, highest, AA_LARGE_CONTRAST);
  check("outline over highest", palette.outline, highest, AA_LARGE_CONTRAST);

  const roles = { accent: palette.accent, support: palette.support, warn: palette.warn, extra: palette.extra };
  for (const [name, role] of Object.entries(roles)) {
    check(`${name} over highest`, role.base, highest, AA_LARGE_CONTRAST);
    check(`on-${name} over ${name}`, role.on, role.base, AA_CONTRAST);
    check(`on-${name}-container over container`, role.onContainer, role.container, AA_CONTRAST);
  }

  return problems;
}
