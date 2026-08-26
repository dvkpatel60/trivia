import { ranked, type PlayerState } from "@candlelight/core";

interface ScoreboardProps {
  players: Record<string, PlayerState>;
  meId: string;
  /** Points won this round, shown as a delta beside the total. */
  round?: number;
}

export function Scoreboard({ players, meId, round }: ScoreboardProps) {
  const order = ranked(players);

  return (
    <div className="stack-s">
      {order.map((player, index) => {
        const delta = round == null ? 0 : (player.rounds[round]?.score ?? 0);
        return (
          <div key={player.id} className={`score-row${player.id === meId ? " me" : ""}`}>
            <span className="rank">{index + 1}</span>
            <span className="pip" style={{ color: player.color }} />
            <span className="name">
              {player.name}
              {delta > 0 ? <span className="delta"> +{delta.toLocaleString()}</span> : null}
            </span>
            <span className="points">{player.score.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}
