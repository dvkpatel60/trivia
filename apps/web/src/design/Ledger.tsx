import type { AnswerResult } from "@curio/core";

interface VerdictProps {
  result: AnswerResult | undefined;
  /** The right answer in prose, once a round has revealed it. */
  solution?: string | null;
  /** Live play can keep points back until the round closes. */
  sealed?: boolean;
}

function headline(fraction: number): string {
  if (fraction >= 0.999) return "Got it";
  if (fraction > 0) return "Halfway";
  return "Missed";
}

/** The moment after an answer: how you did, and what it was worth. */
export function Verdict({ result, solution, sealed }: VerdictProps) {
  if (!result) {
    return (
      <div className="verdict" data-tone="none">
        <p className="verdict__headline">No answer</p>
        {solution ? <p className="lede">{solution}</p> : null}
      </div>
    );
  }

  const tone = result.fraction >= 0.999 ? "good" : result.fraction > 0 ? "part" : "bad";

  return (
    <div className="verdict" data-tone={tone}>
      <p className="verdict__headline">{headline(result.fraction)}</p>
      {result.message ? <p className="lede">{result.message}</p> : null}
      {solution ? <p className="tiny faint">{solution}</p> : null}

      {sealed ? (
        <p className="tiny faint">Points are sealed until the round closes.</p>
      ) : (
        <div className="ledger">
          {result.lines.map((line) => (
            <span className="ledger__line" key={line.label}>
              <span>{line.label}</span>
              <span>+{line.points}</span>
            </span>
          ))}
          <span className="ledger__line ledger__line--total">
            <span>total</span>
            <span>+{result.points.toLocaleString()}</span>
          </span>
        </div>
      )}
    </div>
  );
}
