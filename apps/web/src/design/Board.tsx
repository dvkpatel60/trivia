import { AnimatePresence, m } from "motion/react";
import { leaderOf, ranked, type PlayerState } from "@curio/core";

import { Count } from "./Count.js";
import { rise, cascade, settle } from "./motion.js";
import { PackLeaderIcon } from "./PackArtifacts.js";
import { ScoreBurst } from "./ScoreBurst.js";

interface BoardProps {
  players: Record<string, PlayerState>;
  meId: string;
  /** Shows what each player won in this round beside their total. */
  round?: number;
  /**
   * Marks whoever is ahead and pulses their row.
   *
   * Set when a round has just closed — that is the moment the standing
   * matters, and the moment worth making somebody look up for.
   */
  markLeader?: boolean;
}

/**
 * The standings.
 *
 * Rows carry `layout`, so when someone overtakes someone else the rows
 * physically swap rather than re-rendering in a new order. Watching yourself
 * climb is most of the emotional payload of a trivia game, and it was the
 * single biggest thing the old static list threw away.
 */
export function Board({ players, meId, round, markLeader }: BoardProps) {
  const order = ranked(players);
  const leaderId = markLeader === true ? leaderOf(players) : null;

  return (
    <m.div className="board" variants={cascade()} initial="hidden" animate="shown">
      <AnimatePresence initial={false}>
        {order.map((player, index) => {
          const delta = round == null ? 0 : (player.rounds[round]?.score ?? 0);
          const leader = player.id === leaderId;
          return (
            <m.div
              key={player.id}
              layout
              layoutId={`score-${player.id}`}
              variants={rise}
              transition={settle}
              exit={{ opacity: 0, scale: 0.96 }}
              className="board__row state"
              data-me={player.id === meId}
              data-rank={index + 1}
              data-leader={leader}
            >
              <m.span layout="position" className="board__rank">
                {index + 1}
              </m.span>
              <span className="pip" style={{ color: player.color }} />
              <span className="grow">
                {leader ? (
                  <span className="board__crown" aria-label="Leading">
                    <PackLeaderIcon size={15} />
                  </span>
                ) : null}
                {player.name}
                {delta > 0 ? (
                  <m.span
                    className="board__delta"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    +{delta.toLocaleString()}
                  </m.span>
                ) : null}
              </span>
              <span className="board__points num">
                <Count value={player.score} />
                <ScoreBurst active={delta > 0} />
              </span>
            </m.div>
          );
        })}
      </AnimatePresence>
    </m.div>
  );
}

interface RosterProps {
  players: PlayerState[];
  meId: string;
  /** Who has finished whatever we're waiting on. */
  doneIds?: Set<string>;
  now?: number;
  empty?: string;
}

const AWAY_AFTER_MS = 45_000;

/** Who is here, and what they're doing. */
export function Roster({ players, meId, doneIds, now, empty }: RosterProps) {
  if (players.length === 0) {
    return <p className="lede center">{empty ?? "Nobody here yet."}</p>;
  }

  return (
    <m.div className="stack--tight" variants={cascade()} initial="hidden" animate="shown">
      <AnimatePresence initial={false}>
        {players.map((player) => {
          const done = doneIds?.has(player.id) ?? false;
          const away = now != null && now - player.lastSeenAt > AWAY_AFTER_MS;
          return (
            <m.div
              key={player.id}
              layout
              variants={rise}
              exit={{ opacity: 0, x: -12 }}
              transition={settle}
              className="person"
              data-done={done}
              data-away={away}
            >
              <span className="pip" style={{ color: player.color }} />
              <span className="person__name">
                {player.name}
                {player.id === meId ? " · you" : ""}
              </span>
              {player.streak > 1 ? <span className="streak">{player.streak}×</span> : null}
              <span className="person__state">
                {doneIds ? (done ? "in" : away ? "away" : "thinking") : away ? "away" : ""}
              </span>
            </m.div>
          );
        })}
      </AnimatePresence>
    </m.div>
  );
}
