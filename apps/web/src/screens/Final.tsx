import { useEffect, useState } from "react";
import { m } from "motion/react";
import { ranked, type MischiefReveal, type PlayerState, type PublicGameState } from "@curio/core";

import { Board, PackLeaderIcon, PackVessel, Scene, rise, settle } from "../design/index.js";

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

/** How long the fiction stays up before the truth lands. */
const RUG_PULL_MS = 2_600;

function heightFor(score: number, best: number): number {
  if (best <= 0) return SHORTEST;
  const ratio = Math.max(0, Math.min(1, score / best));
  return Math.round(SHORTEST + ratio * (TALLEST - SHORTEST));
}

/** The table as it stood a moment ago, before the server came clean. */
function asTold(
  players: Record<string, PlayerState>,
  reveal: MischiefReveal,
): Record<string, PlayerState> {
  const told: Record<string, PlayerState> = {};
  for (const [id, player] of Object.entries(players)) {
    told[id] = { ...player, score: reveal.shown[id] ?? player.score };
  }
  return told;
}

export function Final({ game, meId, onHome }: FinalProps) {
  const reveal = game.mischief;
  /*
   * Hold the lie up for a beat before correcting it.
   *
   * The Board's rows carry `layoutId`, so swapping the scores under it makes
   * them physically overtake each other rather than re-render in a new
   * order, and `Count` walks each total from the fiction to the fact. The
   * whole rug pull is two renders and no bespoke animation.
   */
  const [told, setTold] = useState(reveal != null);

  useEffect(() => {
    if (reveal == null) return;
    const timer = setTimeout(() => setTold(false), RUG_PULL_MS);
    return () => clearTimeout(timer);
  }, [reveal]);

  const players = told && reveal ? asTold(game.players, reveal) : game.players;
  const order = ranked(players);
  const top = order.slice(0, 3);
  const winner = top[0];
  const best = winner?.score ?? 0;

  return (
    <Scene
      id="final"
      flow="top"
      rail={<span className="eyebrow">{told ? "Final · unofficial" : "Final"}</span>}
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

      {told ? null : (
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
      )}

      <div className="panel stack--tight">
        <span className="eyebrow">Everyone</span>
        <Board players={players} meId={meId} markLeader />
      </div>

      {reveal && !told ? <Confession game={game} reveal={reveal} meId={meId} /> : null}
    </Scene>
  );
}

/**
 * What the table had been told, item by item.
 *
 * Worth showing in full rather than as a one-line apology: the gap between
 * the two numbers is the entire joke, and the host — whose own score never
 * moved — should be visible as the one person it was never applied to.
 */
function Confession({
  game,
  reveal,
  meId,
}: {
  game: PublicGameState;
  reveal: MischiefReveal;
  meId: string;
}) {
  const rows = ranked(game.players);
  const worst = rows.reduce((most, player) => {
    const gap = player.score - (reveal.shown[player.id] ?? player.score);
    return gap > most.gap ? { name: player.name, gap } : most;
  }, { name: "", gap: 0 });

  return (
    <m.div className="panel stack--tight" variants={rise} initial="hidden" animate="shown" transition={settle}>
      <span className="eyebrow">House rules were on</span>
      <p className="tiny faint">
        The scoreboard was rigged all evening. Every answer was scored properly — only the
        standings lied, and never about the host.
      </p>
      {rows.map((player) => {
        const shown = reveal.shown[player.id] ?? player.score;
        const host = player.id === reveal.hostId;
        return (
          <div className="person" key={player.id} data-me={player.id === meId}>
            <span className="pip" style={{ color: player.color }} />
            <span className="person__name">
              {player.name}
              {host ? " · the house" : ""}
            </span>
            <span className="person__state num">
              {host ? "told you the truth" : `told ${shown.toLocaleString()}`}
            </span>
            <span className="streak num">{player.score.toLocaleString()}</span>
          </div>
        );
      })}
      {worst.gap > 0 ? (
        <p className="tiny faint">
          Biggest lie of the night: {worst.name}, short-changed by{" "}
          {worst.gap.toLocaleString()} points.
        </p>
      ) : null}
    </m.div>
  );
}
