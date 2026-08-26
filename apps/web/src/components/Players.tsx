import type { PlayerState } from "@candlelight/core";

interface PlayersProps {
  players: PlayerState[];
  meId: string;
  /** Who has finished whatever we're waiting on. */
  doneIds?: Set<string>;
  /** Server clock, for deciding who has gone quiet. */
  now?: number;
  emptyLabel?: string;
}

const AWAY_AFTER_MS = 45_000;

export function Players({ players, meId, doneIds, now, emptyLabel }: PlayersProps) {
  if (players.length === 0) {
    return <p className="serif-i center">{emptyLabel ?? "Nobody here yet."}</p>;
  }

  return (
    <div className="stack-s">
      {players.map((player) => {
        const done = doneIds?.has(player.id) ?? false;
        const away = now != null && now - player.lastSeenAt > AWAY_AFTER_MS;
        return (
          <div key={player.id} className={`player-row${done ? " done" : ""}`}>
            <span className="pip" style={{ color: player.color }} />
            <span className={`name${away ? " away" : ""}`}>
              {player.name}
              {player.id === meId ? " (you)" : ""}
            </span>
            {doneIds ? (
              <span className="state">{done ? "in" : away ? "away" : "thinking"}</span>
            ) : (
              <span className="state">{away ? "away" : ""}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
