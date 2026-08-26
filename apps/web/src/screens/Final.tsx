import { ranked, type PublicGameState } from "@curio/core";

import { Board, Scene } from "../design/index.js";

interface FinalProps {
  game: PublicGameState;
  meId: string;
  onHome(): void;
}

/** Plinth heights and the order they stand in: 2nd, 1st, 3rd. */
const HEIGHTS = [136, 104, 84];
const ARRANGEMENT = [1, 0, 2];

export function Final({ game, meId, onHome }: FinalProps) {
  const order = ranked(game.players);
  const top = order.slice(0, 3);
  const winner = top[0];

  return (
    <Scene
      id="final"
      flow="top"
      rail={<span className="eyebrow">Final</span>}
      dock={
        <button type="button" className="button state" onClick={onHome}>
          Back to the start
        </button>
      }
    >
      <div className="center stack--tight">
        <span className="crown" aria-hidden="true">
          ✦
        </span>
        <h1>{winner ? winner.name : "Nobody"}</h1>
        <p className="lede">
          {winner ? `${winner.score.toLocaleString()} points` : "An empty game."}
        </p>
      </div>

      <div className="podium">
        {ARRANGEMENT.filter((place) => top[place]).map((place) => {
          const player = top[place];
          if (!player) return null;
          return (
            <div
              className="plinth"
              key={player.id}
              data-place={place + 1}
              style={{ height: HEIGHTS[place] }}
            >
              <span className="pip" style={{ color: player.color }} />
              <span className="plinth__name">{player.name}</span>
              <span className="plinth__score num">{player.score.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      <div className="panel stack--tight">
        <span className="eyebrow">Everyone</span>
        <Board players={game.players} meId={meId} markLeader />
      </div>
    </Scene>
  );
}
