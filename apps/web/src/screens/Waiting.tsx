import { useState } from "react";
import { getKind, questionDurationMs, type PublicGameState } from "@curio/core";

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
  const questions = game.rounds[round]?.questions ?? [];

  /**
   * Settled, not merely answered.
   *
   * A question whose own window has run out counts as done even though
   * nothing was written for it — which is exactly the rule the engine closes
   * the round on, so this list agrees with what actually happens rather than
   * showing somebody as outstanding forever.
   */
  const settled = (playerId: string): boolean => {
    const record = game.players[playerId]?.rounds[round];
    for (let index = 0; index < total; index++) {
      if (record?.answers[index]) continue;
      const openedAt = record?.openedAt?.[index];
      const question = questions[index];
      if (openedAt == null || !question || !game.config.timerOn) return false;
      const window = questionDurationMs(game.config, getKind(question.kind).timeMultiplier);
      if (now() < openedAt + window) return false;
    }
    return true;
  };

  const done = new Set(players.filter((player) => settled(player.id)).map((player) => player.id));
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
              {busy ? "Closing…" : everyone ? "Unseal the answers" : "Close the round early"}
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
              ? "Sealed until the round closes."
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
