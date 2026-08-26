import { useState } from "react";

import type { PuzzleProps } from "./types.js";

type Side = "left" | "right";

/**
 * Tap one side then the other to link a pair.
 *
 * Selecting lifts the tile and dims the column that can't accept it, which
 * is what replaces drawing connector lines — those never survive a phone in
 * portrait. Tapping a linked tile again breaks the pair, so a misfire costs
 * nothing.
 */
export function Match({ question, locked, onCommit }: PuzzleProps<"match">) {
  const [selected, setSelected] = useState<{ side: Side; value: string } | null>(null);
  const [pairs, setPairs] = useState<Array<[string, string]>>([]);
  const [sent, setSent] = useState(false);

  const linked = {
    left: new Map(pairs.map(([left], index) => [left, index + 1])),
    right: new Map(pairs.map(([, right], index) => [right, index + 1])),
  };

  const tap = (side: Side, value: string) => {
    if (locked || sent) return;

    if (linked[side].has(value)) {
      setPairs(pairs.filter(([left, right]) => (side === "left" ? left !== value : right !== value)));
      setSelected(null);
      return;
    }

    if (!selected || selected.side === side) {
      setSelected({ side, value });
      return;
    }

    const pair: [string, string] =
      side === "right" ? [selected.value, value] : [value, selected.value];
    setPairs([...pairs, pair]);
    setSelected(null);
    navigator.vibrate?.(6);
  };

  const complete = pairs.length === question.view.left.length;

  const commit = () => {
    if (locked || sent) return;
    setSent(true);
    onCommit({ pairs });
  };

  const column = (side: Side, values: string[]) => (
    <div className="match__column">
      {values.map((value) => (
        <button
          key={`${side}-${value}`}
          type="button"
          className="tile"
          data-linked={linked[side].has(value)}
          data-selected={selected?.side === side && selected.value === value}
          data-dimmed={Boolean(selected) && selected?.side === side && !linked[side].has(value)}
          disabled={locked || sent}
          onClick={() => tap(side, value)}
        >
          {value}
          {linked[side].has(value) ? <span className="tile__tag">{linked[side].get(value)}</span> : null}
        </button>
      ))}
    </div>
  );

  return (
    <div className="stack--loose">
      <p className="prompt center">{question.prompt}</p>

      <div className="match">
        {column("left", question.view.left)}
        {column("right", question.view.right)}
      </div>

      <button
        type="button"
        className="button"
        disabled={locked || sent || pairs.length === 0}
        onClick={commit}
      >
        {sent
          ? "Locked in"
          : complete
            ? "Lock it in"
            : `Lock in ${pairs.length} of ${question.view.left.length}`}
      </button>
    </div>
  );
}
