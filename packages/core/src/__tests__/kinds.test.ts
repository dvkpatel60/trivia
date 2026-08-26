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

describe("connections", () => {
  it("shuffles every group's members into one pool", () => {
    const q = build("connections");
    if (q.kind !== "connections") throw new Error("wrong kind");
    const expected = q.solution.groups.flatMap((group) => group.members);
    expect(q.view.tiles.slice().sort()).toEqual(expected.slice().sort());
    expect(q.view.tiles.length).toBe(q.view.groupSize * q.view.groupCount);
  });

  it("scores a group found however its members were ordered", () => {
    const q = build("connections");
    if (q.kind !== "connections") throw new Error("wrong kind");
    const first = q.solution.groups[0]!.members.slice().reverse();
    expect(gradeQuestion(q, { groups: [first] }).fraction).toBeCloseTo(0.25);
  });

  it("gives partial credit for a partial solve", () => {
    const q = build("connections");
    if (q.kind !== "connections") throw new Error("wrong kind");
    const two = q.solution.groups.slice(0, 2).map((group) => group.members);
    expect(gradeQuestion(q, { groups: two }).fraction).toBeCloseTo(0.5);
    expect(gradeQuestion(q, { groups: q.solution.groups.map((g) => g.members) }).fraction).toBe(1);
  });

  it("cannot be farmed by submitting one correct group four times", () => {
    const q = build("connections");
    if (q.kind !== "connections") throw new Error("wrong kind");
    const same = q.solution.groups[0]!.members;
    expect(gradeQuestion(q, { groups: [same, same, same, same] }).fraction).toBeCloseTo(0.25);
  });

  it("scores a near miss as nothing — a group is all four or none", () => {
    const q = build("connections");
    if (q.kind !== "connections") throw new Error("wrong kind");
    const [a, b] = q.solution.groups;
    const nearly = [...a!.members.slice(0, 3), b!.members[0]!];
    expect(gradeQuestion(q, { groups: [nearly] }).fraction).toBe(0);
  });

  it("survives junk in the answer", () => {
    const q = build("connections");
    expect(gradeQuestion(q, { groups: [null, "nope", []] }).fraction).toBe(0);
  });
});

describe("categorize sets", () => {
  it("never mixes two sets into one question", () => {
    // Sorting is only coherent if every label on screen shares its buckets.
    for (let seed = 0; seed < 40; seed++) {
      const q = buildQuestion("categorize", fixturePack, createRng(seed), {});
      if (q.kind !== "categorize") throw new Error("wrong kind");
      const ids = new Set(q.view.categories.map((category) => category.id));
      for (const truth of q.solution.truth) expect(ids.has(truth)).toBe(true);
    }
  });

  it("draws from more than one set across many questions", () => {
    const prompts = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      prompts.add(buildQuestion("categorize", fixturePack, createRng(seed), {}).prompt);
    }
    expect(prompts.size).toBeGreaterThan(1);
  });

  it("uses the set's own prompt", () => {
    const q = buildQuestion("categorize", fixturePack, createRng(1), {});
    expect(["Alpha or beta?", "Odd or even?"]).toContain(q.prompt);
  });
});
