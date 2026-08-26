import { Reorder, useDragControls } from "motion/react";
import { useState } from "react";

import type { PuzzleProps } from "./types.js";

interface RowProps {
  item: string;
  position: number;
  locked: boolean;
}

function Row({ item, position, locked }: RowProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={!locked}
      dragControls={controls}
      className="seq"
      whileDrag={{ scale: 1.03, zIndex: 2 }}
      onDragStart={() => navigator.vibrate?.(6)}
    >
      <span className="seq__slot">{position + 1}</span>
      <span className="grow">{item}</span>
      <span className="seq__grip" aria-hidden="true">
        ⠿
      </span>
    </Reorder.Item>
  );
}

/**
 * Drag the rows into the order they belong.
 *
 * Reordering by dragging rather than tapping a sequence of numbers: it is
 * what everyone already expects a list like this to do, and the answer shape
 * is unchanged — the engine grades an array of original indices in their
 * final positions either way.
 */
export function Sequence({ question, locked, onCommit }: PuzzleProps<"sequence">) {
  const [items, setItems] = useState(question.view.items);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);

  const commit = () => {
    if (locked || sent) return;
    setSent(true);
    onCommit({ order: items.map((item) => question.view.items.indexOf(item)) });
  };

  return (
    <div className="stack--loose">
      <p className="prompt">{question.prompt}</p>

      <Reorder.Group
        axis="y"
        values={items}
        onReorder={(next) => {
          setItems(next);
          setTouched(true);
        }}
        className="sequence"
      >
        {items.map((item, position) => (
          <Row key={item} item={item} position={position} locked={locked || sent} />
        ))}
      </Reorder.Group>

      <button type="button" className="button state" disabled={locked || sent} onClick={commit}>
        {sent ? "Locked in" : touched ? "Lock it in" : "Drag them into order"}
      </button>
    </div>
  );
}
