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
  artMedia,
  artPath,
  composeNegativePrompt,
  composePrompt,
  seedForArt,
  UNIVERSAL_CONSTRAINTS,
} from "../art.js";
import {
  AA_CONTRAST,
  contrastProblems,
  derivePalette,
  paletteVariables,
  STATE_LAYER,
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

  it.each(moods)("%s stays readable at every hue", (mood) => {
    // The whole point of deriving rather than authoring: a pack cannot pick
    // a hue that makes its own text unreadable.
    for (let hue = 0; hue < 360; hue += 15) {
      expect(contrastProblems(derivePalette({ ...base, mood, hue })), `${mood} at ${hue}deg`).toEqual(
        [],
      );
    }
  });

  it("climbs the container ladder without a flat step", () => {
    const { containers } = derivePalette(base);
    expect(containers.length).toBe(5);
    for (let step = 1; step < containers.length; step++) {
      expect(containers[step]!.l).toBeGreaterThan(containers[step - 1]!.l);
    }
  });

  it("keeps the page darker than anything raised on it", () => {
    const { surface, containers } = derivePalette(base);
    expect(surface.l).toBeLessThan(containers[2]!.l);
  });

  it("tints surfaces toward the pack's hue", () => {
    const { surface, containers } = derivePalette({ ...base, hue: 120 });
    expect(surface.h).toBe(120);
    expect(containers.every((swatch) => swatch.h === 120)).toBe(true);
  });

  it("keeps a stark pack nearly colourless", () => {
    const { containers } = derivePalette({ ...base, mood: "stark" });
    expect(containers.every((swatch) => swatch.c < 0.012)).toBe(true);
  });

  it("keeps each role's authored hue while taking its lightness from the ladder", () => {
    const palette = derivePalette(base);
    const authored = hexToOklch(base.signature.support);
    expect(palette.support.base.h).toBeCloseTo(authored.h, 0);
    // Tone 80 on the ladder, not whatever lightness the author happened to pick.
    expect(palette.support.base.l).toBeGreaterThan(0.6);
  });

  it("pairs every role with a label that reads on it", () => {
    const palette = derivePalette(base);
    for (const role of [palette.accent, palette.support, palette.warn, palette.extra]) {
      expect(contrastRatio(role.on, role.base)).toBeGreaterThanOrEqual(AA_CONTRAST);
      expect(contrastRatio(role.onContainer, role.container)).toBeGreaterThanOrEqual(AA_CONTRAST);
    }
  });

  it("emits the surface ladder, the roles, and the state layers", () => {
    const variables = paletteVariables(derivePalette(base));
    for (const name of [
      "--surface",
      "--surface-lowest",
      "--surface-container",
      "--surface-highest",
      "--on-surface",
      "--outline",
      "--accent",
      "--on-accent",
      "--accent-container",
      "--support",
    ]) {
      expect(variables[name], name).toMatch(/^oklch\(/);
    }
    expect(variables["--state-press"]).toBe(String(STATE_LAYER.press));
  });

  it("orders the state layers from lightest touch to heaviest", () => {
    expect(STATE_LAYER.hover).toBeLessThan(STATE_LAYER.focus);
    expect(STATE_LAYER.focus).toBeLessThan(STATE_LAYER.press);
    expect(STATE_LAYER.press).toBeLessThan(STATE_LAYER.drag);
  });
});

describe("art prompts", () => {
  const direction = {
    style: "candlelit oil painting",
    palette: "indigo and gold",
    composition: "three-quarter view",
    avoid: "neon",
  };
  const art = { id: "creature-phoenix", subject: "a crimson firebird" };

  it("puts the subject first and the constraints last", () => {
    const prompt = composePrompt(art, direction);
    expect(prompt.startsWith("a crimson firebird")).toBe(true);
    expect(prompt).toContain("candlelit oil painting");
    expect(prompt).toContain("indigo and gold");
    expect(prompt.endsWith(UNIVERSAL_CONSTRAINTS[UNIVERSAL_CONSTRAINTS.length - 1] as string)).toBe(
      true,
    );
  });

  it("always forbids text, whatever the pack asked for", () => {
    // A label baked into a picture-round image can hand over the answer.
    expect(composePrompt(art, direction)).toContain("no text");
    expect(composeNegativePrompt(direction)).toContain("text");
  });

  it("folds a pack's own exclusions into the negative prompt", () => {
    expect(composeNegativePrompt(direction)).toContain("neon");
    expect(composeNegativePrompt({ ...direction, avoid: undefined })).not.toContain("neon");
  });

  it("gives the same art id the same seed, and different ids different ones", () => {
    expect(seedForArt("creature-phoenix")).toBe(seedForArt("creature-phoenix"));
    expect(seedForArt("creature-phoenix")).not.toBe(seedForArt("creature-hippogriff"));
    expect(Number.isInteger(seedForArt("x"))).toBe(true);
  });

  it("derives the path the generator writes and the app serves", () => {
    expect(artPath("hogwarts", "creature-phoenix")).toBe("/packs/hogwarts/creature-phoenix.png");
    expect(artMedia("hogwarts", art, "A firebird").src).toBe(artPath("hogwarts", art.id));
    expect(artMedia("hogwarts", art, "A firebird").alt).toBe("A firebird");
  });
});
