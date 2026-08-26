import { useState } from "react";
import { type PublicGameState } from "@candlelight/core";

import { Players } from "../components/Players.js";
import { Timer } from "../components/Timer.js";

interface WaitingProps {
  game: PublicGameState;
  meId: string;
  round: number;
  endsAt: number | null;
  now(): number;
  onClose(): Promise<void>;
  onLeave(): void;
}

/**
 * Async play, after you've finished the round: who else is in, and how long
 * the round stays open.
 */
export function Waiting({ game, meId, round, endsAt, now, onClose, onLeave }: WaitingProps) {
  const [busy, setBusy] = useState(false);
  const isHost = game.hostId === meId;
  const total = game.rounds[round]?.questions.length ?? 0;

  const players = Object.values(game.players).sort((a, b) => a.joinedAt - b.joinedAt);
  const done = new Set(
    players
      .filter((player) => {
        const answers = player.rounds[round]?.answers ?? {};
        return Object.keys(answers).length >= total;
      })
      .map((player) => player.id),
  );

  const close = async () => {
    setBusy(true);
    try {
      await onClose();
    } finally {
      setBusy(false);
    }
  };

  const everyone = done.size === players.length;

  return (
    <div className="page fade-in">
      <div className="between">
        <span className="eyebrow">Round {round + 1} &middot; your answers are in</span>
        <span className="badge live">Open</span>
      </div>

      <div className="center stack-s" style={{ paddingTop: "4vh" }}>
        <h2>{everyone ? "Everyone's in" : `${done.size} of ${players.length} finished`}</h2>
        <p className="serif-i">
          {everyone
            ? "The round closes now."
            : game.config.hideAnswers
              ? "Scores stay sealed until it closes."
              : "Waiting on the stragglers."}
        </p>
      </div>

      {endsAt != null ? (
        <Timer
          endsAt={endsAt}
          totalMs={(game.config.roundOpenMinutes ?? 0) * 60_000 || null}
          now={now}
        />
      ) : null}

      <div className="card stack-s">
        <span className="eyebrow">Who's played it</span>
        <Players players={players} meId={meId} doneIds={done} now={now()} />
      </div>

      <div className="spacer" />

      {isHost ? (
        <button type="button" className="btn" disabled={busy} onClick={() => void close()}>
          {busy ? "Closing…" : everyone ? "Show the answers" : "Close the round without them"}
        </button>
      ) : (
        <p className="tiny center faint">
          {game.players[game.hostId]?.name ?? "The host"} closes the round.
        </p>
      )}

      <button type="button" className="btn quiet" onClick={onLeave}>
        Leave this game
      </button>
    </div>
  );
}
