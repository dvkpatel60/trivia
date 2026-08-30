import { describe, expect, it } from "vitest";
import { defaultConfig } from "../config.js";
import { createGame, joinGame } from "../engine.js";
import { houseScale, shownScore, HOUSE_PERFECT_ROUND } from "../mischief.js";
import { toPublicGame, ranked, type GameState } from "../protocol.js";
import type { GameConfig } from "../types.js";

const T0 = 1_700_000_000_000;

function riggedGame(overrides: Partial<GameConfig> = {}): GameState {
  const config: GameConfig = {
    ...defaultConfig("fixture"),
    rounds: 3,
    questionsPerRound: 4,
    basePoints: 100,
    mischief: "houseRules",
    ...overrides,
  };
  const game = createGame({
    code: "TEST-01",
    hostId: "host",
    hostName: "Host",
    config,
    now: T0,
  });
  joinGame(game, "amy", "Amy", T0);
  joinGame(game, "bo", "Bo", T0);
  joinGame(game, "cy", "Cy", T0);
  return game;
}

/** Set true totals directly; how they were earned is not what's under test. */
function setScores(game: GameState, scores: Record<string, number>): void {
  for (const [id, score] of Object.entries(scores)) {
    const player = game.players[id];
    if (player) player.score = score;
  }
}

describe("house rules", () => {
  it("leaves an unrigged game entirely alone", () => {
    const game = riggedGame({ mischief: "off" });
    setScores(game, { host: 900, amy: 1200, bo: 400 });

    const published = toPublicGame(game);
    expect(published.players.amy?.score).toBe(1200);
    expect(published.players.host?.score).toBe(900);
    expect(published.mischief).toBeUndefined();
  });

  it("publishes a pittance for everyone but the host", () => {
    const game = riggedGame();
    setScores(game, { host: 900, amy: 1200, bo: 400 });

    const players = toPublicGame(game).players;
    expect(players.host?.score).toBe(900);
    expect(players.amy?.score).toBeLessThan(60);
    expect(players.bo?.score).toBeLessThan(60);
  });

  it("shows a flawless round as under twenty", () => {
    const config = { ...defaultConfig("fixture"), basePoints: 100, questionsPerRound: 4 };
    // Everything right, at full speed: base plus the whole speed bonus.
    const perfectRound = config.basePoints * 1.5 * config.questionsPerRound;
    expect(Math.round(perfectRound * houseScale(config))).toBe(HOUSE_PERFECT_ROUND);
    expect(Math.round(perfectRound * houseScale(config))).toBeLessThan(20);
  });

  it("keeps the order of everyone who is not the host", () => {
    const game = riggedGame();
    setScores(game, { host: 50, amy: 1200, bo: 800, cy: 810 });

    const order = ranked(toPublicGame(game).players)
      .map((p) => p.id)
      .filter((id) => id !== "host");
    expect(order).toEqual(["amy", "cy", "bo"]);
  });

  it("never lets a shown total fall as the game goes on", () => {
    // The failure this guards: scaling against the observed leader instead
    // of the config, so a quiet round shrinks your own score.
    const game = riggedGame();
    let previous = 0;
    const run: Array<[number, number]> = [
      [150, 300],
      [160, 1000],
      [160, 4000],
      [900, 4200],
    ];
    for (const [amy, leader] of run) {
      setScores(game, { amy, bo: leader });
      const shown = toPublicGame(game).players.amy?.score ?? 0;
      expect(shown).toBeGreaterThanOrEqual(previous);
      previous = shown;
    }
  });

  it("moves a total by exactly the delta shown beside it", () => {
    const game = riggedGame();
    const amy = game.players.amy;
    if (!amy) throw new Error("no player");
    amy.score = 1200;
    amy.rounds[0] = { answers: {}, openedAt: {}, score: 500, streak: 0, updatedAt: T0 };
    amy.rounds[1] = { answers: {}, openedAt: {}, score: 700, streak: 0, updatedAt: T0 };

    const published = toPublicGame(game).players.amy;
    const deltas = Object.values(published?.rounds ?? {}).reduce((sum, r) => sum + r.score, 0);
    // Rounding can drift by half a point per round and no more.
    expect(Math.abs((published?.score ?? 0) - deltas)).toBeLessThanOrEqual(1);
  });

  it("keeps the receipts honest, which is the tell", () => {
    const game = riggedGame();
    const amy = game.players.amy;
    if (!amy) throw new Error("no player");
    amy.score = 1200;
    amy.rounds[0] = {
      answers: {
        0: { fraction: 1, points: 140, message: "", lines: [], at: T0, elapsedMs: 900 },
      },
      openedAt: {},
      score: 140,
      streak: 1,
      updatedAt: T0,
    };

    const published = toPublicGame(game).players.amy;
    expect(published?.rounds[0]?.answers[0]?.points).toBe(140);
    expect(published?.score).toBeLessThan(60);
  });

  it("hides every true total until the game is over", () => {
    const game = riggedGame();
    setScores(game, { host: 900, amy: 1200, bo: 400 });

    const published = toPublicGame(game);
    // Nobody who has scored is shown what they scored. A player still on
    // zero is published as zero, which is the truth and gives nothing away.
    for (const id of ["amy", "bo"]) {
      expect(published.players[id]?.score).not.toBe(game.players[id]?.score);
    }
    expect(published.players.cy?.score).toBe(0);
    expect(published.mischief).toBeUndefined();
  });

  it("comes clean at final, and hands over what it had claimed", () => {
    const game = riggedGame();
    setScores(game, { host: 900, amy: 1200, bo: 400 });
    game.phase = { name: "final", startedAt: T0 };

    const published = toPublicGame(game);
    expect(published.players.amy?.score).toBe(1200);
    expect(published.players.host?.score).toBe(900);
    expect(published.mischief?.mode).toBe("houseRules");
    expect(published.mischief?.hostId).toBe("host");
    expect(published.mischief?.shown.amy).toBeLessThan(60);
    expect(published.mischief?.shown.host).toBe(900);
  });

  it("gives the win to whoever actually earned it", () => {
    const game = riggedGame();
    // The host looks untouchable all game and finishes third.
    setScores(game, { host: 900, amy: 4000, bo: 3000, cy: 100 });

    const during = ranked(toPublicGame(game).players)[0];
    expect(during?.id).toBe("host");

    game.phase = { name: "final", startedAt: T0 };
    const after = ranked(toPublicGame(game).players)[0];
    expect(after?.id).toBe("amy");
  });

  it("does not touch the host's own score at any point", () => {
    const game = riggedGame();
    setScores(game, { host: 777 });
    expect(shownScore(777, "host", "host", game.config)).toBe(777);
    expect(toPublicGame(game).players.host?.score).toBe(777);
  });
});
