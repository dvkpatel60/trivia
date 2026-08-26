import { type PublicGameState } from "@candlelight/core";

import { Scoreboard } from "../components/Scoreboard.js";

interface StandingsProps {
  game: PublicGameState;
  meId: string;
  round: number;
  onSkip(): void;
  isHost: boolean;
}

/** The live-play breather between rounds. Advances itself. */
export function Standings({ game, meId, round, onSkip, isHost }: StandingsProps) {
  const last = round + 1 >= game.config.rounds;

  return (
    <div className="page fade-in">
      <div className="center stack-s" style={{ paddingTop: "5vh" }}>
        <span className="eyebrow">End of round {round + 1}</span>
        <h2>{last ? "Last round done" : "How it stands"}</h2>
      </div>

      <div className="card">
        <Scoreboard players={game.players} meId={meId} round={round} />
      </div>

      <div className="spacer" />

      <p className="tiny center faint">
        {last ? "Final scores coming up…" : `Round ${round + 2} starts in a moment…`}
      </p>

      {isHost ? (
        <button type="button" className="btn ghost" onClick={onSkip}>
          Skip ahead
        </button>
      ) : null}
    </div>
  );
}
