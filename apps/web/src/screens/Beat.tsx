import { ranked, type PublicGameState } from "@curio/core";

import { Scene, Verdict } from "../design/index.js";

interface BeatProps {
  game: PublicGameState;
  meId: string;
  round: number;
  index: number;
}

/**
 * The pause between live questions: what it was, how you did, who got it.
 * Long enough to register, short enough that nobody reaches for their pocket.
 */
export function Beat({ game, meId, round, index }: BeatProps) {
  const result = game.players[meId]?.rounds[round]?.answers[index];
  const players = ranked(game.players);
  const revealed = game.rounds[round]?.revealed ?? false;
  const sealed = game.config.hideAnswers && !revealed;

  return (
    <Scene
      id={`beat-${round}-${index}`}
      rail={<span className="eyebrow">Question {index + 1}</span>}
      dock={<p className="tiny faint center">The next question approaches…</p>}
    >
      <Verdict result={result} sealed={sealed} morphId={`answer-${round}-${index}`} />

      <div className="stack--tight stagger">
        {players.map((player) => {
          const theirs = player.rounds[round]?.answers[index];
          const outcome = !theirs
            ? "missed"
            : theirs.fraction >= 0.999
              ? "right"
              : theirs.fraction > 0
                ? "partly"
                : "wrong";
          return (
            <div
              key={player.id}
              className="person"
              data-done={theirs != null && theirs.fraction >= 0.999}
            >
              <span className="pip" style={{ color: player.color }} />
              <span className="person__name">
                {player.name}
                {player.id === meId ? " · you" : ""}
              </span>
              <span className="person__state">{outcome}</span>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}
