/**
 * Every legal change to a game, as pure-ish functions over `GameState`.
 *
 * The Netlify function is deliberately thin: read the blob, call one of
 * these, write it back under compare-and-swap. All the rules — who may do
 * what, when a phase ends, what an answer is worth — live here, where they
 * can be tested without a network or a blob store.
 */

import { getKind } from "./kinds/index.js";
import { gradeQuestion } from "./grade.js";
import { buildRound, type KindUsage } from "./round.js";
import { scoreAnswer } from "./scoring.js";
import {
  BEAT_MS,
  questionDurationMs,
  STANDINGS_MS,
  SUBMIT_GRACE_MS,
  type Phase,
} from "./phase.js";
import { PLAYER_COLORS, type AnswerResult, type GameState, type PlayerRound, type PlayerState, type SubmittedAnswer } from "./protocol.js";
import type { Rng } from "./rng.js";
import type { AnyQuestion, ContentPack, GameConfig } from "./types.js";

export interface EngineContext {
  pack: ContentPack;
  /**
   * A generator for one round's deal.
   *
   * A factory rather than a single `Rng` because advancing can cascade
   * through several rounds in one call — a game nobody polled for a while
   * catching up — and each round has to be dealt from its own seed for two
   * servers to agree on the questions.
   */
  rngFor(round: number): Rng;
  now: number;
}

/**
 * Pacings where the round, not the question, is the unit everyone shares.
 *
 * Pass-and-play belongs here with async: one device works through a whole
 * round per player, so there is no shared per-question deadline to hold
 * anyone to.
 */
function isRoundPaced(pacing: GameConfig["pacing"]): boolean {
  return pacing === "async" || pacing === "local";
}

export class GameError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "forbidden" | "bad_request" | "conflict" = "bad_request",
  ) {
    super(message);
    this.name = "GameError";
  }
}

/* ── construction ─────────────────────────────────────────────────────── */

function newPlayer(id: string, name: string, index: number, now: number): PlayerState {
  return {
    id,
    name: name.trim() || `Player ${index + 1}`,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length] as string,
    joinedAt: now,
    lastSeenAt: now,
    score: 0,
    streak: 0,
    rounds: {},
  };
}

export function createGame(options: {
  code: string;
  hostId: string;
  hostName: string;
  config: GameConfig;
  now: number;
}): GameState {
  const { code, hostId, hostName, config, now } = options;
  return {
    code,
    hostId,
    phase: { name: "lobby", startedAt: now },
    config,
    createdAt: now,
    updatedAt: now,
    version: 1,
    players: { [hostId]: newPlayer(hostId, hostName, 0, now) },
    rounds: {},
    usage: {},
  };
}

export function joinGame(game: GameState, playerId: string, playerName: string, now: number): void {
  if (game.phase.name === "final") {
    throw new GameError("That game has already finished.", "conflict");
  }
  const existing = game.players[playerId];
  if (existing) {
    // Re-joining from a refreshed tab: keep the score, take the new name.
    if (playerName.trim()) existing.name = playerName.trim();
    existing.lastSeenAt = now;
    return;
  }
  game.players[playerId] = newPlayer(playerId, playerName, Object.keys(game.players).length, now);
}

export function touchPlayer(game: GameState, playerId: string | undefined, now: number): boolean {
  if (!playerId) return false;
  const player = game.players[playerId];
  if (!player) return false;
  // Only counts as a change worth a version bump if it's been a while, or
  // every poll would wake every other client.
  const stale = now - player.lastSeenAt > 15_000;
  player.lastSeenAt = now;
  return stale;
}

export function removePlayer(game: GameState, playerId: string): void {
  if (playerId === game.hostId) return; // the host leaving would orphan the game
  delete game.players[playerId];
}

/* ── rounds ───────────────────────────────────────────────────────────── */

function dealRound(game: GameState, round: number, ctx: EngineContext): void {
  if (game.rounds[round]) return;
  const built = buildRound({
    pack: ctx.pack,
    config: game.config,
    roundIndex: round,
    rng: ctx.rngFor(round),
    usage: game.usage as KindUsage,
  });
  game.usage = built.usage as Record<string, number[]>;
  game.rounds[round] = { questions: built.questions, revealed: false, revealedQuestions: [] };
}

export function questionCount(game: GameState, round: number): number {
  return game.rounds[round]?.questions.length ?? 0;
}

function questionAt(game: GameState, round: number, index: number): AnyQuestion | undefined {
  return game.rounds[round]?.questions[index];
}

/** How long a given live question is allowed, scaled by its kind. */
function windowMs(game: GameState, round: number, index: number): number | null {
  if (!game.config.timerOn) return null;
  const question = questionAt(game, round, index);
  const multiplier = question ? getKind(question.kind).timeMultiplier : 1;
  return questionDurationMs(game.config, multiplier);
}

function liveQuestionPhase(game: GameState, round: number, index: number, from: number): Phase {
  const window = windowMs(game, round, index);
  return {
    name: "question",
    round,
    index,
    startedAt: from,
    endsAt: window == null ? null : from + window,
  };
}

function asyncOpenPhase(game: GameState, round: number, from: number): Phase {
  const minutes = game.config.roundOpenMinutes;
  return {
    name: "open",
    round,
    startedAt: from,
    endsAt: minutes == null ? null : from + minutes * 60_000,
  };
}

/**
 * Close a round and put its answers on the table.
 *
 * Note what this does *not* do: it does not write a zero into every player
 * who missed a question. An unanswered question in a revealed round already
 * means "no answer" — worth no points and breaking the streak — and deriving
 * that at read time is what lets each player's record stay written by that
 * player alone. See `storage` in the Netlify function for why that matters.
 */
function revealRound(game: GameState, round: number): void {
  const state = game.rounds[round];
  if (!state || state.revealed) return;
  state.revealed = true;
  // Ensure all questions are marked as revealed when the round closes.
  state.revealedQuestions = state.questions.map((_, i) => i);
}

/**
 * Mark every question in a round as revealed, without closing the round.
 *
 * Used by tests that need all questions playable, and by hosts who want to
 * skip per-question gating.
 */
export function revealAllQuestions(game: GameState, round: number): void {
  const state = game.rounds[round];
  if (!state) return;
  state.revealedQuestions = state.questions.map((_, i) => i);
}

/**
 * The streak a player carries into a given question, reconstructed from
 * their own answers.
 *
 * Derived rather than stored because a missed question has to break a streak,
 * and nobody but the player themselves may write their record — so there is
 * no moment at which someone else could reach in and zero the counter.
 */
export function streakBefore(
  game: GameState,
  player: PlayerState,
  round: number,
  index: number,
): number {
  let streak = 0;
  for (let r = 0; r <= round; r++) {
    const state = game.rounds[r];
    if (!state) continue;
    const answers = player.rounds[r]?.answers ?? {};
    const last = r === round ? index : state.questions.length;
    for (let i = 0; i < last; i++) {
      const answer = answers[i];
      if (answer) {
        streak = answer.fraction >= 0.999 ? streak + 1 : 0;
      } else if (state.revealedQuestions?.includes(i)) {
        // They never answered and this question was revealed: streak broken.
        streak = 0;
      }
      // Unanswered in a round still open (async, out of order) is not yet a miss.
    }
  }
  return streak;
}

function ensureRound(player: PlayerState, round: number, now: number): PlayerRound {
  const existing = player.rounds[round];
  if (existing) return existing;
  const fresh: PlayerRound = {
    answers: {},
    openedAt: {},
    score: 0,
    streak: player.streak,
    updatedAt: now,
  };
  player.rounds[round] = fresh;
  return fresh;
}

/* ── starting ─────────────────────────────────────────────────────────── */

export function startGame(game: GameState, hostId: string, ctx: EngineContext): void {
  if (hostId !== game.hostId) throw new GameError("Only the host can start.", "forbidden");
  if (game.phase.name !== "lobby") throw new GameError("Already started.", "conflict");
  if (Object.keys(game.players).length === 0) throw new GameError("Nobody has joined.", "conflict");

  dealRound(game, 0, ctx);
  game.phase = isRoundPaced(game.config.pacing)
    ? asyncOpenPhase(game, 0, ctx.now)
    : liveQuestionPhase(game, 0, 0, ctx.now);
}

/* ── answering ────────────────────────────────────────────────────────── */

export interface SubmitOutcome {
  results: Record<number, AnswerResult>;
  roundScore: number;
  streak: number;
}

/**
 * Which question indices this player may answer right now.
 *
 * Live play is one question at a time on a shared clock, with a short grace
 * window so a slow connection doesn't eat an answer. Async play accepts any
 * index in the open round.
 */
function acceptsIndex(game: GameState, round: number, index: number, now: number): boolean {
  const phase = game.phase;
  if (game.rounds[round]?.revealed) return false;

  if (isRoundPaced(game.config.pacing)) {
    // Per-question reveal: only revealed questions accept answers in async play.
    // Local play doesn't use per-question reveal.
    if (game.config.pacing === "async") {
      const revealed = game.rounds[round]?.revealedQuestions ?? [];
      if (!revealed.includes(index)) return false;
    }
    return phase.name === "open" && phase.round === round;
  }

  if (phase.name === "question") {
    if (phase.round !== round || phase.index !== index) return false;
    return phase.endsAt == null || now <= phase.endsAt + SUBMIT_GRACE_MS;
  }
  // The question just closed; an answer already in flight still lands.
  if (phase.name === "beat") {
    return phase.round === round && phase.index === index && now <= phase.startedAt + SUBMIT_GRACE_MS;
  }
  return false;
}

export function submitAnswers(
  game: GameState,
  playerId: string,
  round: number,
  answers: Record<number, SubmittedAnswer>,
  now: number,
): SubmitOutcome {
  const player = game.players[playerId];
  if (!player) throw new GameError("You are not in this game.", "not_found");
  const state = game.rounds[round];
  if (!state) throw new GameError("That round hasn't started.", "not_found");

  const playerRound = ensureRound(player, round, now);
  let gained = 0;
  let streak = 0;
  let streakKnown = false;

  const indices = Object.keys(answers)
    .map(Number)
    .filter((index) => Number.isInteger(index) && index >= 0 && index < state.questions.length)
    .sort((a, b) => a - b);

  for (const index of indices) {
    // Already graded: a retry, a double-tap, a duplicated request. Returning
    // the stored result is what makes submission idempotent without tokens.
    if (playerRound.answers[index]) continue;
    if (!acceptsIndex(game, round, index, now)) continue;

    const question = state.questions[index];
    const submitted = answers[index];
    if (!question || !submitted) continue;

    if (!streakKnown) {
      streak = streakBefore(game, player, round, index);
      streakKnown = true;
    }

    const { fraction, message } = gradeQuestion(question, submitted.answer);

    const limitMs = windowMs(game, round, index) ?? game.config.seconds * 1000;

    /**
     * How long they took.
     *
     * Both pacings measure it themselves rather than believing the client.
     *
     * Live play reads the phase's own `startedAt` — including for an answer
     * landing in the grace window after the deadline, where the question has
     * by definition run its full length. Round-paced play has no shared
     * clock, but it does have this player's own `openedAt` stamp, which is
     * the same measurement anchored per player.
     *
     * The client's number survives only as the fallback for a round-paced
     * answer to a question that was never opened, and even then it can only
     * add a bonus clamped to the window.
     */
    const phase = game.phase;
    let elapsedMs: number | null;
    if (game.config.pacing === "live") {
      elapsedMs =
        phase.name === "question" && phase.round === round && phase.index === index
          ? now - phase.startedAt
          : limitMs;
    } else {
      const openedAt = playerRound.openedAt[index];
      elapsedMs = openedAt == null ? submitted.elapsedMs : now - openedAt;
    }

    /**
     * Past their own window, the answer lands but scores nothing.
     *
     * It is still recorded rather than dropped: a stored zero is what tells
     * the player they were too slow, where a dropped answer would leave the
     * question looking untouched and the round unable to settle.
     */
    const tooLate = lapsed(game, player, round, index, now);

    const scored = tooLate
      ? { total: 0, streak: 0, lines: [{ label: "too slow", points: 0 }] }
      : scoreAnswer(game.config, fraction, elapsedMs, streak, limitMs);
    streak = scored.streak;
    gained += scored.total;

    playerRound.answers[index] = {
      fraction,
      points: scored.total,
      message,
      lines: scored.lines,
      at: now,
      elapsedMs,
    };
  }

  playerRound.score += gained;
  playerRound.updatedAt = now;
  player.score += gained;
  player.lastSeenAt = now;
  if (streakKnown) {
    playerRound.streak = streak;
    player.streak = streak;
  }

  return { results: playerRound.answers, roundScore: playerRound.score, streak: player.streak };
}

/* ── the phase machine ────────────────────────────────────────────────── */

/** Players who were already here when the current phase began. */
function presentPlayers(game: GameState, since: number): PlayerState[] {
  return Object.values(game.players).filter((player) => player.joinedAt <= since);
}

function everyoneAnswered(game: GameState, round: number, index: number, since: number): boolean {
  const players = presentPlayers(game, since);
  if (players.length === 0) return false;
  return players.every((player) => player.rounds[round]?.answers[index]);
}

/**
 * Has this player's own window for a question run out?
 *
 * Only a question they actually opened can lapse. One they never looked at
 * has no stamp and no deadline — which is deliberate: round-paced play is
 * "whenever you get to it", so nothing may start a clock on a player's
 * behalf. The backstop for a player who walks away without opening the rest
 * is the round's own `roundOpenMinutes` deadline, or the host closing it.
 */
function lapsed(game: GameState, player: PlayerState, round: number, index: number, now: number) {
  const openedAt = player.rounds[round]?.openedAt?.[index];
  if (openedAt == null) return false;
  const window = windowMs(game, round, index);
  if (window == null) return false;
  return now >= openedAt + window + SUBMIT_GRACE_MS;
}

/**
 * Everyone has either answered every question or let their window run out.
 *
 * A lapsed question counts as settled without anything being written into
 * that player's record — an unanswered question in a revealed round already
 * means "no answer". That is what lets a player who abandons a round
 * mid-way stop holding everybody else up.
 */
function everyoneFinishedRound(game: GameState, round: number, now: number): boolean {
  const players = Object.values(game.players);
  if (players.length === 0) return false;
  const total = questionCount(game, round);
  if (total === 0) return false;
  // Local play doesn't use per-question reveal — check every question.
  // Async play only checks revealed questions; unrevealed ones are not yet in play.
  const checkIndices = isRoundPaced(game.config.pacing) && game.config.pacing !== "local"
    ? (game.rounds[round]?.revealedQuestions ?? [])
    : Array.from({ length: total }, (_, i) => i);
  if (checkIndices.length === 0) return false;
  return players.every((player) => {
    const answers = player.rounds[round]?.answers ?? {};
    for (const index of checkIndices) {
      if (!answers[index] && !lapsed(game, player, round, index, now)) return false;
    }
    return true;
  });
}

/**
 * Open a question's window for one player.
 *
 * First stamp wins, so a reload — or a second device — returns the window
 * already running rather than a fresh one. Returns the deadline, or null
 * when the game is untimed.
 */
export function beginQuestion(
  game: GameState,
  playerId: string,
  round: number,
  index: number,
  now: number,
): number | null {
  const player = game.players[playerId];
  if (!player) throw new GameError("You are not in this game.", "forbidden");
  // Local play doesn't use the begin stamp — the timer is managed differently.
  if (game.config.pacing === "local") return null;
  if (!isRoundPaced(game.config.pacing)) {
    throw new GameError("Live play uses a shared clock.", "conflict");
  }
  if (game.phase.name !== "open" || game.phase.round !== round) {
    throw new GameError("That round is not open.", "conflict");
  }
  if (index < 0 || index >= questionCount(game, round)) {
    throw new GameError("No such question.", "conflict");
  }

  // Per-question reveal: can only begin a revealed question.
  const revealed = game.rounds[round]?.revealedQuestions ?? [];
  if (!revealed.includes(index)) {
    throw new GameError("That question hasn't been revealed yet.", "conflict");
  }

  const record = ensureRound(player, round, now);
  record.openedAt[index] ??= now;
  record.updatedAt = now;

  const window = windowMs(game, round, index);
  const openedAt = record.openedAt[index];
  return window == null || openedAt == null ? null : openedAt + window;
}

/**
 * Host reveals a single question in an async round.
 *
 * Adds the index to `revealedQuestions`. Returns true when every question
 * in the round has now been revealed — the caller should then close the
 * round to show all solutions.
 */
export function hostRevealQuestion(
  game: GameState,
  hostId: string,
  round: number,
  index: number,
): boolean {
  if (hostId !== game.hostId) throw new GameError("Only the host can do that.", "forbidden");
  if (game.phase.name !== "open" || game.phase.round !== round) {
    throw new GameError("That round is not open.", "conflict");
  }
  if (game.rounds[round]?.revealed) {
    throw new GameError("That round is already closed.", "conflict");
  }

  const state = game.rounds[round];
  if (!state) throw new GameError("That round hasn't started.", "conflict");

  if (index < 0 || index >= state.questions.length) {
    throw new GameError("No such question.", "conflict");
  }

  if (!state.revealedQuestions.includes(index)) {
    state.revealedQuestions.push(index);
  }

  return state.revealedQuestions.length >= state.questions.length;
}

/** One transition, or null if this phase isn't finished yet. */
function step(game: GameState, ctx: EngineContext, force: boolean): Phase | null {
  const phase = game.phase;
  const { now } = ctx;
  const due = "endsAt" in phase && phase.endsAt != null && now >= phase.endsAt;

  /**
   * When a deadline passed while nobody was looking, the next phase is
   * anchored to that deadline rather than to now — so a game nobody polled
   * for a minute fast-forwards correctly instead of crawling one step per
   * request.
   */
  const anchor = due && "endsAt" in phase && phase.endsAt != null ? phase.endsAt : now;

  switch (phase.name) {
    case "lobby":
      return null; // the host starts the game

    case "question": {
      const early = everyoneAnswered(game, phase.round, phase.index, phase.startedAt);
      if (!force && !due && !early) return null;
      const from = early && !due ? now : anchor;
      return { name: "beat", round: phase.round, index: phase.index, startedAt: from, endsAt: from + BEAT_MS };
    }

    case "beat": {
      if (!force && !due) return null;
      const next = phase.index + 1;
      if (next < questionCount(game, phase.round)) {
        return liveQuestionPhase(game, phase.round, next, anchor);
      }
      revealRound(game, phase.round);
      return { name: "standings", round: phase.round, startedAt: anchor, endsAt: anchor + STANDINGS_MS };
    }

    case "standings": {
      if (!force && !due) return null;
      const next = phase.round + 1;
      if (next >= game.config.rounds) return { name: "final", startedAt: anchor };
      dealRound(game, next, ctx);
      return liveQuestionPhase(game, next, 0, anchor);
    }

    case "open": {
      const allIn = everyoneFinishedRound(game, phase.round, now);
      if (!force && !due && !allIn) return null;
      const from = allIn && !due ? now : anchor;
      revealRound(game, phase.round);
      return { name: "reveal", round: phase.round, startedAt: from };
    }

    case "reveal": {
      // Async reveal waits for the host; there is no clock on reading answers.
      if (!force) return null;
      const next = phase.round + 1;
      if (next >= game.config.rounds) return { name: "final", startedAt: now };
      dealRound(game, next, ctx);
      return asyncOpenPhase(game, next, now);
    }

    case "final":
      return null;
  }
}

/**
 * Drive the machine as far as it will go. Returns true if anything moved.
 *
 * `force` applies to the first step only — a host tapping "skip" advances one
 * phase, then normal deadline rules resume.
 */
export function advance(game: GameState, ctx: EngineContext, force = false): boolean {
  let changed = false;
  let allowForce = force;

  // Bounded so a game left alone for a week can't spin here forever.
  for (let guard = 0; guard < 64; guard++) {
    const next = step(game, ctx, allowForce);
    if (!next) break;
    game.phase = next;
    changed = true;
    allowForce = false;
  }
  return changed;
}

export function hostAdvance(game: GameState, hostId: string, ctx: EngineContext): boolean {
  if (hostId !== game.hostId) throw new GameError("Only the host can do that.", "forbidden");
  if (game.phase.name === "lobby") throw new GameError("Start the game first.", "conflict");
  return advance(game, ctx, true);
}
