import { type PublicGameState } from "@curio/core";

import { Board, Scene } from "../design/index.js";

interface StandingsProps {
  game: PublicGameState;
  meId: string;
  round: number;
}

/**
 * The live-play breather between rounds.
 *
 * It advances itself on the phase's own deadline, so there is nothing here
 * for the host to press. The "Skip ahead" button that used to sit in the
 * dock was one more decision during play for a screen that resolves in eight
 * seconds by itself.
 */
export function Standings({ game, meId, round }: StandingsProps) {
  const last = round + 1 >= game.config.rounds;

  return (
    <Scene
      id={`standings-${round}`}
      rail={<span className="eyebrow">End of round {round + 1}</span>}
      dock={
        <p className="tiny faint center">
          {last ? "Final scores coming up…" : `Round ${round + 2} opens in a moment…`}
        </p>
      }
    >
      <div className="center stack--tight">
        <h1>{last ? "That's the lot" : "The current order"}</h1>
      </div>
      <Board players={game.players} meId={meId} round={round} markLeader />
    </Scene>
  );
}
