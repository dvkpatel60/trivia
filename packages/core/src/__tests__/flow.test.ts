import { describe, expect, it } from "vitest";
import { createRng } from "../rng.js";
import { defaultConfig } from "../config.js";
import {
  advance,
  createGame,
  GameError,
  hostAdvance,
  joinGame,
  removePlayer,
  startGame,
  submitAnswers,
  touchPlayer,
  type EngineContext,
} from "../engine.js";
import { BEAT_MS, gameStatus, STANDINGS_MS, SUBMIT_GRACE_MS } from "../phase.js";
import { toPublicGame, type GameState } from "../protocol.js";
import { fixturePack } from "./fixture.js";
import type { GameConfig, Pacing } from "../types.js";

const T0 = 1_700_000_000_000;

const ctxAt = (now: number): EngineContext => ({ pack: fixturePack, rng: createRng(99), now });

function makeGame(pacing: Pacing, overrides: Partial<GameConfig> = {}): GameState {
  const config: GameConfig = {
    ...defaultConfig("fixture"),
    pacing,
    rounds: 2,
    questionsPerRound: 2,
    themedRounds: true,
    seconds: 30,
    ...overrides,
  };
  return createGame({ code: "TEST-01", hostId: "host", hostName: "Host", config, now: T0 });
}

/** Answer question `index` correctly, whatever kind it happens to be. */
function correctAnswer(game: GameState, round: number, index: number): unknown {
  const question = game.rounds[round]?.questions[index];
  if (!question) throw new Error("no question");
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
    case "sequence":
      return {
        order: question.view.items
          .map((_, i) => i)
          .sort((a, b) => (question.solution.positions[a] ?? 0) - (question.solution.positions[b] ?? 0)),
      };
  }
}

const answerRight = (game: GameState, playerId: string, round: number, index: number, now: number) =>
  submitAnswers(game, playerId, round, { [index]: { answer: correctAnswer(game, round, index), elapsedMs: 0 } }, now);

describe("lobby", () => {
  it("seats the host first and hands out distinct colours", () => {
    const game = makeGame("live");
    joinGame(game, "p2", "Ana", T0 + 100);
    joinGame(game, "p3", "Bo", T0 + 200);
    const colors = Object.values(game.players).map((p) => p.color);
    expect(new Set(colors).size).toBe(3);
    expect(gameStatus(game.phase)).toBe("lobby");
  });

  it("treats a rejoin as the same player, keeping their score", () => {
    const game = makeGame("live");
    joinGame(game, "p2", "Ana", T0 + 100);
    const player = game.players.p2;
    if (!player) throw new Error("missing");
    player.score = 400;
    joinGame(game, "p2", "Ana on phone", T0 + 5_000);
    expect(Object.keys(game.players).length).toBe(2);
    expect(game.players.p2?.score).toBe(400);
    expect(game.players.p2?.name).toBe("Ana on phone");
  });

  it("refuses a start from anyone but the host", () => {
    const game = makeGame("live");
    joinGame(game, "p2", "Ana", T0);
    expect(() => startGame(game, "p2", ctxAt(T0))).toThrow(GameError);
  });

  it("will not let a player leave the game headless", () => {
    const game = makeGame("live");
    removePlayer(game, "host");
    expect(game.players.host).toBeDefined();
  });

  it("only bumps presence when it has gone stale", () => {
    const game = makeGame("live");
    expect(touchPlayer(game, "host", T0 + 1_000)).toBe(false);
    expect(touchPlayer(game, "host", T0 + 60_000)).toBe(true);
    expect(touchPlayer(game, "nobody", T0)).toBe(false);
  });
});

describe("live pacing", () => {
  it("puts everyone on the same question with a shared deadline", () => {
    const game = makeGame("live");
    joinGame(game, "p2", "Ana", T0);
    startGame(game, "host", ctxAt(T0));

    expect(game.phase.name).toBe("question");
    if (game.phase.name !== "question") throw new Error("phase");
    expect(game.phase.index).toBe(0);
    expect(game.phase.endsAt).toBeGreaterThan(T0);
  });

  it("moves to the beat as soon as everyone has answered", () => {
    const game = makeGame("live");
    joinGame(game, "p2", "Ana", T0);
    startGame(game, "host", ctxAt(T0));

    answerRight(game, "host", 0, 0, T0 + 1_000);
    expect(advance(game, ctxAt(T0 + 1_000))).toBe(false);

    answerRight(game, "p2", 0, 0, T0 + 1_200);
    expect(advance(game, ctxAt(T0 + 1_200))).toBe(true);
    expect(game.phase.name).toBe("beat");
  });

  it("moves on when the deadline passes even if nobody answered", () => {
    const game = makeGame("live");
    startGame(game, "host", ctxAt(T0));
    if (game.phase.name !== "question") throw new Error("phase");
    const { endsAt } = game.phase;
    if (endsAt == null) throw new Error("expected a deadline");

    expect(advance(game, ctxAt(endsAt - 1))).toBe(false);
    expect(advance(game, ctxAt(endsAt + 1))).toBe(true);
    expect(game.phase.name).toBe("beat");
  });

  it("runs a whole game from lobby to final", () => {
    const game = makeGame("live");
    joinGame(game, "p2", "Ana", T0);
    startGame(game, "host", ctxAt(T0));

    let now = T0;
    const seen: string[] = [];
    for (let guard = 0; guard < 40 && game.phase.name !== "final"; guard++) {
      seen.push(game.phase.name);
      if (game.phase.name === "question") {
        answerRight(game, "host", game.phase.round, game.phase.index, now + 500);
        answerRight(game, "p2", game.phase.round, game.phase.index, now + 600);
      }
      now += 10_000;
      advance(game, ctxAt(now));
    }

    expect(game.phase.name).toBe("final");
    expect(gameStatus(game.phase)).toBe("done");
    expect(seen).toContain("beat");
    expect(seen).toContain("standings");
    expect(Object.keys(game.rounds).length).toBe(2);
    expect(game.players.host?.score).toBeGreaterThan(0);
  });

  it("fast-forwards a game nobody polled for a while", () => {
    const game = makeGame("live");
    startGame(game, "host", ctxAt(T0));
    // Long enough for both questions of round 0 and its standings to lapse.
    advance(game, ctxAt(T0 + 10 * 60_000));
    expect(["question", "final"]).toContain(game.phase.name);
    if (game.phase.name === "question") expect(game.phase.round).toBe(1);
  });

  it("does not let one player's answer end the question for a late joiner", () => {
    const game = makeGame("live");
    startGame(game, "host", ctxAt(T0));
    joinGame(game, "late", "Late", T0 + 2_000);
    answerRight(game, "host", 0, 0, T0 + 2_500);
    // The host was the only player present when the question opened.
    expect(advance(game, ctxAt(T0 + 2_600))).toBe(true);
    expect(game.phase.name).toBe("beat");
  });

  it("rejects an answer to a question that is not the current one", () => {
    const game = makeGame("live");
    startGame(game, "host", ctxAt(T0));
    const outcome = submitAnswers(
      game,
      "host",
      0,
      { 1: { answer: correctAnswer(game, 0, 1), elapsedMs: 0 } },
      T0 + 100,
    );
    expect(outcome.results[1]).toBeUndefined();
  });

  it("still accepts an answer that lands just inside the grace window", () => {
    const game = makeGame("live");
    startGame(game, "host", ctxAt(T0));
    if (game.phase.name !== "question") throw new Error("phase");
    const endsAt = game.phase.endsAt;
    if (endsAt == null) throw new Error("expected a deadline");

    const outcome = answerRight(game, "host", 0, 0, endsAt + SUBMIT_GRACE_MS - 10);
    expect(outcome.results[0]?.fraction).toBe(1);
  });

  it("drops an answer that arrives after the grace window", () => {
    const game = makeGame("live");
    startGame(game, "host", ctxAt(T0));
    if (game.phase.name !== "question") throw new Error("phase");
    const endsAt = game.phase.endsAt;
    if (endsAt == null) throw new Error("expected a deadline");

    const outcome = answerRight(game, "host", 0, 0, endsAt + SUBMIT_GRACE_MS + 500);
    expect(outcome.results[0]).toBeUndefined();
  });

  it("times an answer from the server's clock, not the client's claim", () => {
    const game = makeGame("live", { questionsPerRound: 1, rounds: 1, basePoints: 100 });
    startGame(game, "host", ctxAt(T0));
    // Client lies that it answered instantly, 20 seconds in.
    const outcome = submitAnswers(
      game,
      "host",
      0,
      { 0: { answer: correctAnswer(game, 0, 0), elapsedMs: 0 } },
      T0 + 20_000,
    );
    const points = outcome.results[0]?.points ?? 0;
    expect(points).toBeGreaterThanOrEqual(100);
    expect(points).toBeLessThan(150); // no full-speed bonus for a slow answer
  });
});

describe("async pacing", () => {
  it("opens a round instead of a question", () => {
    const game = makeGame("async");
    joinGame(game, "p2", "Ana", T0);
    startGame(game, "host", ctxAt(T0));
    expect(game.phase.name).toBe("open");
  });

  it("lets a player answer the whole round in one go, at their own pace", () => {
    const game = makeGame("async");
    joinGame(game, "p2", "Ana", T0);
    startGame(game, "host", ctxAt(T0));

    const outcome = submitAnswers(
      game,
      "host",
      0,
      {
        0: { answer: correctAnswer(game, 0, 0), elapsedMs: 1_000 },
        1: { answer: correctAnswer(game, 0, 1), elapsedMs: 2_000 },
      },
      T0 + 60 * 60_000, // an hour later; async has no shared clock
    );
    expect(Object.keys(outcome.results).length).toBe(2);
    expect(outcome.roundScore).toBeGreaterThan(0);
  });

  it("closes the round once everyone is in", () => {
    const game = makeGame("async");
    joinGame(game, "p2", "Ana", T0);
    startGame(game, "host", ctxAt(T0));

    const all = (id: string) =>
      submitAnswers(
        game,
        id,
        0,
        {
          0: { answer: correctAnswer(game, 0, 0), elapsedMs: 0 },
          1: { answer: correctAnswer(game, 0, 1), elapsedMs: 0 },
        },
        T0 + 1_000,
      );

    all("host");
    expect(advance(game, ctxAt(T0 + 1_000))).toBe(false);
    all("p2");
    expect(advance(game, ctxAt(T0 + 1_100))).toBe(true);
    expect(game.phase.name).toBe("reveal");
  });

  it("closes the round on a deadline when one is set", () => {
    const game = makeGame("async", { roundOpenMinutes: 30 });
    joinGame(game, "p2", "Ana", T0);
    startGame(game, "host", ctxAt(T0));

    expect(advance(game, ctxAt(T0 + 29 * 60_000))).toBe(false);
    expect(advance(game, ctxAt(T0 + 31 * 60_000))).toBe(true);
    expect(game.phase.name).toBe("reveal");
  });

  it("waits for the host to move on from a reveal", () => {
    const game = makeGame("async");
    startGame(game, "host", ctxAt(T0));
    hostAdvance(game, "host", ctxAt(T0 + 1_000)); // close round 0
    expect(game.phase.name).toBe("reveal");

    // No clock on reading answers: a week later it is still waiting.
    expect(advance(game, ctxAt(T0 + 7 * 24 * 60 * 60_000))).toBe(false);

    hostAdvance(game, "host", ctxAt(T0 + 2_000));
    expect(game.phase.name).toBe("open");
    if (game.phase.name !== "open") throw new Error("phase");
    expect(game.phase.round).toBe(1);
  });

  it("refuses a host-only advance from a player", () => {
    const game = makeGame("async");
    joinGame(game, "p2", "Ana", T0);
    startGame(game, "host", ctxAt(T0));
    expect(() => hostAdvance(game, "p2", ctxAt(T0 + 1))).toThrow(GameError);
  });

  it("scores non-submitters zero and breaks their streak when the round closes", () => {
    const game = makeGame("async");
    joinGame(game, "idle", "Idle", T0);
    startGame(game, "host", ctxAt(T0));

    const idle = game.players.idle;
    if (!idle) throw new Error("missing");
    idle.streak = 3;

    hostAdvance(game, "host", ctxAt(T0 + 1_000));
    expect(game.phase.name).toBe("reveal");
    expect(idle.rounds[0]?.answers[0]?.message).toBe("No answer.");
    expect(idle.score).toBe(0);
    expect(idle.streak).toBe(0);
  });
});

describe("submission is idempotent", () => {
  it("does not double-score a retried request", () => {
    const game = makeGame("async");
    startGame(game, "host", ctxAt(T0));
    const payload = { 0: { answer: correctAnswer(game, 0, 0), elapsedMs: 500 } };

    const first = submitAnswers(game, "host", 0, payload, T0 + 500);
    const scoreAfterFirst = game.players.host?.score ?? 0;
    const second = submitAnswers(game, "host", 0, payload, T0 + 900);

    expect(scoreAfterFirst).toBeGreaterThan(0);
    expect(game.players.host?.score).toBe(scoreAfterFirst);
    expect(second.results[0]).toEqual(first.results[0]);
  });

  it("ignores answers to questions that do not exist", () => {
    const game = makeGame("async");
    startGame(game, "host", ctxAt(T0));
    const outcome = submitAnswers(
      game,
      "host",
      0,
      { 99: { answer: { choice: 0 }, elapsedMs: 0 }, [-1]: { answer: { choice: 0 }, elapsedMs: 0 } },
      T0 + 500,
    );
    expect(Object.keys(outcome.results).length).toBe(0);
  });

  it("refuses answers from a stranger", () => {
    const game = makeGame("async");
    startGame(game, "host", ctxAt(T0));
    expect(() => submitAnswers(game, "ghost", 0, {}, T0)).toThrow(GameError);
  });
});

describe("what players are allowed to see", () => {
  it("hides solutions during a live question and shows prose after the reveal", () => {
    const game = makeGame("live", { rounds: 1, questionsPerRound: 1 });
    startGame(game, "host", ctxAt(T0));

    const during = JSON.stringify(toPublicGame(game));
    expect(during).not.toContain('"solution"');
    expect(toPublicGame(game).rounds[0]?.solutions).toBeUndefined();

    advance(game, ctxAt(T0 + 10 * 60_000));
    const after = toPublicGame(game);
    expect(JSON.stringify(after)).not.toContain('"solution"');
    expect(after.rounds[0]?.solutions?.length).toBe(1);
  });

  it("reports a status derived from the phase", () => {
    const game = makeGame("live");
    expect(toPublicGame(game).status).toBe("lobby");
    startGame(game, "host", ctxAt(T0));
    expect(toPublicGame(game).status).toBe("playing");
  });
});

describe("beat and standings timing", () => {
  it("holds the beat for its full window", () => {
    const game = makeGame("live");
    startGame(game, "host", ctxAt(T0));
    answerRight(game, "host", 0, 0, T0 + 100);
    advance(game, ctxAt(T0 + 200));
    if (game.phase.name !== "beat") throw new Error("phase");

    expect(advance(game, ctxAt(T0 + 200 + BEAT_MS - 100))).toBe(false);
    expect(advance(game, ctxAt(T0 + 200 + BEAT_MS + 100))).toBe(true);
  });

  it("holds standings for its full window before the next round", () => {
    const game = makeGame("live", { questionsPerRound: 1, rounds: 2 });
    startGame(game, "host", ctxAt(T0));
    answerRight(game, "host", 0, 0, T0 + 100);
    advance(game, ctxAt(T0 + 200)); // -> beat
    advance(game, ctxAt(T0 + 200 + BEAT_MS + 1)); // -> standings
    if (game.phase.name !== "standings") throw new Error("phase");
    const startedAt = game.phase.startedAt;

    expect(advance(game, ctxAt(startedAt + STANDINGS_MS - 100))).toBe(false);
    expect(advance(game, ctxAt(startedAt + STANDINGS_MS + 100))).toBe(true);
    expect(game.phase.name).toBe("question");
  });
});
