import { useState } from "react";

import type { PuzzleProps } from "./types.js";

/**
 * One label at a time, with the pack's own categories as the buttons. The
 * component never names a category itself — it renders whatever the pack
 * declared, which is what lets houses and continents share one screen.
 */
export function Categorize({ question, locked, onCommit }: PuzzleProps<"categorize">) {
  const [assignments, setAssignments] = useState<string[]>([]);
  const labels = question.view.labels;
  const index = assignments.length;
  const label = labels[index];

  const assign = (categoryId: string) => {
    if (locked || !label) return;
    const next = [...assignments, categoryId];
    setAssignments(next);
    if (next.length === labels.length) onCommit({ assignments: next });
  };

  return (
    <div className="stack">
      <p className="prompt">{question.prompt}</p>

      <div className="dots" aria-hidden="true">
        {labels.map((entry, i) => (
          <span key={entry} className={i < index ? "done" : i === index ? "now" : ""} />
        ))}
      </div>

      {label ? (
        <>
          <h2 className="center fade-in" key={label}>
            {label}
          </h2>
          <div className="category-grid">
            {question.view.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="category-btn"
                disabled={locked}
                style={category.color ? { borderColor: `${category.color}66` } : undefined}
                onClick={() => assign(category.id)}
              >
                {category.label}
                {category.sub ? <span className="sub">{category.sub}</span> : null}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="serif-i center">All sorted.</p>
      )}
    </div>
  );
}
