import { useState } from "react";

import type { PuzzleProps } from "./types.js";

type Side = "left" | "right";

/**
 * Tap one side, then the other, to link a pair. Links are numbered rather
 * than drawn, which survives a narrow phone far better than connecting lines.
 */
export function Match({ question, locked, onCommit }: PuzzleProps<"match">) {
  const [selected, setSelected] = useState<{ side: Side; value: string } | null>(null);
  const [pairs, setPairs] = useState<Array<[string, string]>>([]);
  const [sent, setSent] = useState(false);

  const linkedLeft = new Map(pairs.map(([left], index) => [left, index + 1]));
  const linkedRight = new Map(pairs.map(([, right], index) => [right, index + 1]));

  const tap = (side: Side, value: string) => {
    if (locked || sent) return;

    // Tapping something already linked unlinks it, so a misfire is fixable.
    const alreadyLinked = side === "left" ? linkedLeft.has(value) : linkedRight.has(value);
    if (alreadyLinked) {
      setPairs(pairs.filter(([left, right]) => (side === "left" ? left !== value : right !== value)));
      setSelected(null);
      return;
    }

    if (!selected) {
      setSelected({ side, value });
      return;
    }
    if (selected.side === side) {
      setSelected({ side, value });
      return;
    }

    const pair: [string, string] =
      side === "right" ? [selected.value, value] : [value, selected.value];
    setPairs([...pairs, pair]);
    setSelected(null);
  };

  const complete = pairs.length === question.view.left.length;

  const commit = () => {
    if (locked || sent) return;
    setSent(true);
    onCommit({ pairs });
  };

  const cell = (side: Side, value: string) => {
    const tag = side === "left" ? linkedLeft.get(value) : linkedRight.get(value);
    return (
      <button
        key={`${side}-${value}`}
        type="button"
        className="tile"
        data-linked={tag != null}
        data-selected={selected?.side === side && selected.value === value}
        disabled={locked || sent}
        onClick={() => tap(side, value)}
      >
        {value}
        {tag != null ? <span className="tag">{tag}</span> : null}
      </button>
    );
  };

  return (
    <div className="stack">
      <p className="prompt">{question.prompt}</p>

      <div className="pair-grid">
        <div className="stack-s">{question.view.left.map((value) => cell("left", value))}</div>
        <div className="stack-s">{question.view.right.map((value) => cell("right", value))}</div>
      </div>

      <button type="button" className="btn" disabled={locked || sent || pairs.length === 0} onClick={commit}>
        {sent ? "Locked in" : complete ? "Lock it in" : `Lock in ${pairs.length} of ${question.view.left.length}`}
      </button>
    </div>
  );
}
