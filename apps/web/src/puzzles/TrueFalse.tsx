import { useState } from "react";

import type { PuzzleProps } from "./types.js";

export function TrueFalse({ question, locked, onCommit }: PuzzleProps<"truefalse">) {
  const [picked, setPicked] = useState<boolean | null>(null);

  const choose = (value: boolean) => {
    if (locked || picked !== null) return;
    setPicked(value);
    onCommit({ value });
  };

  return (
    <div className="stack">
      <p className="prompt">{question.view.statement}</p>
      <div className="pair-grid">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            type="button"
            className={`option${picked === value ? " picked" : ""}`}
            disabled={locked || picked !== null}
            onClick={() => choose(value)}
          >
            <span className="grow center">{value ? "True" : "False"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
