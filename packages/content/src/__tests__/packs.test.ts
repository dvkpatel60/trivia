import { describe, expect, it } from "vitest";
import {
  artPath,
  availableKinds,
  contrastProblems,
  derivePalette,
  buildQuestion,
  createRng,
  getKind,
  gradeQuestion,
  KIND_IDS,
  livingItems,
  toPublicQuestion,
  validatePack,
} from "@curio/core";
import { PACKS, findPack, packSummaries, resolvePack } from "../index.js";

describe("every shipped pack", () => {
  it.each(PACKS.map((pack) => [pack.id, pack] as const))("%s validates", (_id, pack) => {
    expect(validatePack(pack)).toEqual([]);
  });

  it.each(PACKS.map((pack) => [pack.id, pack] as const))(
    "%s can deal every kind it ships",
    (_id, pack) => {
      for (const kindId of availableKinds(pack)) {
        const rng = createRng(7);
        const usage = {};
        // Build a few, so a shortage only visible after the pool rotates shows up.
        for (let i = 0; i < 5; i++) {
          const question = buildQuestion(kindId, pack, rng, usage);
          expect(question.kind).toBe(kindId);
          expect(question.prompt.length).toBeGreaterThan(0);
        }
      }
    },
  );

  it.each(PACKS.map((pack) => [pack.id, pack] as const))(
    "%s grades a wrong answer as zero for every kind",
    (_id, pack) => {
      for (const kindId of availableKinds(pack)) {
        const question = buildQuestion(kindId, pack, createRng(3), {});
        expect(gradeQuestion(question, null).fraction).toBe(0);
      }
    },
  );

  it.each(PACKS.map((pack) => [pack.id, pack] as const))(
    "%s never puts an answer in a published question",
    (_id, pack) => {
      for (const kindId of availableKinds(pack)) {
        const question = buildQuestion(kindId, pack, createRng(11), {});
        expect("solution" in toPublicQuestion(question)).toBe(false);
      }
    },
  );

  it.each(PACKS.map((pack) => [pack.id, pack] as const))(
    "%s gives every image an alt text",
    (_id, pack) => {
      for (const item of livingItems(pack, "imageChoice")) {
        expect(item.media.alt.trim().length).toBeGreaterThan(0);
        expect(item.media.src.startsWith("data:") || item.media.src.startsWith("/") || item.media.src.startsWith("http")).toBe(true);
      }
    },
  );

  it.each(PACKS.map((pack) => [pack.id, pack] as const))(
    "%s points every generated item at the file the generator writes",
    (_id, pack) => {
      // The one place an item and its art block can drift apart.
      for (const item of livingItems(pack, "imageChoice")) {
        if (!item.art) continue;
        expect(item.media.src, item.art.id).toBe(artPath(pack.id, item.art.id));
      }
    },
  );

  it.each(PACKS.map((pack) => [pack.id, pack] as const))(
    "%s declares art direction if it ships generated images",
    (_id, pack) => {
      const generated = livingItems(pack, "imageChoice").filter((item) => item.art);
      if (generated.length > 0) expect(pack.art).toBeDefined();
    },
  );

  it("gives every generated image a unique art id", () => {
    const ids = PACKS.flatMap((pack) =>
      livingItems(pack, "imageChoice")
        .map((item) => item.art?.id)
        .filter(Boolean),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps art subjects free of style direction", () => {
    // Style belongs to the pack, not the item — otherwise a picture round
    // stops looking like a set.
    const styleWords = ["oil painting", "vector", "photo", "render", "4k", "lighting"];
    for (const pack of PACKS) {
      for (const item of livingItems(pack, "imageChoice")) {
        if (!item.art) continue;
        for (const word of styleWords) {
          expect(item.art.subject.toLowerCase(), item.art.id).not.toContain(word);
        }
      }
    }
  });

  it("has unique pack ids", () => {
    expect(new Set(PACKS.map((p) => p.id)).size).toBe(PACKS.length);
  });
});

describe("multi-topic plumbing", () => {
  it("ships at least two topics", () => {
    expect(PACKS.length).toBeGreaterThanOrEqual(2);
  });

  it("gives each pack its own ways of sorting rather than sharing one", () => {
    const withSets = PACKS.filter((pack) => (pack.categorySets ?? []).length > 0);
    const signatures = withSets.map((pack) =>
      (pack.categorySets ?? []).map((set) => set.id).join(","),
    );
    expect(new Set(signatures).size).toBe(withSets.length);
  });

  it.each(PACKS.map((pack) => [pack.id, pack] as const))(
    "%s can deal a full question from every sorting set it declares",
    (_id, pack) => {
      // A set too thin to fill a question is content nobody will ever see.
      const needed = getKind("categorize").itemsPerQuestion;
      for (const set of pack.categorySets ?? []) {
        const count = livingItems(pack, "categorize").filter((item) => item.set === set.id).length;
        expect(count, `${pack.id}/${set.id}`).toBeGreaterThanOrEqual(needed);
      }
    },
  );

  it("gives each pack its own palette and display face", () => {
    expect(new Set(PACKS.map((p) => p.atmosphere.signature.accent)).size).toBe(PACKS.length);
    expect(new Set(PACKS.map((p) => p.atmosphere.hue)).size).toBe(PACKS.length);
  });

  it.each(PACKS.map((pack) => [pack.id, pack] as const))(
    "%s derives a palette everything stays readable on",
    (_id, pack) => {
      // The whole point of deriving the palette rather than hand-picking it:
      // a pack cannot ship colours nobody can read.
      expect(contrastProblems(derivePalette(pack.atmosphere))).toEqual([]);
    },
  );

  it("supports image puzzles in more than one pack", () => {
    const withImages = PACKS.filter((pack) => livingItems(pack, "imageChoice").length > 0);
    expect(withImages.length).toBeGreaterThanOrEqual(2);
  });

  it("covers every registered kind across the shipped packs", () => {
    const covered = new Set(PACKS.flatMap((pack) => availableKinds(pack)));
    expect([...KIND_IDS].filter((id) => !covered.has(id))).toEqual([]);
  });

  it("gives every kind a renderer-facing name and icon", () => {
    for (const id of KIND_IDS) {
      expect(getKind(id).name.length).toBeGreaterThan(0);
      expect(getKind(id).icon.length).toBeGreaterThan(0);
    }
  });
});

describe("registry", () => {
  it("finds a pack by id", () => {
    expect(findPack("atlas")?.name).toBe("Atlas");
    expect(findPack("nope")).toBeUndefined();
  });

  it("falls back rather than failing on an unknown id", () => {
    expect(resolvePack("nope").id).toBe("hogwarts");
    expect(resolvePack(undefined).id).toBe("hogwarts");
  });

  it("summarises packs without leaking items", () => {
    const summaries = packSummaries();
    expect(summaries.length).toBe(PACKS.length);
    for (const summary of summaries) {
      expect(summary.itemCount).toBeGreaterThan(0);
      expect(summary.kinds.length).toBeGreaterThan(0);
      expect(JSON.stringify(summary)).not.toContain("answer");
    }
  });
});
