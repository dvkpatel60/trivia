import { OptionList } from "../design/index.js";
import type { PuzzleProps } from "./types.js";

export function TrueFalse({ question, locked, onCommit }: PuzzleProps<"truefalse">) {
  return (
    <div className="stack--loose">
      <p className="prompt center">{question.view.statement}</p>
      <OptionList
        options={["True", "False"]}
        variant="binary"
        locked={locked}
        label={question.view.statement}
        onPick={(index) => onCommit({ value: index === 0 })}
      />
    </div>
  );
}
