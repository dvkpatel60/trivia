/**
 * The contract between the browser and `netlify/functions/game`.
 *
 * Both sides import these types, so a change to the wire format is a compile
 * error rather than a runtime surprise. `toPublicGame` is the chokepoint that
 * decides what a player is allowed to know.
 */

import { describeSolution, toPublicQuestion } from "./grade.js";
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
}

/**
 * Strip a stored game down to what players may see: questions lose their
 * solutions, and a round only gains a human-readable answer list once it has
 * been revealed.
 */
export function toPublicGame(game: GameState): PublicGameState {
  const rounds: Record<number, RoundState<AnyPublicQuestion>> = {};

  for (const [key, round] of Object.entries(game.rounds)) {
    rounds[Number(key)] = {
      questions: round.questions.map((q) => toPublicQuestion(q) as AnyPublicQuestion),
      revealed: round.revealed,
      ...(round.revealed ? { solutions: round.questions.map((q) => describeSolution(q)) } : {}),
    };
  }

  return {
    code: game.code,
    hostId: game.hostId,
    phase: game.phase,
    status: gameStatus(game.phase),
    config: game.config,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    players: game.players,
    rounds,
    version: game.version,
  };
}

/* ── requests ─────────────────────────────────────────────────────────── */

export interface SubmittedAnswer {
  answer: unknown;
  /**
   * Client-measured, and therefore a hint rather than a fact. It can only
   * ever *add* a speed bonus, clamped to the round's own time limit — so the
   * most a lying client wins is the bonus for answering instantly.
   * Correctness, the part worth cheating for, is decided server-side.
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
  /** Host override: close the current round / skip the current beat. */
  | { op: "advance"; code: string; hostId: string }
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
