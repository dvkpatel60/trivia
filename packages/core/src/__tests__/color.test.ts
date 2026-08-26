import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  css,
  ensureContrast,
  hexToOklch,
  oklchToHex,
  oklchToRgb,
  rgbToOklch,
} from "../color.js";
import {
  AA_CONTRAST,
  contrastProblems,
  derivePalette,
  paletteVariables,
  SURFACE_STEPS,
  type Atmosphere,
  type Mood,
} from "../atmosphere.js";

const base: Atmosphere = {
  hue: 276,
  mood: "enigmatic",
  signature: { accent: "#e8b55c", support: "#3f9c7d", warn: "#c2543a", extra: "#8878d6" },
  texture: ["grain"],
  display: "fraunces",
};

describe("colour conversion", () => {
  it("round-trips sRGB through OKLCH", () => {
    for (const hex of ["#000000", "#ffffff", "#e8b55c", "#3f9c7d", "#4fa3c7", "#123456"]) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });

  it("puts white and black at the ends of the lightness range", () => {
    expect(rgbToOklch({ r: 255, g: 255, b: 255 }).l).toBeCloseTo(1, 2);
    expect(rgbToOklch({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 2);
  });

  it("reads grey as having no chroma", () => {
    expect(rgbToOklch({ r: 128, g: 128, b: 128 }).c).toBeLessThan(0.001);
  });

  it("clips colours outside the sRGB gamut instead of producing nonsense", () => {
    const { r, g, b } = oklchToRgb({ l: 0.9, c: 0.4, h: 140 });
    for (const channel of [r, g, b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });

  it("emits CSS the browser will accept", () => {
    expect(css({ l: 0.5, c: 0.1, h: 200 })).toMatch(/^oklch\(50\.0% 0\.100 200\.0\)$/);
    expect(css({ l: 0.5, c: 0.1, h: 200, alpha: 0.4 })).toContain("/ 0.4");
  });
});

describe("contrast", () => {
  it("scores black on white at the top of the scale", () => {
    expect(contrastRatio(hexToOklch("#000"), hexToOklch("#fff"))).toBeCloseTo(21, 0);
  });

  it("scores a colour against itself at the bottom", () => {
    expect(contrastRatio(hexToOklch("#4fa3c7"), hexToOklch("#4fa3c7"))).toBeCloseTo(1, 5);
  });

  it("lightens a colour until it reads on a dark ground", () => {
    const ground = hexToOklch("#171a22");
    const muddy = { l: 0.24, c: 0.05, h: 276 };
    expect(contrastRatio(muddy, ground)).toBeLessThan(AA_CONTRAST);
    expect(contrastRatio(ensureContrast(muddy, ground, AA_CONTRAST), ground)).toBeGreaterThanOrEqual(
      AA_CONTRAST,
    );
  });

  it("leaves a colour alone when it already passes", () => {
    const ground = hexToOklch("#171a22");
    const bright = hexToOklch("#ffffff");
    expect(ensureContrast(bright, ground, AA_CONTRAST)).toEqual(bright);
  });
});

describe("palette derivation", () => {
  const moods: Mood[] = ["enigmatic", "deep", "warm", "stark"];

  it.each(moods)("%s produces a readable palette", (mood) => {
    expect(contrastProblems(derivePalette({ ...base, mood }))).toEqual([]);
  });

  it.each(moods)("%s produces a palette at any hue", (mood) => {
    for (let hue = 0; hue < 360; hue += 30) {
      const problems = contrastProblems(derivePalette({ ...base, mood, hue }));
      expect(problems, `${mood} at ${hue}deg`).toEqual([]);
    }
  });

  it("ramps surfaces from dark to light without a flat step", () => {
    const { surface } = derivePalette(base);
    expect(surface.length).toBe(SURFACE_STEPS);
    for (let step = 1; step < surface.length; step++) {
      expect(surface[step]!.l).toBeGreaterThan(surface[step - 1]!.l);
    }
  });

  it("tints surfaces toward the pack's hue", () => {
    const { surface } = derivePalette({ ...base, hue: 120 });
    expect(surface.every((swatch) => swatch.h === 120)).toBe(true);
  });

  it("keeps a stark pack nearly colourless", () => {
    const { surface } = derivePalette({ ...base, mood: "stark" });
    expect(surface.every((swatch) => swatch.c < 0.015)).toBe(true);
  });

  it("gives a filled accent a label that reads on it", () => {
    const palette = derivePalette(base);
    expect(contrastRatio(palette.onAccent, palette.accent)).toBeGreaterThanOrEqual(AA_CONTRAST);
  });

  it("emits one custom property per surface step", () => {
    const variables = paletteVariables(derivePalette(base));
    for (let step = 0; step < SURFACE_STEPS; step++) {
      expect(variables[`--surface-${step}`]).toMatch(/^oklch\(/);
    }
    expect(variables["--accent"]).toMatch(/^oklch\(/);
  });
});
