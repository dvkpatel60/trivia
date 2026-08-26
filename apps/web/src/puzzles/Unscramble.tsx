import { useState } from "react";

import type { PuzzleProps } from "./types.js";

export function Unscramble({ question, locked, onCommit }: PuzzleProps<"unscramble">) {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);

  const commit = () => {
    if (locked || sent || !value.trim()) return;
    setSent(true);
    navigator.vibrate?.(8);
    onCommit({ word: value });
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
          disabled={locked || sent}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-label={`Your answer, ${question.view.length} letters`}
          placeholder={"·".repeat(Math.min(question.view.length, 12))}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
          }}
        />
        <button
          type="button"
          className="button"
          disabled={locked || sent || !value.trim()}
          onClick={commit}
        >
          {sent ? "Locked in" : "Lock it in"}
        </button>
      </div>
    </div>
  );
}
