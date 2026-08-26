import { useState } from "react";

import type { PuzzleProps } from "./types.js";

/**
 * Tap items in the order they belong. Tapping rather than dragging, because
 * drag-and-drop on a phone in a noisy room is a losing proposition.
 */
export function Sequence({ question, locked, onCommit }: PuzzleProps<"sequence">) {
  const [order, setOrder] = useState<number[]>([]);
  const [sent, setSent] = useState(false);

  const toggle = (index: number) => {
    if (locked || sent) return;
    setOrder(order.includes(index) ? order.filter((i) => i !== index) : [...order, index]);
  };

  const complete = order.length === question.view.items.length;

  const commit = () => {
    if (locked || sent || !complete) return;
    setSent(true);
    onCommit({ order });
  };

  return (
    <div className="stack">
      <p className="prompt">{question.prompt}</p>

      <div className="stack-s">
        {question.view.items.map((item, index) => {
          const position = order.indexOf(index);
          return (
            <button
              key={item}
              type="button"
              className="seq-item"
              data-placed={position >= 0}
              disabled={locked || sent}
              onClick={() => toggle(index)}
            >
              <span className="slot">{position >= 0 ? position + 1 : ""}</span>
              <span className="grow">{item}</span>
            </button>
          );
        })}
      </div>

      <button type="button" className="btn" disabled={locked || sent || !complete} onClick={commit}>
        {sent ? "Locked in" : complete ? "Lock it in" : "Tap them in order"}
      </button>
    </div>
  );
}
