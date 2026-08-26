import { useState } from "react";
import { type PublicGameState } from "@curio/core";

import { Roster, Scene, TimerRing } from "../design/index.js";

interface WaitingProps {
  game: PublicGameState;
  meId: string;
  round: number;
  endsAt: number | null;
  now(): number;
  onClose(): Promise<void>;
  onLeave(): void;
}

/** Round-paced play, after you've finished: who else is in, and how long left. */
export function Waiting({ game, meId, round, endsAt, now, onClose, onLeave }: WaitingProps) {
  const [busy, setBusy] = useState(false);
  const isHost = game.hostId === meId;
  const total = game.rounds[round]?.questions.length ?? 0;

  const players = Object.values(game.players).sort((a, b) => a.joinedAt - b.joinedAt);
  const done = new Set(
    players
      .filter((player) => Object.keys(player.rounds[round]?.answers ?? {}).length >= total)
      .map((player) => player.id),
  );
  const everyone = done.size === players.length;

  const close = async () => {
    setBusy(true);
    try {
      await onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Scene
      id={`waiting-${round}`}
      rail={
        <>
          <span className="eyebrow">Round {round + 1} · you're in</span>
          <span className="row">
            <span className="badge badge--live">Open</span>
            <TimerRing
              endsAt={endsAt}
              totalMs={(game.config.roundOpenMinutes ?? 0) * 60_000 || null}
              now={now}
            />
          </span>
        </>
      }
      dock={
        <>
          {isHost ? (
            <button type="button" className="button state" disabled={busy} onClick={() => void close()}>
              {busy ? "Closing…" : everyone ? "Show the answers" : "Close without them"}
            </button>
          ) : (
            <p className="tiny faint center">
              {game.players[game.hostId]?.name ?? "The host"} closes the round.
            </p>
          )}
          <button type="button" className="button button--quiet state" onClick={onLeave}>
            Leave
          </button>
        </>
      }
    >
      <div className="center stack--tight">
        <h1>{everyone ? "Everyone's in" : `${done.size} of ${players.length} done`}</h1>
        <p className="lede">
          {everyone
            ? "The round closes now."
            : game.config.hideAnswers
              ? "Scores stay sealed until it closes."
              : "Waiting on the stragglers."}
        </p>
      </div>

      <div className="panel stack--tight">
        <span className="eyebrow">Who's played it</span>
        <Roster players={players} meId={meId} doneIds={done} now={now()} />
      </div>
    </Scene>
  );
}
