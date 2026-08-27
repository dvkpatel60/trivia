import { beforeEach, describe, expect, it } from "vitest";

import { fake } from "./store.mts";
import handler from "../functions/game.mts";
import type {
  AnyPublicQuestion,
  Envelope,
  GameRequest,
  PublicGameState,
  SubmitResponse,
} from "@curio/core";

/** Call the function the way Netlify would. */
async function call<T>(body: GameRequest): Promise<T> {
  const response = await handler(
    new Request("https://example.test/.netlify/functions/game", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return (await response.json()) as T;
}

const CONFIG = {
  packId: "atlas",
  rounds: 2,
  questionsPerRound: 2,
  timerOn: true,
  seconds: 30,
  themedRounds: true,
};

async function openGame(pacing: "live" | "async") {
  const created = await call<Envelope & { code: string }>({
    op: "create",
    hostId: "host",
    hostName: "Host",
    config: { ...CONFIG, pacing },
  });
  await call<Envelope>({
    op: "join",
    code: created.code,
    playerId: "ana",
    playerName: "Ana",
  });
  return created.code;
}

const state = (code: string) => call<Envelope>({ op: "state", code });

/** The correct answer, worked out from the stored (not published) question. */
function solveFromStore(code: string, round: number, index: number): unknown {
  const main = JSON.parse(fake.raw.get(`g/${code}`) ?? "{}");
  const question = main.rounds[round].questions[index];
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
      return {
        pairs: question.view.left.map((l: string) => [l, question.solution.truth[l]]),
      };
    case "categorize":
      return { assignments: question.solution.truth };
    case "sequence":
      return {
        order: question.view.items
          .map((_: unknown, i: number) => i)
          .sort(
            (a: number, b: number) =>
              question.solution.positions[a] - question.solution.positions[b],
          ),
      };
    default:
      return null;
  }
}

const answer = (code: string, playerId: string, round: number, index: number) =>
  call<SubmitResponse>({
    op: "submit",
    code,
    playerId,
    round,
    answers: { [index]: { answer: solveFromStore(code, round, index), elapsedMs: 200 } },
  });

beforeEach(() => {
  fake.reset();
});

async function revealAllQuestions(code: string, round: number, total: number) {
  for (let i = 0; i < total; i++) {
    await call<Envelope>({ op: "revealQuestion", code, hostId: "host", round, index: i });
  }
}

const QUESTIONS_PER_ROUND = 2;

describe("the endpoint", () => {
  it("refuses anything but POST", async () => {
    const response = await handler(new Request("https://example.test/x", { method: "GET" }));
    expect(response.status).toBe(405);
  });

  it("rejects a body that isn't JSON", async () => {
    const response = await handler(
      new Request("https://example.test/x", { method: "POST", body: "not json" }),
    );
    expect(response.status).toBe(400);
  });

  it("answers a missing game with 404 and a machine-readable code", async () => {
    const response = await handler(
      new Request("https://example.test/x", {
        method: "POST",
        body: JSON.stringify({ op: "state", code: "NOPE-01" }),
      }),
    );
    expect(response.status).toBe(404);
    expect(((await response.json()) as { code: string }).code).toBe("not_found");
  });

  it("clamps a config a crafted request tried to inflate", async () => {
    const created = await call<Envelope & { code: string }>({
      op: "create",
      hostId: "host",
      hostName: "Host",
      config: { rounds: 9_999, basePoints: 1e9, seconds: -1 } as never,
    });
    expect(created.game.config.rounds).toBeLessThanOrEqual(10);
    expect(created.game.config.basePoints).toBeLessThanOrEqual(500);
    expect(created.game.config.seconds).toBeGreaterThanOrEqual(10);
  });
});

describe("storage layout", () => {
  it("keeps each player's answers under their own key", async () => {
    const code = await openGame("async");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    await revealAllQuestions(code, 0, QUESTIONS_PER_ROUND);
    await answer(code, "ana", 0, 0);

    expect(fake.keys()).toContain(`g/${code}`);
    expect(fake.keys()).toContain(`g/${code}/p/ana`);
    expect(fake.keys()).toContain(`g/${code}/p/host`);
  });

  it("does not write another player's key when one of them answers", async () => {
    const code = await openGame("async");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    await revealAllQuestions(code, 0, QUESTIONS_PER_ROUND);

    const before = fake.raw.get(`g/${code}/p/host`);
    await answer(code, "ana", 0, 0);
    expect(fake.raw.get(`g/${code}/p/host`)).toBe(before);
  });

  it("does not write another player's key when one of them opens a question", async () => {
    const code = await openGame("async");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    await revealAllQuestions(code, 0, QUESTIONS_PER_ROUND);

    const before = fake.raw.get(`g/${code}/p/host`);
    await call<Envelope>({ op: "begin", code, playerId: "ana", round: 0, index: 0 });
    // Opening a question is a write, so it has to obey the same rule every
    // other write here does: only the player's own key is touched.
    expect(fake.raw.get(`g/${code}/p/host`)).toBe(before);
    expect(fake.keys()).toContain(`g/${code}/p/ana`);
  });

  it("survives two players answering at the same instant", async () => {
    const code = await openGame("live");
    await call<Envelope>({ op: "start", code, hostId: "host" });

    // The race a single shared blob would lose: both read, both write.
    await Promise.all([answer(code, "host", 0, 0), answer(code, "ana", 0, 0)]);

    const after = await state(code);
    expect(after.game.players.host?.rounds[0]?.answers[0]).toBeDefined();
    expect(after.game.players.ana?.rounds[0]?.answers[0]).toBeDefined();
    expect(after.game.players.host?.score).toBeGreaterThan(0);
    expect(after.game.players.ana?.score).toBeGreaterThan(0);
  });

  it("moves the version on when anyone changes anything", async () => {
    const code = await openGame("async");
    const before = (await state(code)).game.version;
    await call<Envelope>({ op: "start", code, hostId: "host" });
    await revealAllQuestions(code, 0, QUESTIONS_PER_ROUND);
    await answer(code, "ana", 0, 0);
    expect((await state(code)).game.version).toBeGreaterThan(before);
  });
});

describe("what crosses the wire", () => {
  it("never includes a solution, mid-round or after", async () => {
    const code = await openGame("async");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    await revealAllQuestions(code, 0, QUESTIONS_PER_ROUND);

    const during = JSON.stringify(await state(code));
    expect(during).not.toContain('"solution"');
    expect(during).not.toContain('"correct"');

    await answer(code, "host", 0, 0);
    await answer(code, "host", 0, 1);
    await answer(code, "ana", 0, 0);
    await answer(code, "ana", 0, 1);

    const after = await state(code);
    expect(JSON.stringify(after)).not.toContain('"solution"');
    expect(after.game.rounds[0]?.solutions?.length).toBe(2);
  });

  it("carries the server clock so clients can correct drift", async () => {
    const code = await openGame("live");
    const response = await state(code);
    expect(response.serverNow).toBeGreaterThan(0);
    expect(Math.abs(response.serverNow - Date.now())).toBeLessThan(5_000);
  });
});

describe("live pacing over the wire", () => {
  it("starts everyone on question one with a shared deadline", async () => {
    const code = await openGame("live");
    const started = await call<Envelope>({ op: "start", code, hostId: "host" });

    expect(started.game.phase.name).toBe("question");
    if (started.game.phase.name !== "question") throw new Error("phase");
    expect(started.game.phase.index).toBe(0);
    expect(started.game.phase.endsAt).toBeGreaterThan(started.serverNow);
  });

  it("closes the question once everyone has answered", async () => {
    const code = await openGame("live");
    await call<Envelope>({ op: "start", code, hostId: "host" });

    await answer(code, "host", 0, 0);
    expect((await state(code)).game.phase.name).toBe("question");

    const last = await answer(code, "ana", 0, 0);
    expect(last.game.phase.name).toBe("beat");
  });

  it("refuses an answer to a question that is not the live one", async () => {
    const code = await openGame("live");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    const jumped = await answer(code, "ana", 0, 1);
    expect(jumped.results[1]).toBeUndefined();
  });

  it("lets the host skip ahead", async () => {
    const code = await openGame("live");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    const skipped = await call<Envelope>({ op: "advance", code, hostId: "host" });
    expect(skipped.game.phase.name).toBe("beat");
  });

  it("refuses a skip from a player", async () => {
    const code = await openGame("live");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    const refused = await call<{ code: string }>({ op: "advance", code, hostId: "ana" });
    expect(refused.code).toBe("forbidden");
  });
});

describe("async pacing over the wire", () => {
  it("opens a round players can finish in one request", async () => {
    const code = await openGame("async");
    const started = await call<Envelope>({ op: "start", code, hostId: "host" });
    expect(started.game.phase.name).toBe("open");
    await revealAllQuestions(code, 0, QUESTIONS_PER_ROUND);

    const submitted = await call<SubmitResponse>({
      op: "submit",
      code,
      playerId: "ana",
      round: 0,
      answers: {
        0: { answer: solveFromStore(code, 0, 0), elapsedMs: 900 },
        1: { answer: solveFromStore(code, 0, 1), elapsedMs: 900 },
      },
    });
    expect(Object.keys(submitted.results).length).toBe(2);
    expect(submitted.roundScore).toBeGreaterThan(0);
  });

  it("stamps a player's own window when they open a question", async () => {
    const code = await openGame("async");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    await revealAllQuestions(code, 0, QUESTIONS_PER_ROUND);

    const opened = await call<Envelope>({
      op: "begin",
      code,
      playerId: "ana",
      round: 0,
      index: 0,
    });
    const stamp = opened.game.players.ana?.rounds[0]?.openedAt?.[0];
    expect(stamp).toBeTypeOf("number");

    // A second open is not a fresh window — a reload must not buy more time.
    const again = await call<Envelope>({
      op: "begin",
      code,
      playerId: "ana",
      round: 0,
      index: 0,
    });
    expect(again.game.players.ana?.rounds[0]?.openedAt?.[0]).toBe(stamp);
  });

  it("closes the round when the last player finishes", async () => {
    const code = await openGame("async");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    await revealAllQuestions(code, 0, QUESTIONS_PER_ROUND);

    for (const player of ["host", "ana"]) {
      await call<SubmitResponse>({
        op: "submit",
        code,
        playerId: player,
        round: 0,
        answers: {
          0: { answer: solveFromStore(code, 0, 0), elapsedMs: 500 },
          1: { answer: solveFromStore(code, 0, 1), elapsedMs: 500 },
        },
      });
    }

    expect((await state(code)).game.phase.name).toBe("reveal");
  });

  it("runs to the end when the host keeps advancing", async () => {
    const code = await openGame("async");
    await call<Envelope>({ op: "start", code, hostId: "host" });

    for (let guard = 0; guard < 12; guard++) {
      const current = (await state(code)).game;
      if (current.phase.name === "final") break;
      await call<Envelope>({ op: "advance", code, hostId: "host" });
    }

    expect((await state(code)).game.phase.name).toBe("final");
  });
});

describe("idempotency", () => {
  it("does not double-score a retried submission", async () => {
    const code = await openGame("async");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    await revealAllQuestions(code, 0, QUESTIONS_PER_ROUND);

    const first = await answer(code, "ana", 0, 0);
    const second = await answer(code, "ana", 0, 0);

    expect(second.results[0]).toEqual(first.results[0]);
    expect(second.game.players.ana?.score).toBe(first.game.players.ana?.score);
  });
});

describe("rejoining", () => {
  it("keeps a player's score when they rejoin from a new tab", async () => {
    const code = await openGame("async");
    await call<Envelope>({ op: "start", code, hostId: "host" });
    await revealAllQuestions(code, 0, QUESTIONS_PER_ROUND);
    await answer(code, "ana", 0, 0);
    const scored = (await state(code)).game.players.ana?.score ?? 0;

    const rejoined = await call<Envelope>({
      op: "join",
      code,
      playerId: "ana",
      playerName: "Ana on her phone",
    });

    expect(rejoined.game.players.ana?.score).toBe(scored);
    expect(rejoined.game.players.ana?.name).toBe("Ana on her phone");
  });
});

describe("long polling", () => {
  it("returns immediately when the caller is behind", async () => {
    const code = await openGame("async");
    const answered = await call<Envelope | { unchanged: true }>({
      op: "state",
      code,
      since: 0,
      wait: true,
    });
    expect("game" in answered).toBe(true);
  });

  it("holds and then reports nothing new when the caller is current", async () => {
    const code = await openGame("async");
    const current = (await state(code)).game.version;

    const started = Date.now();
    const held = await call<{ unchanged?: true; version?: number }>({
      op: "state",
      code,
      since: current,
      wait: true,
    });
    const waited = Date.now() - started;

    expect(held.unchanged).toBe(true);
    expect(waited).toBeGreaterThan(500);
    // Well inside Netlify's 10s function timeout.
    expect(waited).toBeLessThan(9_000);
  }, 15_000);
});

describe("questions are dealt deterministically", () => {
  it("gives the same code and round the same questions", async () => {
    const first = await openGame("async");
    await call<Envelope>({ op: "start", code: first, hostId: "host" });
    const prompts = (await state(first)).game.rounds[0]?.questions.map(
      (q: AnyPublicQuestion) => q.prompt,
    );

    // Replay the same code from scratch.
    const main = JSON.parse(fake.raw.get(`g/${first}`) ?? "{}") as PublicGameState;
    fake.reset();

    const replay = await call<Envelope & { code: string }>({
      op: "create",
      hostId: "host",
      hostName: "Host",
      config: main.config,
    });
    // Force the same code so the seed matches.
    const record = JSON.parse(fake.raw.get(`g/${replay.code}`) ?? "{}");
    record.code = first;
    fake.raw.set(`g/${first}`, JSON.stringify(record));
    fake.raw.set(`g/${first}/p/host`, fake.raw.get(`g/${replay.code}/p/host`) ?? "{}");

    await call<Envelope>({ op: "start", code: first, hostId: "host" });
    const replayed = (await state(first)).game.rounds[0]?.questions.map(
      (q: AnyPublicQuestion) => q.prompt,
    );

    expect(replayed).toEqual(prompts);
  });
});

describe("cleanup", () => {
  it("leaves a game that is still being played", async () => {
    const code = await openGame("async");
    const result = await call<{ removed: number }>({ op: "cleanup" });
    expect(result.removed).toBe(0);
    expect(fake.keys()).toContain(`g/${code}`);
  });
});
