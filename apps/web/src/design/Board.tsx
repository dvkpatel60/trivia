import { ranked, type PlayerState } from "@curio/core";

interface BoardProps {
  players: Record<string, PlayerState>;
  meId: string;
  /** Shows what each player won in this round beside their total. */
  round?: number;
}

/** The standings. The one screen where everyone looks for their own name. */
export function Board({ players, meId, round }: BoardProps) {
  const order = ranked(players);

  return (
    <div className="board">
      {order.map((player, index) => {
        const delta = round == null ? 0 : (player.rounds[round]?.score ?? 0);
        return (
          <div
            key={player.id}
            className="board__row"
            data-me={player.id === meId}
            data-rank={index + 1}
          >
            <span className="board__rank">{index + 1}</span>
            <span className="pip" style={{ color: player.color }} />
            <span className="grow">
              {player.name}
              {delta > 0 ? <span className="board__delta">+{delta.toLocaleString()}</span> : null}
            </span>
            <span className="board__points num">{player.score.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
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
    <div className="stack--tight stagger">
      {players.map((player) => {
        const done = doneIds?.has(player.id) ?? false;
        const away = now != null && now - player.lastSeenAt > AWAY_AFTER_MS;
        return (
          <div key={player.id} className="person" data-done={done} data-away={away}>
            <span className="pip" style={{ color: player.color }} />
            <span className="person__name">
              {player.name}
              {player.id === meId ? " · you" : ""}
            </span>
            {player.streak > 1 ? <span className="streak">{player.streak}×</span> : null}
            <span className="person__state">
              {doneIds ? (done ? "in" : away ? "away" : "thinking") : away ? "away" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
