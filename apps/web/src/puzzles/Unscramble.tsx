import { useState } from "react";

import type { PuzzleProps } from "./types.js";

export function Unscramble({ question, locked, onCommit }: PuzzleProps<"unscramble">) {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);

  const commit = () => {
    if (locked || sent || !value.trim()) return;
    setSent(true);
    onCommit({ word: value });
  };

  return (
    <div className="stack">
      <p className="prompt">{question.prompt}</p>

      <div className="letter-tiles" aria-hidden="true">
        {question.view.tiles.map((letter, index) => (
          <span className="letter" key={`${letter}-${index}`}>
            {letter}
          </span>
        ))}
      </div>

      <p className="tiny faint center">{question.view.length} letters</p>

      <input
        className="input code-input"
        value={value}
        disabled={locked || sent}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-label="Your answer"
        placeholder="Your answer"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
        }}
      />

      <button type="button" className="btn" disabled={locked || sent || !value.trim()} onClick={commit}>
        {sent ? "Locked in" : "Lock it in"}
      </button>
    </div>
  );
}
