import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  hasGame,
  isErrorResponse,
  type GameRequest,
  type GameResponse,
  type PublicGameState,
} from "@candlelight/core";

import type { Transport } from "../net/transport.js";

export interface Session {
  game: PublicGameState | null;
  trouble: string | null;
  /** The server's clock, as best this device can tell. */
  now(): number;
  send(request: GameRequest): Promise<GameResponse>;
}

/**
 * Subscribes to one game and keeps a corrected clock.
 *
 * Every response carries the server's own `serverNow`, and the difference
 * from this device's clock is tracked here. Phase deadlines are server
 * timestamps, so without this correction a phone running a few seconds fast
 * would show a question expiring early.
 */
export function useSession(transport: Transport, code: string | null, playerId: string): Session {
  const [game, setGame] = useState<PublicGameState | null>(null);
  const [trouble, setTrouble] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const now = useCallback(() => Date.now() + offsetRef.current, []);

  const noteClock = useCallback((serverNow: number) => {
    // A single sample is enough: this only has to be right to within the
    // second, and every response refreshes it.
    offsetRef.current = serverNow - Date.now();
  }, []);

  useEffect(() => {
    if (!code) {
      setGame(null);
      return;
    }
    setTrouble(null);

    const unsubscribe = transport.subscribe(code, playerId, {
      onState({ game: next, serverNow }) {
        noteClock(serverNow);
        setGame((current) => (current && current.version > next.version ? current : next));
      },
      onTrouble: setTrouble,
    });

    return unsubscribe;
  }, [transport, code, playerId, noteClock]);

  const send = useCallback(
    async (request: GameRequest): Promise<GameResponse> => {
      const response = await transport.send(request);

      if (isErrorResponse(response)) {
        setTrouble(response.error);
        return response;
      }

      setTrouble(null);
      if (hasGame(response)) {
        noteClock(response.serverNow);
        // Apply immediately rather than waiting for the poll to come back:
        // the player who acted should see the result of their own action now.
        setGame((current) =>
          current && current.version > response.game.version ? current : response.game,
        );
      }
      return response;
    },
    [transport, noteClock],
  );

  return useMemo(() => ({ game, trouble, now, send }), [game, trouble, now, send]);
}
