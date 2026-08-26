import { useState } from "react";
import { getKind, type PublicGameState } from "@curio/core";

import { Board, KindIcon, Scene } from "../design/index.js";

interface RevealProps {
  game: PublicGameState;
  meId: string;
  round: number;
  onNext(): Promise<void>;
  onLeave(): void;
}

/** Every question in the round, its answer, and how you did on it. */
export function Reveal({ game, meId, round, onNext, onLeave }: RevealProps) {
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
    <Scene
      id={`reveal-${round}`}
      flow="top"
      rail={
        <>
          <span className="eyebrow">Round {round + 1} · answers</span>
          <span className="eyebrow num">+{(mine?.score ?? 0).toLocaleString()}</span>
        </>
      }
      dock={
        <>
          {isHost ? (
            <button type="button" className="button" disabled={busy} onClick={() => void next()}>
              {busy ? "Dealing…" : last ? "Final scores" : `Open round ${round + 2}`}
            </button>
          ) : (
            <p className="tiny faint center">
              {game.players[game.hostId]?.name ?? "The host"} opens the next round.
            </p>
          )}
          <button type="button" className="button button--quiet" onClick={onLeave}>
            Leave
          </button>
        </>
      }
    >
      <div className="panel stack--tight">
        <span className="eyebrow">Standings</span>
        <Board players={game.players} meId={meId} round={round} />
      </div>

      <div className="stack--tight stagger">
        {(state?.questions ?? []).map((question, index) => {
          const result = mine?.answers[index];
          const solution = state?.solutions?.[index];
          const kind = getKind(question.kind);
          const outcome = !result
            ? "no answer"
            : result.fraction >= 0.999
              ? `+${result.points}`
              : result.fraction > 0
                ? `part · +${result.points}`
                : "missed";

          return (
            <div className="panel panel--quiet stack--tight" key={`${round}-${index}`}>
              <div className="row--between">
                <span className="eyebrow">
                  <KindIcon icon={kind.icon} size={12} />
                  {kind.name}
                </span>
                <span className={`tiny ${result && result.fraction >= 0.999 ? "" : "faint"}`}>
                  {outcome}
                </span>
              </div>
              <p className="small">{question.prompt}</p>
              {solution ? <p className="lede small">{solution}</p> : null}
            </div>
          );
        })}
      </div>
    </Scene>
  );
}
