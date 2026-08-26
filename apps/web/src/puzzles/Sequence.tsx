import { useState } from "react";

import type { PuzzleProps } from "./types.js";

/**
 * Tap items in the order they belong.
 *
 * Tapping rather than dragging: drag-and-drop on a phone, in a noisy room,
 * against a countdown, is a losing proposition.
 */
export function Sequence({ question, locked, onCommit }: PuzzleProps<"sequence">) {
  const [order, setOrder] = useState<number[]>([]);
  const [sent, setSent] = useState(false);

  const toggle = (index: number) => {
    if (locked || sent) return;
    navigator.vibrate?.(6);
    setOrder(order.includes(index) ? order.filter((i) => i !== index) : [...order, index]);
  };

  const complete = order.length === question.view.items.length;

  const commit = () => {
    if (locked || sent || !complete) return;
    setSent(true);
    onCommit({ order });
  };

  return (
    <div className="stack--loose">
      <p className="prompt">{question.prompt}</p>

      <div className="sequence">
        {question.view.items.map((item, index) => {
          const position = order.indexOf(index);
          return (
            <button
              key={item}
              type="button"
              className="seq"
              data-placed={position >= 0}
              disabled={locked || sent}
              onClick={() => toggle(index)}
            >
              <span className="seq__slot">{position >= 0 ? position + 1 : ""}</span>
              <span className="grow">{item}</span>
            </button>
          );
        })}
      </div>

      <button type="button" className="button" disabled={locked || sent || !complete} onClick={commit}>
        {sent ? "Locked in" : complete ? "Lock it in" : "Tap them in order"}
      </button>
    </div>
  );
}
