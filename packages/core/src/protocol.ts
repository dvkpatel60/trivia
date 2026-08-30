/**
 * The contract between the browser and `netlify/functions/game`.
 *
 * Both sides import these types, so a change to the wire format is a compile
 * error rather than a runtime surprise. `toPublicGame` is the chokepoint that
 * decides what a player is allowed to know.
 */

import { describeSolution, toPublicQuestion } from "./grade.js";
import { isRigged, shownScore, type MischiefReveal } from "./mischief.js";
import type { Phase } from "./phase.js";
import { gameStatus, type GameStatus } from "./phase.js";
import type { AnyPublicQuestion, AnyQuestion, GameConfig } from "./types.js";
import type { ScoreLine } from "./scoring.js";

export interface AnswerResult {
  fraction: number;
  points: number;
  message: string;
  lines: ScoreLine[];
  /** When the server graded it. */
  at: number;
  /**
   * How long the answer took, by the same measure the speed bonus used.
   *
   * In live play that is the server's own reading; in round-paced play it is
   * the client's claim, and null when the client sent none. It is a player's
   * own record, so publishing it leaks nothing about anybody else's answer.
   */
  elapsedMs: number | null;
}

export interface PlayerRound {
  /**
   * Graded answers by question index — sparse, because a live player answers
   * one at a time and may never answer some at all.
   *
   * This shape is why submissions need no idempotency token: a retry names
   * the same (player, round, index) and the server sees the index is already
   * graded, so it returns the existing result instead of scoring twice.
   */
  answers: Record<number, AnswerResult>;
  /**
   * When this player first opened each question, by the server's clock.
   *
   * Round-paced play has no shared deadline — everyone reaches a question at
   * their own moment — so the window has to be anchored per player. The
   * stamp is first-write-wins, which is what stops a reload buying a fresh
   * window, and it lives in the player's own record, so nobody else writes
   * it. Empty in live play, where the phase already carries the deadline.
   */
  openedAt: Record<number, number>;
  score: number;
  streak: number;
  updatedAt: number;
}

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
  /** Refreshed on every poll; drives the "who's here" list. */
  lastSeenAt: number;
  score: number;
  streak: number;
  rounds: Record<number, PlayerRound>;
}

export interface RoundState<Q> {
  questions: Q[];
  revealed: boolean;
  /** Per-question reveal: which indices have been shown to players. */
  revealedQuestions: number[];
  /** Plain-language answers. Only ever populated once `revealed` is true. */
  solutions?: string[];
}

/** What the server stores. Contains solutions; never send this to a client. */
export interface GameState {
  code: string;
  hostId: string;
  phase: Phase;
  config: GameConfig;
  createdAt: number;
  updatedAt: number;
  players: Record<string, PlayerState>;
  rounds: Record<number, RoundState<AnyQuestion>>;
  /** Item indices already spent, per kind, so rounds don't repeat questions. */
  usage: Record<string, number[]>;
  /**
   * What the deal is drawn from. Random per game, and never shown to anyone.
   *
   * Rounds used to be seeded from the game code, which made the deal a pure
   * function of a name drawn from 18 words and two digits: 1,620 possible
   * games, and codes are freed as soon as a game is swept, so the same code
   * came round again and replayed the same questions in the same order. The
   * seed is part of the stored state, so two requests racing to advance a
   * round still compute the same deal — which is the property the code was
   * there to provide.
   *
   * Optional because a game created before this existed has none; those fall
   * back to the code and carry on dealing exactly as they did.
   */
  seed?: number;
  /** Bumped on every write. Clients poll with `since` and get nothing back
   *  until this moves, which is what makes long-polling cheap. */
  version: number;
}

/** What a player receives. */
export interface PublicGameState {
  code: string;
  hostId: string;
  phase: Phase;
  status: GameStatus;
  config: GameConfig;
  createdAt: number;
  updatedAt: number;
  players: Record<string, PlayerState>;
  rounds: Record<number, RoundState<AnyPublicQuestion>>;
  version: number;
  /**
   * Present only once the game is over and only when the standings were
   * rigged: what the table had been told, so the last screen can animate
   * from the fiction to the fact. Before `final` this is absent and
   * `players` carries the fiction instead.
   */
  mischief?: MischiefReveal;
}

/**
 * Strip a stored game down to what players may see: questions lose their
 * solutions, and a round only gains a human-readable answer list once it has
 * been revealed.
 *
 * It is also where the standings are rigged, when a host has asked for that.
 * A true score is a secret with the same shape as a solution — the server
 * holds it, publishes a projection of it while the game runs, and hands over
 * the real thing at the end — so it belongs at the same chokepoint rather
 * than in a screen. Screens cannot tell the transports apart, which is what
 * stops pass-and-play telling the truth while online play lies.
 */
export function toPublicGame(game: GameState): PublicGameState {
  const rounds: Record<number, RoundState<AnyPublicQuestion>> = {};

  for (const [key, round] of Object.entries(game.rounds)) {
    rounds[Number(key)] = {
      questions: round.questions.map((q) => toPublicQuestion(q) as AnyPublicQuestion),
      revealed: round.revealed,
      revealedQuestions: round.revealedQuestions ?? [],
      ...(round.revealed ? { solutions: round.questions.map((q) => describeSolution(q)) } : {}),
    };
  }

  const over = game.phase.name === "final";
  const rigged = isRigged(game.config);

  return {
    code: game.code,
    hostId: game.hostId,
    phase: game.phase,
    status: gameStatus(game.phase),
    config: game.config,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    players: rigged && !over ? riggedPlayers(game) : game.players,
    rounds,
    version: game.version,
    ...(rigged && over ? { mischief: mischiefReveal(game) } : {}),
  };
}

/**
 * Every published total, projected — the running score and the per-round
 * delta both, because the standings row shows them side by side and a total
 * that moves by something other than its own delta is a bug on screen.
 *
 * The per-answer receipts under `answers` are deliberately left alone.
 */
function riggedPlayers(game: GameState): Record<string, PlayerState> {
  const players: Record<string, PlayerState> = {};

  for (const [id, player] of Object.entries(game.players)) {
    const project = (score: number) => shownScore(score, id, game.hostId, game.config);
    const playerRounds: Record<number, PlayerRound> = {};
    for (const [key, round] of Object.entries(player.rounds)) {
      playerRounds[Number(key)] = { ...round, score: project(round.score) };
    }
    players[id] = { ...player, score: project(player.score), rounds: playerRounds };
  }

  return players;
}

/** What the table was looking at, one moment before the truth landed. */
function mischiefReveal(game: GameState): MischiefReveal {
  const shown: Record<string, number> = {};
  for (const [id, player] of Object.entries(game.players)) {
    shown[id] = shownScore(player.score, id, game.hostId, game.config);
  }
  return { mode: game.config.mischief, shown, hostId: game.hostId };
}

/* ── requests ─────────────────────────────────────────────────────────── */

export interface SubmittedAnswer {
  answer: unknown;
  /**
   * Client-measured, and only ever a fallback.
   *
   * Both pacings now measure server-side where they can: live play from the
   * phase's own `startedAt`, round-paced play from the player's `openedAt`
   * stamp. This is used only when a round-paced answer arrives for a
   * question that was never opened — and even then it can only *add* a
   * bonus clamped to the window. Correctness is always decided server-side.
   */
  elapsedMs: number | null;
}

export type GameRequest =
  | { op: "create"; hostId: string; hostName: string; config: Partial<GameConfig> }
  | { op: "join"; code: string; playerId: string; playerName: string }
  | { op: "start"; code: string; hostId: string }
  /** `since` + `wait` turn this into a long poll: the function holds the
   *  request open until `version` passes `since`, or it times out. */
  | { op: "state"; code: string; playerId?: string; since?: number; wait?: boolean }
  /** Answers keyed by question index. Live sends one; async sends the round. */
  | {
      op: "submit";
      code: string;
      playerId: string;
      round: number;
      answers: Record<number, SubmittedAnswer>;
    }
  /**
   * Round-paced play: this player is looking at question `index` now.
   *
   * Starts their own window for it. Idempotent — the first stamp wins, so
   * calling it again on a reload returns the original deadline rather than
   * granting a fresh one.
   */
  | { op: "begin"; code: string; playerId: string; round: number; index: number }
  /** Host override: close the current round / skip the current beat. */
  | { op: "advance"; code: string; hostId: string }
  /** Host: reveal a single question in an async round. */
  | { op: "revealQuestion"; code: string; hostId: string; round: number; index: number }
  | { op: "leave"; code: string; playerId: string }
  | { op: "cleanup" };

export type GameOp = GameRequest["op"];

/* ── responses ────────────────────────────────────────────────────────── */

export interface Envelope {
  game: PublicGameState;
  /** Server clock, so clients can correct drift instead of trusting their own. */
  serverNow: number;
}

export interface CreateResponse extends Envelope {
  code: string;
}

export interface SubmitResponse extends Envelope {
  results: Record<number, AnswerResult>;
  roundScore: number;
  streak: number;
}

/** Long poll timed out with nothing new. Costs one small response. */
export interface UnchangedResponse {
  unchanged: true;
  version: number;
  serverNow: number;
}

export interface CleanupResponse {
  removed: number;
  serverNow: number;
}

export interface ErrorResponse {
  error: string;
  code: "not_found" | "forbidden" | "bad_request" | "conflict" | "server_error";
}

export type GameResponse =
  | Envelope
  | CreateResponse
  | SubmitResponse
  | UnchangedResponse
  | CleanupResponse
  | ErrorResponse;

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return typeof value === "object" && value !== null && "error" in value;
}

export function isUnchanged(value: unknown): value is UnchangedResponse {
  return typeof value === "object" && value !== null && "unchanged" in value;
}

export function hasGame(value: unknown): value is Envelope {
  return typeof value === "object" && value !== null && "game" in value;
}

/** Ranking used by every scoreboard in the app. */
export function ranked(players: Record<string, PlayerState>): PlayerState[] {
  return Object.values(players).sort(
    (a, b) => b.score - a.score || a.joinedAt - b.joinedAt || a.id.localeCompare(b.id),
  );
}

/**
 * Who is actually ahead, or null.
 *
 * Null covers the two cases where crowning somebody would be a lie: nobody
 * has scored yet, and the top two are level. The ranking has to break a tie
 * somehow to render a list, but that is an ordering decision — it does not
 * make the first row a leader.
 */
export function leaderOf(players: Record<string, PlayerState>): string | null {
  const order = ranked(players);
  const first = order[0];
  if (!first || first.score <= 0) return null;
  const second = order[1];
  if (second && second.score >= first.score) return null;
  return first.id;
}

export const PLAYER_COLORS = [
  "#e8b55c",
  "#3f9c7d",
  "#8878d6",
  "#c2543a",
  "#4fa3c7",
  "#c98bb0",
  "#9bb04f",
  "#d78a4a",
] as const;
