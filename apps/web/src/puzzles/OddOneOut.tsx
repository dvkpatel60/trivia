import { OptionList } from "../design/index.js";
import type { PuzzleProps } from "./types.js";

export function OddOneOut({ question, locked, onCommit, morphId }: PuzzleProps<"oddOneOut">) {
  return (
    <div className="stack--loose">
      <p className="prompt">{question.prompt}</p>
      <OptionList
        options={question.view.options}
        locked={locked}
        label={question.prompt}
        morphId={morphId}
        onPick={(choice) => onCommit({ choice })}
      />
    </div>
  );
}
