import {
  advance,
  createGame,
  createRng,
  defaultConfig,
  GameError,
  hostAdvance,
  joinGame,
  removePlayer,
  sanitizeConfig,
  seedFor,
  startGame,
  submitAnswers,
  toPublicGame,
  type EngineContext,
  type GameRequest,
  type GameResponse,
  type GameState,
} from "@curio/core";
import { resolvePack } from "@curio/content";

import type { Subscriber, Transport } from "./transport.js";

/**
 * The same game, with the server removed.
 *
 * Pass-and-play runs the identical engine in the tab: the same phase
 * machine, the same grading, the same wire shapes. Screens cannot tell the
 * difference, which is why local play can't drift away from online play the
 * way two separate implementations would.
 */
export function createLocalTransport(): Transport {
  const games = new Map<string, GameState>();
  const listeners = new Map<string, Set<Subscriber>>();

  const context = (game: GameState, now: number): EngineContext => ({
    pack: resolvePack(game.config.packId),
    rngFor: (round) => createRng(seedFor(game.code, round)),
    now,
  });

  const notify = (game: GameState) => {
    const update = { game: toPublicGame(game), serverNow: Date.now() };
    for (const subscriber of listeners.get(game.code) ?? []) subscriber.onState(update);
  };

  const bump = (game: GameState) => {
    game.version += 1;
    game.updatedAt = Date.now();
  };

  const settle = (game: GameState) => {
    const now = Date.now();
    if (advance(game, context(game, now))) bump(game);
  };

  const find = (code: string): GameState => {
    const game = games.get(code);
    if (!game) throw new GameError("That game is gone.", "not_found");
    return game;
  };

  return {
    kind: "local",

    async send(request: GameRequest): Promise<GameResponse> {
      const now = Date.now();
      try {
        switch (request.op) {
          case "create": {
            const config = sanitizeConfig(request.config, defaultConfig("hogwarts").packId);
            const code = `LOCAL-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
            const game = createGame({
              code,
              hostId: request.hostId,
              hostName: request.hostName,
              config,
              now,
            });
            games.set(code, game);
            return { game: toPublicGame(game), serverNow: now, code };
          }

          case "join": {
            const game = find(request.code);
            joinGame(game, request.playerId, request.playerName, now);
            bump(game);
            notify(game);
            return { game: toPublicGame(game), serverNow: now };
          }

          case "start": {
            const game = find(request.code);
            startGame(game, request.hostId, context(game, now));
            bump(game);
            notify(game);
            return { game: toPublicGame(game), serverNow: now };
          }

          case "advance": {
            const game = find(request.code);
            hostAdvance(game, request.hostId, context(game, now));
            bump(game);
            notify(game);
            return { game: toPublicGame(game), serverNow: now };
          }

          case "submit": {
            const game = find(request.code);
            const outcome = submitAnswers(
              game,
              request.playerId,
              request.round,
              request.answers,
              now,
            );
            bump(game);
            settle(game);
            notify(game);
            return {
              game: toPublicGame(game),
              serverNow: now,
              results: outcome.results,
              roundScore: outcome.roundScore,
              streak: outcome.streak,
            };
          }

          case "leave": {
            const game = find(request.code);
            removePlayer(game, request.playerId);
            bump(game);
            notify(game);
            return { game: toPublicGame(game), serverNow: now };
          }

          case "state": {
            const game = find(request.code);
            settle(game);
            return { game: toPublicGame(game), serverNow: now };
          }

          case "cleanup":
            games.clear();
            return { removed: 0, serverNow: now };

          default:
            return { error: "Unknown op.", code: "bad_request" };
        }
      } catch (error) {
        if (error instanceof GameError) return { error: error.message, code: error.code };
        return { error: error instanceof Error ? error.message : String(error), code: "server_error" };
      }
    },

    subscribe(code, _playerId, subscriber) {
      const set = listeners.get(code) ?? new Set<Subscriber>();
      set.add(subscriber);
      listeners.set(code, set);

      const game = games.get(code);
      if (game) subscriber.onState({ game: toPublicGame(game), serverNow: Date.now() });

      // There is no server to notice a deadline passing, so the tab does it.
      const ticker = window.setInterval(() => {
        const current = games.get(code);
        if (!current) return;
        const before = current.version;
        settle(current);
        if (current.version !== before) notify(current);
      }, 250);

      return () => {
        window.clearInterval(ticker);
        set.delete(subscriber);
        if (set.size === 0) listeners.delete(code);
      };
    },
  };
}
