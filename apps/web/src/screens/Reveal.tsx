import { useState } from "react";
import { getKind, type PublicGameState } from "@candlelight/core";

import { KindIcon } from "../components/KindIcon.js";
import { Scoreboard } from "../components/Scoreboard.js";

interface RevealProps {
  game: PublicGameState;
  meId: string;
  round: number;
  /** Live play moves on by itself; async waits for the host. */
  hostDriven: boolean;
  onNext(): Promise<void>;
  onLeave(): void;
}

/** Every question in the round, its answer, and how you did on it. */
export function Reveal({ game, meId, round, hostDriven, onNext, onLeave }: RevealProps) {
  const [busy, setBusy] = useState(false);
  const state = game.rounds[round];
  const mine = game.players[meId]?.rounds[round];
  const isHost = game.hostId === meId;
  const last = round + 1 >= game.config.rounds;

  const next = async () => {
    setBusy(true);
    try {
      await onNext();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page fade-in">
      <div className="between">
        <span className="eyebrow">Round {round + 1} &middot; answers</span>
        <span className="eyebrow num">+{(mine?.score ?? 0).toLocaleString()}</span>
      </div>

      <div className="card stack-s">
        <span className="eyebrow">Standings</span>
        <Scoreboard players={game.players} meId={meId} round={round} />
      </div>

      <div className="stack-s">
        {(state?.questions ?? []).map((question, index) => {
          const result = mine?.answers[index];
          const solution = state?.solutions?.[index];
          const kind = getKind(question.kind);
          const tone = !result ? "faint" : result.fraction >= 0.999 ? "" : "muted";

          return (
            <div className="card stack-s" key={`${round}-${index}`}>
              <div className="between">
                <span className="eyebrow row" style={{ gap: 6 }}>
                  <KindIcon icon={kind.icon} size={13} />
                  {kind.name}
                </span>
                <span className={`tiny ${tone}`}>
                  {!result
                    ? "no answer"
                    : result.fraction >= 0.999
                      ? `+${result.points}`
                      : result.fraction > 0
                        ? `part credit +${result.points}`
                        : "missed"}
                </span>
              </div>
              <p>{question.prompt}</p>
              {solution ? <p className="serif-i">{solution}</p> : null}
            </div>
          );
        })}
      </div>

      <div className="spacer" />

      {hostDriven ? (
        isHost ? (
          <button type="button" className="btn" disabled={busy} onClick={() => void next()}>
            {busy ? "Dealing…" : last ? "Finish the game" : `Open round ${round + 2}`}
          </button>
        ) : (
          <p className="tiny center faint">
            {game.players[game.hostId]?.name ?? "The host"} opens the next round.
          </p>
        )
      ) : (
        <p className="tiny center faint">Next round starts in a moment…</p>
      )}

      <button type="button" className="btn quiet" onClick={onLeave}>
        Leave this game
      </button>
    </div>
  );
}
