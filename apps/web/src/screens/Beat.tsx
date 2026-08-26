import { ranked, type PublicGameState } from "@candlelight/core";

import { Verdict } from "../components/Verdict.js";

interface BeatProps {
  game: PublicGameState;
  meId: string;
  round: number;
  index: number;
}

/**
 * The pause between live questions: what the answer was, how you did, and
 * who got it. Long enough to register, short enough that nobody reaches for
 * their pocket.
 */
export function Beat({ game, meId, round, index }: BeatProps) {
  const result = game.players[meId]?.rounds[round]?.answers[index];
  const players = ranked(game.players);
  const revealed = game.rounds[round]?.revealed ?? false;
  const sealed = game.config.hideAnswers && !revealed;

  return (
    <div className="page fade-in">
      <span className="eyebrow center">Question {index + 1}</span>

      <div className="card">
        <Verdict result={result} sealed={sealed} />
      </div>

      <div className="card stack-s">
        <span className="eyebrow">How everyone did</span>
        {players.map((player) => {
          const theirs = player.rounds[round]?.answers[index];
          const tone = !theirs ? "faint" : theirs.fraction >= 0.999 ? "" : "muted";
          return (
            <div key={player.id} className="player-row">
              <span className="pip" style={{ color: player.color }} />
              <span className="name">
                {player.name}
                {player.id === meId ? " (you)" : ""}
              </span>
              <span className={`state ${tone}`}>
                {!theirs
                  ? "missed it"
                  : theirs.fraction >= 0.999
                    ? "right"
                    : theirs.fraction > 0
                      ? "partly"
                      : "wrong"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="tiny center faint">Next question in a moment…</p>
    </div>
  );
}
