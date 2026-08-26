import { ranked, type PublicGameState } from "@curio/core";

import { Board, PackLeaderIcon, PackVessel, Scene } from "../design/index.js";

interface FinalProps {
  game: PublicGameState;
  meId: string;
  onHome(): void;
}

/** The order they stand in: 2nd, 1st, 3rd. */
const ARRANGEMENT = [1, 0, 2];

/**
 * How tall a plinth can get, and how short it may be.
 *
 * Height is the score, not the rank. The floor exists so that last place is
 * still a thing standing on the podium rather than a sliver, and so a game
 * where nobody scored does not draw three invisible columns.
 */
const TALLEST = 200;
const SHORTEST = 84;

function heightFor(score: number, best: number): number {
  if (best <= 0) return SHORTEST;
  const ratio = Math.max(0, Math.min(1, score / best));
  return Math.round(SHORTEST + ratio * (TALLEST - SHORTEST));
}

export function Final({ game, meId, onHome }: FinalProps) {
  const order = ranked(game.players);
  const top = order.slice(0, 3);
  const winner = top[0];
  const best = winner?.score ?? 0;

  return (
    <Scene
      id="final"
      flow="top"
      rail={<span className="eyebrow">Final</span>}
      dock={
        <button type="button" className="button state" onClick={onHome}>
          Return to the collection
        </button>
      }
    >
      <div className="center stack--tight">
        <span className="crown" aria-hidden="true">
          <PackLeaderIcon size={36} />
        </span>
        <h1>{winner ? winner.name : "Nobody"}</h1>
        <p className="lede">
          {winner ? `${winner.score.toLocaleString()} points` : "The cabinet is empty."}
        </p>
      </div>

      <div className="podium">
        {ARRANGEMENT.filter((place) => top[place]).map((place) => {
          const player = top[place];
          if (!player) return null;
          return (
            <div className="plinth" key={player.id} data-place={place + 1}>
              <span
                className="plinth__vessel"
                style={{ height: heightFor(player.score, best) }}
              >
                <PackVessel lead={place === 0} />
              </span>
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
