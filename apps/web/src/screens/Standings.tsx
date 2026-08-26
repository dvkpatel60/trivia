import { type PublicGameState } from "@curio/core";

import { Board, Scene } from "../design/index.js";

interface StandingsProps {
  game: PublicGameState;
  meId: string;
  round: number;
  isHost: boolean;
  onSkip(): void;
}

/** The live-play breather between rounds. Advances itself. */
export function Standings({ game, meId, round, isHost, onSkip }: StandingsProps) {
  const last = round + 1 >= game.config.rounds;

  return (
    <Scene
      id={`standings-${round}`}
      rail={<span className="eyebrow">End of round {round + 1}</span>}
      dock={
        <>
          <p className="tiny faint center">
            {last ? "Final scores coming up…" : `Round ${round + 2} starts in a moment…`}
          </p>
          {isHost ? (
            <button type="button" className="button button--ghost state" onClick={onSkip}>
              Skip ahead
            </button>
          ) : null}
        </>
      }
    >
      <div className="center stack--tight">
        <h1>{last ? "That's the lot" : "How it stands"}</h1>
      </div>
      <Board players={game.players} meId={meId} round={round} />
    </Scene>
  );
}
