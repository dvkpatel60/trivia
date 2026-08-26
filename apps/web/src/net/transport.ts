import type { GameRequest, GameResponse, PublicGameState } from "@candlelight/core";

export interface StateUpdate {
  game: PublicGameState;
  /** The server's clock at the moment it answered. */
  serverNow: number;
}

export interface Subscriber {
  onState(update: StateUpdate): void;
  /** Called when a poll fails; the transport keeps retrying with backoff. */
  onTrouble(message: string | null): void;
}

/**
 * How the app talks to a game.
 *
 * Everything above this line — screens, puzzle renderers, scoring display —
 * is identical whether the game lives on a server or entirely inside this
 * tab. Adding a hosted realtime provider later means adding a file here, not
 * touching the app.
 */
export interface Transport {
  readonly kind: "remote" | "local";
  send(request: GameRequest): Promise<GameResponse>;
  /** Watch a game. Returns an unsubscribe function. */
  subscribe(code: string, playerId: string | undefined, subscriber: Subscriber): () => void;
}
