import { useState } from "react";

import type { PuzzleProps } from "./types.js";

export function Unscramble({ question, locked, onStage, onSubmit }: PuzzleProps<"unscramble">) {
  const [value, setValue] = useState("");

  const type = (next: string) => {
    setValue(next);
    onStage(next.trim() ? { word: next } : null);
  };

  return (
    <div className="stack--loose">
      <p className="prompt center">{question.prompt}</p>

      <div className="letters" aria-hidden="true">
        {question.view.tiles.map((letter, index) => (
          <span className="letter" key={`${letter}-${index}`}>
            {letter}
          </span>
        ))}
      </div>

      <div className="field">
        <input
          className="input input--code"
          value={value}
          disabled={locked}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-label={`Your answer, ${question.view.length} letters`}
          placeholder={"·".repeat(Math.min(question.view.length, 12))}
          onChange={(event) => type(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && value.trim()) onSubmit?.();
          }}
        />
      </div>
    </div>
  );
}
