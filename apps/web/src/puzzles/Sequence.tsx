import { Reorder, useDragControls } from "motion/react";
import { useEffect, useState } from "react";

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
export function Sequence({ question, locked, onStage }: PuzzleProps<"sequence">) {
  const [items, setItems] = useState(question.view.items);

  /**
   * A sequence is always a complete answer, dealt order included, so it
   * stages on mount as well as on every drag. A player who thinks the rows
   * arrived in the right order can just submit.
   */
  useEffect(() => {
    onStage({ order: items.map((item) => question.view.items.indexOf(item)) });
  }, [items, question.view.items, onStage]);

  return (
    <div className="stack--loose">
      <p className="prompt">{question.prompt}</p>

      <Reorder.Group
        axis="y"
        values={items}
        onReorder={setItems}
        className="sequence"
      >
        {items.map((item, position) => (
          <Row key={item} item={item} position={position} locked={locked} />
        ))}
      </Reorder.Group>

      <p className="tiny faint center">Drag them into order.</p>
    </div>
  );
}
