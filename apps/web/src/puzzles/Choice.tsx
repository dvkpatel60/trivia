import { OptionList } from "../design/index.js";
import type { PuzzleProps } from "./types.js";

export function Choice({ question, locked, onCommit }: PuzzleProps<"choice">) {
  return (
    <div className="stack--loose">
      <p className={question.prompt.length > 74 ? "prompt prompt--long" : "prompt"}>
        {question.prompt}
      </p>
      <OptionList
        options={question.view.options}
        locked={locked}
        label={question.prompt}
        onPick={(choice) => onCommit({ choice })}
      />
    </div>
  );
}
