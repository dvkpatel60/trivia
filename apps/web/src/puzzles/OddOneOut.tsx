import { Options } from "./Options.js";
import type { PuzzleProps } from "./types.js";

export function OddOneOut({ question, locked, onCommit }: PuzzleProps<"oddOneOut">) {
  return (
    <div className="stack">
      <p className="prompt">{question.prompt}</p>
      <Options
        options={question.view.options}
        locked={locked}
        onPick={(choice) => onCommit({ choice })}
      />
    </div>
  );
}
