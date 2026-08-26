import { useState } from "react";

import type { PuzzleProps } from "./types.js";

/**
 * A stack of cards, one bucket per pack-declared category.
 *
 * The card flies off toward whichever bucket you pick and the next one
 * lands, which turns what used to be a list of radio buttons into the most
 * physical thing in the app. The component never names a category itself —
 * houses and continents render through the same screen.
 */
export function Categorize({ question, locked, onCommit }: PuzzleProps<"categorize">) {
  const [assignments, setAssignments] = useState<string[]>([]);
  const [leaving, setLeaving] = useState(false);

  const labels = question.view.labels;
  const index = assignments.length;
  const label = labels[index];

  const assign = (categoryId: string) => {
    if (locked || !label || leaving) return;
    navigator.vibrate?.(8);
    setLeaving(true);

    // Let the card clear the screen before the next one arrives.
    window.setTimeout(() => {
      const next = [...assignments, categoryId];
      setAssignments(next);
      setLeaving(false);
      if (next.length === labels.length) onCommit({ assignments: next });
    }, 170);
  };

  return (
    <div className="stack--loose">
      <div className="row--between">
        <p className="eyebrow">{question.prompt}</p>
        <div className="dots" aria-label={`${index} of ${labels.length} sorted`}>
          {labels.map((entry, position) => (
            <span
              key={entry}
              data-state={position < index ? "done" : position === index ? "now" : "todo"}
            />
          ))}
        </div>
      </div>

      <div className="sorter">
        {label ? (
          <div className="sorter__card" data-leaving={leaving} key={label}>
            {label}
          </div>
        ) : (
          <p className="lede">All sorted.</p>
        )}
      </div>

      <div className="buckets">
        {question.view.categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className="bucket"
            disabled={locked || !label}
            style={category.color ? ({ "--bucket-color": category.color } as React.CSSProperties) : undefined}
            onClick={() => assign(category.id)}
          >
            {category.label}
            {category.sub ? <span className="bucket__sub">{category.sub}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
