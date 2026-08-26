import { useState } from "react";

import { Options } from "./Options.js";
import type { PuzzleProps } from "./types.js";

/**
 * Clues are rationed: the player asks for the next one, and the engine pays
 * less the more they took. The clue count travels with the answer so the
 * server can price it.
 */
export function WhoAmI({ question, locked, onCommit }: PuzzleProps<"whoAmI">) {
  const [shown, setShown] = useState(1);
  const clues = question.view.clues;
  const canReveal = shown < clues.length;

  return (
    <div className="stack">
      <div className="stack-s">
        {clues.slice(0, shown).map((clue, index) => (
          <p key={clue} className={index === shown - 1 ? "prompt fade-in" : "prompt muted"}>
            &ldquo;{clue}&rdquo;
          </p>
        ))}
      </div>

      {canReveal && !locked ? (
        <button type="button" className="btn ghost small" onClick={() => setShown(shown + 1)}>
          Another clue &mdash; worth less
        </button>
      ) : null}

      <Options
        options={question.view.options}
        locked={locked}
        onPick={(choice) => onCommit({ choice, clueIndex: shown - 1 })}
      />
    </div>
  );
}
