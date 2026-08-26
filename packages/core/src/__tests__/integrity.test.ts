import { describe, expect, it } from "vitest";

import { createRng, seedFor } from "../rng.js";
import { defaultConfig } from "../config.js";
import { getKind } from "../kinds/index.js";
import {
  advance,
  createGame,
  joinGame,
  startGame,
  submitAnswers,
  type EngineContext,
} from "../engine.js";
import { BEAT_MS, SUBMIT_GRACE_MS } from "../phase.js";
import { leaderOf, ranked, type GameState, type PlayerState } from "../protocol.js";
import { scoreAnswer, SPEED_BONUS_SHARE, STREAK_STEP } from "../scoring.js";
import { fixturePack } from "./fixture.js";
import type { AnyQuestion, GameConfig, Pacing } from "../types.js";

/**
 * Does a whole game add up, and does it finish?
 *
 * These are the invariants that matter when real people are keeping score:
 * every point on the board can be traced to a graded answer, nothing is
 * double-counted, and no combination of pacing and timing leaves a game
 * stuck short of the final screen.
 */

const T0 = 1_700_000_000_000;

const ctxAt = (code: string, now: number): EngineContext => ({
  pack: fixturePack,
  rngFor: (round) => createRng(seedFor(code, round)),
  now,
});

function makeGame(pacing: Pacing, overrides: Partial<GameConfig> = {}): GameState {
  const config: GameConfig = {
    ...defaultConfig("fixture"),
    pacing,
    rounds: 3,
    questionsPerRound: 3,
    themedRounds: false,
    seconds: 30,
    basePoints: 100,
    ...overrides,
  };
  return createGame({ code: "SCORE-01", hostId: "host", hostName: "Host", config, now: T0 });
}

/** The right answer for whatever kind this happens to be. */
function correctAnswer(question: AnyQuestion): unknown {
  switch (question.kind) {
    case "choice":
    case "oddOneOut":
    case "imageChoice":
      return { choice: question.solution.correct };
    case "truefalse":
      return { value: question.solution.correct };
    case "whoAmI":
      return { choice: question.solution.correct, clueIndex: 0 };
    case "unscramble":
      return { word: question.solution.word };
    case "match":
      return { pairs: question.view.left.map((l) => [l, question.solution.truth[l]]) };
    case "categorize":
      return { assignments: question.solution.truth.slice() };
    case "connections":
      return { groups: question.solution.groups.map((group) => group.members) };
    case "sequence":
      return {
        order: question.view.items
          .map((_, i) => i)
          .sort(
            (a, b) => (question.solution.positions[a] ?? 0) - (question.solution.positions[b] ?? 0),
          ),
      };
  }
}

/* ── the invariants ───────────────────────────────────────────────────── */

/** Every point on a player's total traces back to a graded answer. */
function expectScoreAddsUp(player: PlayerState): void {
  let fromRounds = 0;

  for (const [key, round] of Object.entries(player.rounds)) {
    const fromAnswers = Object.values(round.answers).reduce(
      (sum, answer) => sum + answer.points,
      0,
    );
    expect(round.score, `${player.id} round ${key}`).toBe(fromAnswers);
    fromRounds += round.score;

    for (const answer of Object.values(round.answers)) {
      // A ledger a player can read has to sum to the number beside it.
      const fromLines = answer.lines.reduce((sum, line) => sum + line.points, 0);
      expect(fromLines, `${player.id} round ${key} ledger`).toBe(answer.points);
      expect(answer.fraction).toBeGreaterThanOrEqual(0);
      expect(answer.fraction).toBeLessThanOrEqual(1);
      expect(answer.points).toBeGreaterThanOrEqual(0);
    }
  }

  expect(player.score, `${player.id} total`).toBe(fromRounds);
}

/** Nothing may be scored for a question that was never dealt. */
function expectNoOrphanAnswers(game: GameState): void {
  for (const player of Object.values(game.players)) {
    for (const [key, round] of Object.entries(player.rounds)) {
      const questions = game.rounds[Number(key)]?.questions.length ?? 0;
      for (const index of Object.keys(round.answers)) {
        expect(Number(index), `${player.id} round ${key}`).toBeLessThan(questions);
      }
    }
  }
}

/**
 * Play a whole game the way the app does, and hand back the finished state.
 *
 * `answerRate` decides how often a player gets one right, so a run covers
 * perfect play, partial play, and players who sit some out.
 */
function playToCompletion(
  pacing: Pacing,
  options: { players: string[]; answerRate: number; overrides?: Partial<GameConfig> },
): GameState {
  const game = makeGame(pacing, options.overrides);
  for (const id of options.players) {
    if (id !== "host") joinGame(game, id, id, T0);
  }
  startGame(game, "host", ctxAt(game.code, T0));

  let now = T0;
  let turns = 0;
  const rng = createRng(4242);

  while (game.phase.name !== "final" && turns < 400) {
    turns += 1;
    const phase = game.phase;

    if (phase.name === "question") {
      now += 800;
      for (const id of options.players) {
        if (rng.next() > options.answerRate) continue;
        const question = game.rounds[phase.round]?.questions[phase.index];
        if (!question) continue;
        submitAnswers(
          game,
          id,
          phase.round,
          { [phase.index]: { answer: correctAnswer(question), elapsedMs: 0 } },
          now,
        );
      }
    } else if (phase.name === "open") {
      now += 800;
      const questions = game.rounds[phase.round]?.questions ?? [];
      for (const id of options.players) {
        const answers: Record<number, { answer: unknown; elapsedMs: number }> = {};
        questions.forEach((question, index) => {
          if (rng.next() > options.answerRate) return;
          answers[index] = { answer: correctAnswer(question), elapsedMs: 1_000 };
        });
        if (Object.keys(answers).length > 0) submitAnswers(game, id, phase.round, answers, now);
      }
    }

    // Whatever is still open, time it out; whatever is waiting on a host, force.
    now += 60_000;
    advance(game, ctxAt(game.code, now), true);
  }

  return game;
}

const PACINGS: Pacing[] = ["live", "async", "local"];

describe.each(PACINGS)("a %s game", (pacing) => {
  it("reaches the final screen", () => {
    const game = playToCompletion(pacing, { players: ["host", "ana", "bo"], answerRate: 0.8 });
    expect(game.phase.name).toBe("final");
  });

  it("deals every round it promised, and reveals them all", () => {
    const game = playToCompletion(pacing, { players: ["host", "ana"], answerRate: 1 });
    expect(Object.keys(game.rounds).length).toBe(game.config.rounds);
    for (const round of Object.values(game.rounds)) expect(round.revealed).toBe(true);
  });

  it("adds up, for every player", () => {
    const game = playToCompletion(pacing, { players: ["host", "ana", "bo"], answerRate: 0.65 });
    for (const player of Object.values(game.players)) expectScoreAddsUp(player);
    expectNoOrphanAnswers(game);
  });

  it("scores nothing for a player who never answered", () => {
    const game = playToCompletion(pacing, { players: ["host", "idle"], answerRate: 0 });
    for (const player of Object.values(game.players)) {
      expect(player.score).toBe(0);
      expectScoreAddsUp(player);
    }
    expect(game.phase.name).toBe("final");
  });

  it("finishes even with a single player", () => {
    const game = playToCompletion(pacing, { players: ["host"], answerRate: 1 });
    expect(game.phase.name).toBe("final");
    expect(game.players.host?.score).toBeGreaterThan(0);
  });

  it("finishes with the timer off", () => {
    const game = playToCompletion(pacing, {
      players: ["host", "ana"],
      answerRate: 1,
      overrides: { timerOn: false },
    });
    expect(game.phase.name).toBe("final");
  });

  it("finishes a themed game, where each round is one kind", () => {
    const game = playToCompletion(pacing, {
      players: ["host", "ana"],
      answerRate: 0.9,
      overrides: { themedRounds: true },
    });
    expect(game.phase.name).toBe("final");
    for (const round of Object.values(game.rounds)) {
      expect(new Set(round.questions.map((q) => q.kind)).size).toBe(1);
    }
  });

  it("ranks the leader as whoever actually has the most", () => {
    const game = playToCompletion(pacing, { players: ["host", "ana", "bo"], answerRate: 0.7 });
    const order = ranked(game.players);
    const best = Math.max(...Object.values(game.players).map((player) => player.score));
    expect(order[0]?.score).toBe(best);
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1]!.score).toBeGreaterThanOrEqual(order[i]!.score);
    }
  });
});

describe("what a perfect answer is worth", () => {
  const config = { ...defaultConfig("fixture"), basePoints: 100, seconds: 30 };

  it("pays base, then speed, then streak — and nothing else", () => {
    const instant = scoreAnswer(config, 1, 0, 0);
    expect(instant.total).toBe(100 + 100 * SPEED_BONUS_SHARE);

    const second = scoreAnswer(config, 1, 0, 1);
    expect(second.total).toBe(100 + 100 * SPEED_BONUS_SHARE + STREAK_STEP);
  });

  it("scales the speed bonus by how right the answer was", () => {
    const half = scoreAnswer(config, 0.5, 0, 0);
    // Half the base, and half of the speed bonus that base would have earned.
    expect(half.total).toBe(50 + Math.round(100 * SPEED_BONUS_SHARE * 0.5));
  });

  it("never pays a bonus on a wrong answer", () => {
    expect(scoreAnswer(config, 0, 0, 5).total).toBe(0);
    expect(scoreAnswer(config, 0, 0, 5).streak).toBe(0);
  });
});

describe("live play cannot be timed by the client", () => {
  const setup = () => {
    const game = makeGame("live", { rounds: 1, questionsPerRound: 1, themedRounds: true });
    joinGame(game, "ana", "Ana", T0);
    startGame(game, "host", ctxAt(game.code, T0));
    const question = game.rounds[0]!.questions[0]!;
    return { game, question };
  };

  it("ignores a client claiming it answered instantly", () => {
    const { game, question } = setup();
    const honest = submitAnswers(
      game,
      "host",
      0,
      { 0: { answer: correctAnswer(question), elapsedMs: 25_000 } },
      T0 + 25_000,
    );
    const liar = submitAnswers(
      game,
      "ana",
      0,
      { 0: { answer: correctAnswer(question), elapsedMs: 0 } },
      T0 + 25_000,
    );
    expect(liar.results[0]?.points).toBe(honest.results[0]?.points);
  });

  it("pays no speed bonus for an answer that lands in the grace window", () => {
    const { game, question } = setup();
    if (game.phase.name !== "question") throw new Error("phase");
    const endsAt = game.phase.endsAt!;

    // The question closes; the answer arrives just inside the grace period,
    // claiming to have been instant.
    advance(game, ctxAt(game.code, endsAt + 1));
    expect(game.phase.name).toBe("beat");

    const late = submitAnswers(
      game,
      "ana",
      0,
      { 0: { answer: correctAnswer(question), elapsedMs: 0 } },
      endsAt + SUBMIT_GRACE_MS - 100,
    );

    const kind = getKind(question.kind);
    const base = game.config.basePoints;
    expect(late.results[0]?.fraction).toBe(1);
    // Full marks for being right, nothing for speed it did not have.
    expect(late.results[0]?.points).toBe(base);
    expect(kind.timeMultiplier).toBeGreaterThan(0);
  });

  it("still pays a bonus to someone who genuinely was quick", () => {
    const { game, question } = setup();
    const quick = submitAnswers(
      game,
      "host",
      0,
      { 0: { answer: correctAnswer(question), elapsedMs: 999_999 } },
      T0 + 300,
    );
    expect(quick.results[0]?.points).toBeGreaterThan(game.config.basePoints);
  });
});

describe("a round nobody watched", () => {
  it("fast-forwards to the end rather than stalling", () => {
    const game = makeGame("live", { rounds: 2, questionsPerRound: 2 });
    joinGame(game, "ana", "Ana", T0);
    startGame(game, "host", ctxAt(game.code, T0));

    // Everybody closes their laptop for an hour.
    advance(game, ctxAt(game.code, T0 + 60 * 60_000));
    expect(game.phase.name).toBe("final");
    for (const player of Object.values(game.players)) expectScoreAddsUp(player);
  });

  it("does not skip a beat that is still running", () => {
    const game = makeGame("live", { rounds: 1, questionsPerRound: 2 });
    startGame(game, "host", ctxAt(game.code, T0));
    const question = game.rounds[0]!.questions[0]!;
    submitAnswers(game, "host", 0, { 0: { answer: correctAnswer(question), elapsedMs: 0 } }, T0 + 100);

    advance(game, ctxAt(game.code, T0 + 200));
    expect(game.phase.name).toBe("beat");
    advance(game, ctxAt(game.code, T0 + 200 + BEAT_MS - 50));
    expect(game.phase.name).toBe("beat");
  });
});

describe("who is leading", () => {
  const player = (id: string, score: number): PlayerState => ({
    id,
    name: id,
    color: "#fff",
    joinedAt: 0,
    lastSeenAt: 0,
    score,
    streak: 0,
    rounds: {},
  });

  const board = (...entries: Array<[string, number]>) =>
    Object.fromEntries(entries.map(([id, score]) => [id, player(id, score)]));

  it("names whoever is clear of the rest", () => {
    expect(leaderOf(board(["ana", 300], ["bo", 120]))).toBe("ana");
  });

  it("names nobody when the top two are level", () => {
    // Ranking still has to order them; that does not make one of them ahead.
    expect(leaderOf(board(["ana", 149], ["bo", 149]))).toBeNull();
  });

  it("names nobody before anyone has scored", () => {
    expect(leaderOf(board(["ana", 0], ["bo", 0]))).toBeNull();
    expect(leaderOf({})).toBeNull();
  });

  it("names a lone player who has scored", () => {
    expect(leaderOf(board(["ana", 40]))).toBe("ana");
  });

  it("agrees with the ranking it is drawn from", () => {
    const players = board(["ana", 120], ["bo", 300], ["cy", 80]);
    expect(leaderOf(players)).toBe(ranked(players)[0]?.id);
  });
});
