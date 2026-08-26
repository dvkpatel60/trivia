import {
  hasGame,
  isErrorResponse,
  isUnchanged,
  type GameRequest,
  type GameResponse,
} from "@candlelight/core";

import type { Subscriber, Transport } from "./transport.js";

const ENDPOINT = "/.netlify/functions/game";

/** Long enough to cover the server's own hold, with room for the round trip. */
const REQUEST_TIMEOUT_MS = 12_000;
/** A held request returns as soon as anything changes; this is just a floor. */
const IDLE_GAP_MS = 400;
const MAX_BACKOFF_MS = 20_000;

async function post(request: GameRequest, signal?: AbortSignal): Promise<GameResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    const body = (await response.json()) as GameResponse;
    return body;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/**
 * Long-polling transport.
 *
 * The server holds each `state` request open until the game moves or its
 * hold expires, so a change reaches every player in well under a second
 * without anyone polling on a timer. A tab in the background stops asking
 * entirely and catches up the moment it is looked at again.
 */
export function createRemoteTransport(): Transport {
  return {
    kind: "remote",

    async send(request) {
      return post(request);
    },

    subscribe(code, playerId, subscriber: Subscriber) {
      const controller = new AbortController();
      let stopped = false;
      let since = 0;
      let failures = 0;
      let wake: (() => void) | null = null;

      const sleep = (ms: number) =>
        new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, ms);
          wake = () => {
            clearTimeout(timer);
            resolve();
          };
        });

      /** Resume immediately when the tab comes back rather than mid-backoff. */
      const onVisible = () => {
        if (!document.hidden) wake?.();
      };
      document.addEventListener("visibilitychange", onVisible);

      const loop = async () => {
        while (!stopped) {
          if (document.hidden) {
            await sleep(1_000);
            continue;
          }

          try {
            const response = await post(
              { op: "state", code, playerId, since, wait: true },
              controller.signal,
            );

            if (stopped) return;

            if (isErrorResponse(response)) {
              subscriber.onTrouble(response.error);
              failures += 1;
            } else if (isUnchanged(response)) {
              // Nothing happened during the hold. Straight back in.
              since = response.version;
              failures = 0;
              subscriber.onTrouble(null);
            } else if (hasGame(response)) {
              since = response.game.version;
              failures = 0;
              subscriber.onTrouble(null);
              subscriber.onState({ game: response.game, serverNow: response.serverNow });
            }
          } catch (error) {
            if (stopped) return;
            failures += 1;
            subscriber.onTrouble(
              error instanceof Error && error.name === "AbortError"
                ? "Connection timed out."
                : "Can't reach the game.",
            );
          }

          // Exponential backoff with jitter, so a flapping network doesn't
          // turn every client into a synchronised retry storm.
          const backoff =
            failures === 0
              ? IDLE_GAP_MS
              : Math.min(MAX_BACKOFF_MS, 2 ** failures * 500) * (0.7 + Math.random() * 0.6);
          await sleep(backoff);
        }
      };

      void loop();

      return () => {
        stopped = true;
        wake?.();
        controller.abort();
        document.removeEventListener("visibilitychange", onVisible);
      };
    },
  };
}
