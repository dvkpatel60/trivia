import { ranked, type PublicGameState } from "@candlelight/core";

import { Scoreboard } from "../components/Scoreboard.js";

interface FinalProps {
  game: PublicGameState;
  meId: string;
  onHome(): void;
}

const HEIGHTS = [112, 86, 70];
const PLINTH_ORDER = [1, 0, 2];

export function Final({ game, meId, onHome }: FinalProps) {
  const order = ranked(game.players);
  const top = order.slice(0, 3);
  const winner = top[0];

  return (
    <div className="page fade-in">
      <div className="center stack-s" style={{ paddingTop: "4vh" }}>
        <span className="eyebrow">Final</span>
        <h1>{winner ? winner.name : "Nobody"}</h1>
        <p className="serif-i">
          {winner ? `${winner.score.toLocaleString()} points` : "An empty game."}
        </p>
      </div>

      <div className="podium">
        {PLINTH_ORDER.filter((index) => top[index]).map((index) => {
          const player = top[index];
          if (!player) return null;
          return (
            <div
              className="plinth"
              key={player.id}
              style={{ height: HEIGHTS[index], animationDelay: `${index * 90}ms` }}
            >
              <span className="pip" style={{ color: player.color }} />
              <span className="tiny" style={{ textAlign: "center" }}>
                {player.name}
              </span>
              <span className="num tiny muted">{player.score.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      <div className="card stack-s">
        <span className="eyebrow">Everyone</span>
        <Scoreboard players={game.players} meId={meId} />
      </div>

      <div className="spacer" />

      <button type="button" className="btn" onClick={onHome}>
        Back to the start
      </button>
    </div>
  );
}
