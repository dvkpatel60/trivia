import { describe, expect, it } from "vitest";
import { createRng } from "../rng.js";
import { getKind, KIND_IDS } from "../kinds/index.js";
import { gradeQuestion } from "../grade.js";
import { buildQuestion } from "../round.js";
import { fixturePack } from "./fixture.js";
import type { AnyQuestion, PuzzleKindId } from "../types.js";

const build = (kind: PuzzleKindId, seed = 7): AnyQuestion =>
  buildQuestion(kind, fixturePack, createRng(seed), {});

describe("kind registry", () => {
  it("registers every kind under its own id", () => {
    for (const id of KIND_IDS) expect(getKind(id).id).toBe(id);
  });

  it("gives every kind a non-zero time multiplier and item cost", () => {
    for (const id of KIND_IDS) {
      expect(getKind(id).timeMultiplier).toBeGreaterThan(0);
      expect(getKind(id).itemsPerQuestion).toBeGreaterThanOrEqual(1);
    }
  });

  it("scores a missing answer as zero for every kind", () => {
    for (const id of KIND_IDS) {
      const result = gradeQuestion(build(id), null);
      expect(result.fraction, `${id} with no answer`).toBe(0);
    }
  });
});

describe("choice", () => {
  it("grades the shuffled correct index", () => {
    const q = build("choice");
    if (q.kind !== "choice") throw new Error("wrong kind");
    expect(gradeQuestion(q, { choice: q.solution.correct }).fraction).toBe(1);
    expect(gradeQuestion(q, { choice: (q.solution.correct + 1) % 4 }).fraction).toBe(0);
  });

  it("keeps the answer aligned with its option text after shuffling", () => {
    for (let seed = 0; seed < 30; seed++) {
      const q = build("choice", seed);
      if (q.kind !== "choice") throw new Error("wrong kind");
      expect(q.view.options[q.solution.correct]).toMatch(/^right\d$/);
    }
  });
});

describe("truefalse", () => {
  it("grades both directions", () => {
    const q = build("truefalse");
    if (q.kind !== "truefalse") throw new Error("wrong kind");
    expect(gradeQuestion(q, { value: q.solution.correct }).fraction).toBe(1);
    expect(gradeQuestion(q, { value: !q.solution.correct }).fraction).toBe(0);
  });
});

describe("match", () => {
  it("awards partial credit per pair", () => {
    const q = build("match");
    if (q.kind !== "match") throw new Error("wrong kind");
    const correct = q.view.left.map((l) => [l, q.solution.truth[l]] as [string, string]);
    expect(gradeQuestion(q, { pairs: correct }).fraction).toBe(1);

    const halfRight = correct.slice(0, 2).concat(
      correct.slice(2).map(([l]) => [l, "nonsense"] as [string, string]),
    );
    expect(gradeQuestion(q, { pairs: halfRight }).fraction).toBe(0.5);
    expect(gradeQuestion(q, { pairs: [] }).fraction).toBe(0);
  });
});

describe("unscramble", () => {
  it("ignores case and punctuation", () => {
    const q = build("unscramble");
    if (q.kind !== "unscramble") throw new Error("wrong kind");
    expect(gradeQuestion(q, { word: " pho-enix " }).fraction).toBe(1);
    expect(gradeQuestion(q, { word: "fawkes" }).fraction).toBe(0);
  });

  it("never serves the tiles already in the answer's order", () => {
    for (let seed = 0; seed < 40; seed++) {
      const q = build("unscramble", seed);
      if (q.kind !== "unscramble") throw new Error("wrong kind");
      expect(q.view.tiles.join("")).not.toBe(q.solution.word);
    }
  });
});

describe("whoAmI", () => {
  it("pays less the more clues were taken", () => {
    const q = build("whoAmI");
    if (q.kind !== "whoAmI") throw new Error("wrong kind");
    const correct = q.solution.correct;
    expect(gradeQuestion(q, { choice: correct, clueIndex: 0 }).fraction).toBe(1);
    expect(gradeQuestion(q, { choice: correct, clueIndex: 1 }).fraction).toBeCloseTo(0.7);
    expect(gradeQuestion(q, { choice: correct, clueIndex: 2 }).fraction).toBeCloseTo(0.45);
  });

  it("clamps a clue index a client made up", () => {
    const q = build("whoAmI");
    if (q.kind !== "whoAmI") throw new Error("wrong kind");
    expect(gradeQuestion(q, { choice: q.solution.correct, clueIndex: 99 }).fraction).toBeCloseTo(0.45);
    expect(gradeQuestion(q, { choice: q.solution.correct, clueIndex: -5 }).fraction).toBe(1);
  });
});

describe("categorize", () => {
  it("scores each item independently", () => {
    const q = build("categorize");
    if (q.kind !== "categorize") throw new Error("wrong kind");
    expect(gradeQuestion(q, { assignments: q.solution.truth.slice() }).fraction).toBe(1);
    const oneWrong = q.solution.truth.slice();
    oneWrong[0] = oneWrong[0] === "alpha" ? "beta" : "alpha";
    expect(gradeQuestion(q, { assignments: oneWrong }).fraction).toBeCloseTo(2 / 3);
  });

  it("offers the pack's categories, not hard-coded ones", () => {
    const q = build("categorize");
    if (q.kind !== "categorize") throw new Error("wrong kind");
    expect(q.view.categories.map((c) => c.id)).toEqual(["alpha", "beta"]);
  });
});

describe("sequence", () => {
  it("gives credit per correctly placed item", () => {
    const q = build("sequence");
    if (q.kind !== "sequence") throw new Error("wrong kind");
    const perfect = q.view.items.map((_, i) => i).sort(
      (a, b) => (q.solution.positions[a] ?? 0) - (q.solution.positions[b] ?? 0),
    );
    expect(gradeQuestion(q, { order: perfect }).fraction).toBe(1);

    const swapped = perfect.slice();
    const first = swapped[0] as number;
    swapped[0] = swapped[1] as number;
    swapped[1] = first;
    expect(gradeQuestion(q, { order: swapped }).fraction).toBeCloseTo(0.5);
  });

  it("never serves items already in order", () => {
    for (let seed = 0; seed < 40; seed++) {
      const q = build("sequence", seed);
      if (q.kind !== "sequence") throw new Error("wrong kind");
      const inOrder = q.solution.positions.every((p, i) => p === i);
      expect(inOrder).toBe(false);
    }
  });
});

describe("imageChoice", () => {
  it("carries its media into the public view", () => {
    const q = build("imageChoice");
    expect(q.media?.[0]?.src).toContain("data:image/svg+xml");
    expect(q.media?.[0]?.alt).toBeTruthy();
  });

  it("grades like a choice question", () => {
    const q = build("imageChoice");
    if (q.kind !== "imageChoice") throw new Error("wrong kind");
    expect(gradeQuestion(q, { choice: q.solution.correct }).fraction).toBe(1);
  });
});
