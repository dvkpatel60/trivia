/**
 * Colour maths, in OKLCH.
 *
 * Packs declare a mood and a hue; the palette is derived. That only works if
 * the steps between shades are perceptually even and contrast is
 * predictable, which is exactly what OKLab buys over HSL — and it means a
 * test can *prove* a pack is readable rather than a designer eyeballing it.
 */

export interface Oklch {
  /** Perceptual lightness, 0–1. */
  l: number;
  /** Chroma. 0 is grey; ~0.15 is vivid at mid lightness. */
  c: number;
  /** Hue angle in degrees. */
  h: number;
  /** 0–1. Omitted means opaque. */
  alpha?: number;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const toLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const toGamma = (channel: number) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

/** OKLCH to 8-bit sRGB, gamut-clipped. */
export function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const lCube = l + 0.3963377774 * a + 0.2158037573 * b;
  const mCube = l - 0.1055613458 * a - 0.0638541728 * b;
  const sCube = l - 0.0894841775 * a - 1.291485548 * b;

  const lLin = lCube ** 3;
  const mLin = mCube ** 3;
  const sLin = sCube ** 3;

  const red = 4.0767416621 * lLin - 3.3077115913 * mLin + 0.2309699292 * sLin;
  const green = -1.2684380046 * lLin + 2.6097574011 * mLin - 0.3413193965 * sLin;
  const blue = -0.0041960863 * lLin - 0.7034186147 * mLin + 1.707614701 * sLin;

  return {
    r: Math.round(clamp01(toGamma(red)) * 255),
    g: Math.round(clamp01(toGamma(green)) * 255),
    b: Math.round(clamp01(toGamma(blue)) * 255),
  };
}

/** 8-bit sRGB to OKLCH. */
export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const red = toLinear(r / 255);
  const green = toLinear(g / 255);
  const blue = toLinear(b / 255);

  const lLin = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
  const mLin = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
  const sLin = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;

  const lCube = Math.cbrt(lLin);
  const mCube = Math.cbrt(mLin);
  const sCube = Math.cbrt(sLin);

  const l = 0.2104542553 * lCube + 0.793617785 * mCube - 0.0040720468 * sCube;
  const a = 1.9779984951 * lCube - 2.428592205 * mCube + 0.4505937099 * sCube;
  const bAxis = 0.0259040371 * lCube + 0.7827717662 * mCube - 0.808675766 * sCube;

  const chroma = Math.sqrt(a * a + bAxis * bAxis);
  const hue = chroma < 1e-6 ? 0 : ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360;

  return { l, c: chroma, h: hue };
}

export function hexToOklch(hex: string): Oklch {
  const value = hex.replace("#", "").trim();
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  return rgbToOklch({
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  });
}

export function oklchToHex(color: Oklch): string {
  const { r, g, b } = oklchToRgb(color);
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** A CSS value. Browsers without oklch() support get the hex fallback. */
export function css(color: Oklch): string {
  const alpha = color.alpha == null || color.alpha >= 1 ? "" : ` / ${color.alpha}`;
  return `oklch(${(color.l * 100).toFixed(1)}% ${color.c.toFixed(3)} ${color.h.toFixed(1)}${alpha})`;
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const [red, green, blue] = [r, g, b].map((channel) => toLinear(channel / 255)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio, 1–21. AA body text wants 4.5, large text 3. */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const first = relativeLuminance(oklchToRgb(a));
  const second = relativeLuminance(oklchToRgb(b));
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Nudge a colour's lightness until it reads against a background.
 *
 * Used on pack-supplied accents: an author picks a colour they like, and
 * this keeps it legible on their own surface without them having to think
 * about ratios.
 */
export function ensureContrast(color: Oklch, against: Oklch, target: number): Oklch {
  if (contrastRatio(color, against) >= target) return color;

  // Move away from the background's lightness, whichever direction that is.
  const up = against.l < 0.5;
  let candidate = color;

  for (let step = 0; step < 40; step++) {
    const l = clamp01(candidate.l + (up ? 0.02 : -0.02));
    if (l === candidate.l) break;
    candidate = { ...candidate, l };
    if (contrastRatio(candidate, against) >= target) return candidate;
  }
  return candidate;
}
