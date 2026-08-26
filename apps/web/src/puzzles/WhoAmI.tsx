import { useState } from "react";

import { OptionList } from "../design/index.js";
import type { PuzzleProps } from "./types.js";

/**
 * Clues are rationed. Spent ones shrink and grey out rather than vanishing,
 * so you can see the trail you followed — and what it cost you.
 */
export function WhoAmI({ question, locked, onCommit, morphId }: PuzzleProps<"whoAmI">) {
  const [shown, setShown] = useState(1);
  const clues = question.view.clues;
  const more = shown < clues.length;

  return (
    <div className="stack--loose">
      <div className="clues">
        {clues.slice(0, shown).map((clue, index) => (
          <p key={clue} className="clue" data-spent={index < shown - 1}>
            {clue}
          </p>
        ))}
      </div>

      {more && !locked ? (
        <button
          type="button"
          className="button button--ghost button--inline state"
          style={{ alignSelf: "center" }}
          onClick={() => setShown(shown + 1)}
        >
          Another clue · worth less
        </button>
      ) : null}

      <OptionList
        options={question.view.options}
        locked={locked}
        label="Who am I?"
        morphId={morphId}
        onPick={(choice) => onCommit({ choice, clueIndex: shown - 1 })}
      />
    </div>
  );
}
