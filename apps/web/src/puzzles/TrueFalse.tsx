import { OptionList } from "../design/index.js";
import type { PuzzleProps } from "./types.js";

export function TrueFalse({ question, locked, onStage, morphId }: PuzzleProps<"truefalse">) {
  return (
    <div className="stack--loose">
      <p className="prompt center">{question.view.statement}</p>
      <OptionList
        options={["True", "False"]}
        variant="binary"
        locked={locked}
        label={question.view.statement}
        morphId={morphId}
        onPick={(index) => onStage({ value: index === 0 })}
      />
    </div>
  );
}
