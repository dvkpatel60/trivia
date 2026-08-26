import { m } from "motion/react";
import type { AnswerResult } from "@curio/core";

import { Count } from "./Count.js";
import { cascade, pounce, rise } from "./motion.js";

interface VerdictProps {
  result: AnswerResult | undefined;
  /** The right answer in prose, once a round has revealed it. */
  solution?: string | null;
  /** Live play can keep points back until the round closes. */
  sealed?: boolean;
  /** Matches the option the player tapped, so it travels into this card. */
  morphId?: string;
}

function headline(fraction: number): string {
  if (fraction >= 0.999) return "Got it";
  if (fraction > 0) return "Halfway";
  return "Missed";
}

/** The moment after an answer: how you did, and what it was worth. */
export function Verdict({ result, solution, sealed, morphId }: VerdictProps) {
  if (!result) {
    return (
      <div className="verdict" data-tone="none">
        <m.p className="verdict__headline" {...(morphId ? { layoutId: morphId } : {})}>
          No answer
        </m.p>
        {solution ? <p className="lede">{solution}</p> : null}
      </div>
    );
  }

  const tone = result.fraction >= 0.999 ? "good" : result.fraction > 0 ? "part" : "bad";

  return (
    <div className="verdict" data-tone={tone}>
      <m.p
        className="verdict__headline"
        {...(morphId ? { layoutId: morphId } : {})}
        initial={morphId ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={pounce}
      >
        {headline(result.fraction)}
      </m.p>

      {result.message ? <p className="lede">{result.message}</p> : null}
      {solution ? <p className="tiny faint">{solution}</p> : null}

      {sealed ? (
        <p className="tiny faint">Points are sealed until the round closes.</p>
      ) : (
        <m.div className="ledger" variants={cascade(0.07)} initial="hidden" animate="shown">
          {result.lines.map((line) => (
            <m.span className="ledger__line" variants={rise} key={line.label}>
              <span>{line.label}</span>
              <span>+{line.points}</span>
            </m.span>
          ))}
          <m.span className="ledger__line ledger__line--total" variants={rise}>
            <span>total</span>
            <Count value={result.points} />
          </m.span>
        </m.div>
      )}
    </div>
  );
}
