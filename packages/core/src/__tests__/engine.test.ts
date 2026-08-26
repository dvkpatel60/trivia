import { describe, expect, it } from "vitest";
import { createRng, derange, randomSeed, seedFor } from "../rng.js";
import { scoreAnswer } from "../scoring.js";
import { buildRound, playableKinds } from "../round.js";
import { defaultConfig, sanitizeConfig } from "../config.js";
import { availableKinds, validatePack } from "../pack.js";
import { toPublicGame } from "../protocol.js";
import { toPublicQuestion } from "../grade.js";
import { buildQuestion } from "../round.js";
import { fixturePack } from "./fixture.js";
import type { GameState } from "../protocol.js";
import type { ContentPack } from "../types.js";

describe("rng", () => {
  it("is deterministic for a seed", () => {
    const a = Array.from({ length: 10 }, () => createRng(42).next());
    expect(new Set(a).size).toBe(1);
    const runA = createRng(1);
    const runB = createRng(1);
    expect([runA.next(), runA.next()]).toEqual([runB.next(), runB.next()]);
  });

  it("shuffles without mutating the input", () => {
    const source = [1, 2, 3, 4, 5];
    const copy = source.slice();
    createRng(3).shuffle(source);
    expect(source).toEqual(copy);
  });

  it("deranges arrays that have another arrangement", () => {
    const rng = createRng(5);
    expect(derange([1, 2, 3], rng, (a, b) => a === b)).not.toEqual([1, 2, 3]);
  });

  it("leaves an all-identical array alone rather than spinning", () => {
    expect(derange(["x", "x"], createRng(1), (a, b) => a === b)).toEqual(["x", "x"]);
  });

  it("produces a usable seed", () => {
    expect(Number.isInteger(randomSeed())).toBe(true);
  });
});

describe("scoring", () => {
  const config = { ...defaultConfig("fixture"), basePoints: 100, seconds: 30 };

  it("pays base points scaled by the fraction", () => {
    expect(scoreAnswer({ ...config, speedBonus: false }, 0.5, null, 0).total).toBe(50);
  });

  it("adds up to half base for an instant answer", () => {
    const instant = scoreAnswer(config, 1, 0, 0);
    expect(instant.total).toBe(150);
    const slow = scoreAnswer(config, 1, 30_000, 0);
    expect(slow.total).toBe(100);
  });

  it("clamps a client claiming negative or absurd elapsed time", () => {
    expect(scoreAnswer(config, 1, -99_999, 0).total).toBe(150);
    expect(scoreAnswer(config, 1, 999_999, 0).total).toBe(100);
  });

  it("builds a streak on full marks and breaks it on partial", () => {
    let streak = 0;
    ({ streak } = scoreAnswer(config, 1, null, streak));
    expect(streak).toBe(1);
    const second = scoreAnswer(config, 1, null, streak);
    expect(second.streak).toBe(2);
    expect(second.lines.some((l) => l.label.startsWith("streak"))).toBe(true);
    expect(scoreAnswer(config, 0.75, null, second.streak).streak).toBe(0);
  });

  it("pays no speed bonus when the timer is off", () => {
    expect(scoreAnswer({ ...config, timerOn: false }, 1, 0, 0).total).toBe(100);
  });
});

describe("round building", () => {
  const config = { ...defaultConfig("fixture"), questionsPerRound: 4 };

  it("draws a single kind for a themed round", () => {
    const round = buildRound({ pack: fixturePack, config, roundIndex: 0, rng: createRng(9) });
    expect(new Set(round.questions.map((q) => q.kind)).size).toBe(1);
    expect(round.themeKind).toBeDefined();
  });

  it("mixes kinds when themed rounds are off", () => {
    const round = buildRound({
      pack: fixturePack,
      config: { ...config, themedRounds: false, questionsPerRound: 8 },
      roundIndex: 0,
      rng: createRng(4),
    });
    expect(new Set(round.questions.map((q) => q.kind)).size).toBeGreaterThan(1);
  });

  it("does not repeat an item until the pool is spent", () => {
    const usage = {};
    const rng = createRng(11);
    const prompts = new Set<string>();
    // Five live choice items; five questions should all be distinct.
    for (let i = 0; i < 5; i++) {
      prompts.add(buildQuestion("choice", fixturePack, rng, usage).prompt);
    }
    expect(prompts.size).toBe(5);
  });

  it("recycles the pool instead of failing once it is spent", () => {
    const usage = {};
    const rng = createRng(12);
    expect(() => {
      for (let i = 0; i < 12; i++) buildQuestion("choice", fixturePack, rng, usage);
    }).not.toThrow();
  });

  it("skips retired items", () => {
    const usage = {};
    const rng = createRng(13);
    for (let i = 0; i < 20; i++) {
      expect(buildQuestion("choice", fixturePack, rng, usage).prompt).not.toBe("retired");
    }
  });

  it("honours the host's kind selection", () => {
    const only = { ...config, kinds: { choice: true, truefalse: false, match: false, unscramble: false, oddOneOut: false, whoAmI: false, categorize: false, sequence: false, imageChoice: false } };
    expect(playableKinds(fixturePack, only)).toEqual(["choice"]);
  });

  it("falls back to every kind rather than dealing nothing", () => {
    const none = { ...config, kinds: Object.fromEntries(availableKinds(fixturePack).map((k) => [k, false])) };
    expect(playableKinds(fixturePack, none).length).toBeGreaterThan(0);
  });
});

describe("config sanitizing", () => {
  it("clamps values a crafted request could send", () => {
    const config = sanitizeConfig({ rounds: 9999, seconds: -4, basePoints: 1e9 }, "fixture");
    expect(config.rounds).toBe(10);
    expect(config.seconds).toBe(10);
    expect(config.basePoints).toBe(500);
  });

  it("survives junk", () => {
    const config = sanitizeConfig({ rounds: "many", kinds: null }, "fixture");
    expect(Number.isFinite(config.rounds)).toBe(true);
    expect(config.rounds).toBeGreaterThanOrEqual(1);
  });

  it("re-enables everything if a client disables every kind", () => {
    const config = sanitizeConfig(
      { kinds: Object.fromEntries(availableKinds(fixturePack).map((k) => [k, false])) },
      "fixture",
    );
    expect(Object.values(config.kinds).some(Boolean)).toBe(true);
  });
});

describe("pack validation", () => {
  it("passes the fixture", () => {
    expect(validatePack(fixturePack)).toEqual([]);
  });

  it("catches an unknown category", () => {
    const broken: ContentPack = {
      ...fixturePack,
      items: { ...fixturePack.items, categorize: [{ label: "x", category: "ghost" }] },
    };
    expect(validatePack(broken).some((p) => p.message.includes("ghost"))).toBe(true);
  });

  it("catches an out-of-range answer index", () => {
    const broken: ContentPack = {
      ...fixturePack,
      items: { ...fixturePack.items, choice: [{ prompt: "x", options: ["a", "b"], answer: 5 }] },
    };
    expect(validatePack(broken).some((p) => p.kind === "choice")).toBe(true);
  });

  it("catches image items with no alt text", () => {
    const broken: ContentPack = {
      ...fixturePack,
      items: {
        ...fixturePack.items,
        imageChoice: [
          { prompt: "x", media: { src: "data:,", alt: "  " }, options: ["a", "b"], answer: 0 },
        ],
      },
    };
    expect(broken.items.imageChoice).toBeDefined();
    expect(validatePack(broken).some((p) => p.message.includes("alt text"))).toBe(true);
  });
});

describe("answer secrecy", () => {
  it("drops the solution when publishing a question", () => {
    const q = buildQuestion("choice", fixturePack, createRng(2), {});
    expect("solution" in toPublicQuestion(q)).toBe(false);
  });

  const gameWithRound = (revealed: boolean): GameState => {
    const questions = ["choice", "unscramble", "match", "categorize", "sequence", "whoAmI"].map(
      (kind, i) => buildQuestion(kind as never, fixturePack, createRng(100 + i), {}),
    );
    return {
      code: "FIXTURE-01",
      hostId: "h",
      phase: { name: "question", round: 0, index: 0, startedAt: 0, endsAt: null },
      config: defaultConfig("fixture"),
      createdAt: 0,
      updatedAt: 0,
      version: 1,
      players: {},
      usage: {},
      rounds: { 0: { questions, revealed } },
    };
  };

  it("never ships a solution field to players mid-round", () => {
    const published = JSON.stringify(toPublicGame(gameWithRound(false)));
    expect(published).not.toContain('"solution"');
    expect(published).not.toContain("PHOENIX");
  });

  it("still hides raw solutions after a reveal, exposing only prose answers", () => {
    const publicGame = toPublicGame(gameWithRound(true));
    const published = JSON.stringify(publicGame);
    expect(published).not.toContain('"solution"');
    expect(publicGame.rounds[0]?.solutions?.length).toBe(6);
    expect(publicGame.rounds[0]?.solutions?.some((s) => s.includes("PHOENIX"))).toBe(true);
  });
});

describe("deterministic deals", () => {
  it("derives the same seed for the same game and round", () => {
    expect(seedFor("NIFFLER-42", 3)).toBe(seedFor("NIFFLER-42", 3));
    expect(seedFor("NIFFLER-42", 3)).not.toBe(seedFor("NIFFLER-42", 4));
    expect(seedFor("NIFFLER-42", 3)).not.toBe(seedFor("THESTRAL-11", 3));
  });

  it("deals an identical round to two servers racing to advance", () => {
    const dealOn = () => {
      const rng = createRng(seedFor("NIFFLER-42", 2));
      return buildRound({
        pack: fixturePack,
        config: { ...defaultConfig("fixture"), questionsPerRound: 4 },
        roundIndex: 2,
        rng,
      }).questions;
    };
    expect(JSON.stringify(dealOn())).toBe(JSON.stringify(dealOn()));
  });
});
