import type { AnswerResult } from "@candlelight/core";

interface VerdictProps {
  result: AnswerResult | undefined;
  /** The correct answer in prose, once the round has revealed it. */
  solution?: string | null;
  /** Live play hides the score until the round ends if the host asked for it. */
  sealed?: boolean;
}

function headline(fraction: number): string {
  if (fraction >= 0.999) return "Right";
  if (fraction > 0) return "Half there";
  return "Not this time";
}

export function Verdict({ result, solution, sealed }: VerdictProps) {
  if (!result) {
    return (
      <div className="verdict">
        <p className="headline muted">No answer</p>
        {solution ? <p className="serif-i">{solution}</p> : null}
      </div>
    );
  }

  const tone = result.fraction >= 0.999 ? "good" : result.fraction > 0 ? "part" : "bad";

  return (
    <div className={`verdict ${tone} fade-in`}>
      <p className="headline">{headline(result.fraction)}</p>
      {result.message ? <p className="serif-i">{result.message}</p> : null}
      {solution ? <p className="tiny muted">{solution}</p> : null}

      {sealed ? (
        <p className="tiny faint">Scores stay sealed until the round closes.</p>
      ) : (
        <div className="score-lines">
          {result.lines.map((line) => (
            <span className="line" key={line.label}>
              <span>{line.label}</span>
              <span>+{line.points}</span>
            </span>
          ))}
          <span className="line" style={{ color: "var(--ink)" }}>
            <span>total</span>
            <span>+{result.points}</span>
          </span>
        </div>
      )}
    </div>
  );
}
