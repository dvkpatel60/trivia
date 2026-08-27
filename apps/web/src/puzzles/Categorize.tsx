import { AnimatePresence, m } from "motion/react";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";

import { pounce, snap } from "../design/motion.js";
import type { PuzzleProps } from "./types.js";

/**
 * A stack of cards, one bucket per pack-declared category.
 *
 * Drag the card onto a bucket, or just tap the bucket — both work, because a
 * gesture nobody discovers is worse than no gesture. Whichever you use, the
 * card flies off and the next one lands, which turns what used to be a list
 * of radio buttons into the most physical thing in the app.
 *
 * A sorted card can be taken back until the answer is submitted. Sorting is
 * a working step; the dock is where a player commits.
 *
 * The component never names a category itself: houses and continents render
 * through the same screen.
 */
export function Categorize({ question, locked, onStage }: PuzzleProps<"categorize">) {
  const [assignments, setAssignments] = useState<string[]>([]);
  const [over, setOver] = useState<string | null>(null);
  const buckets = useRef(new Map<string, HTMLButtonElement>());
  const arena = useRef<HTMLDivElement>(null);

  const labels = question.view.labels;
  const index = assignments.length;
  const label = labels[index];

  const assign = (categoryId: string) => {
    if (locked || !label) return;
    navigator.vibrate?.(10);
    setOver(null);
    const next = [...assignments, categoryId];
    setAssignments(next);
    // Half a stack sorted is not an answer, so nothing is staged until the
    // last card lands and Submit stays inert until then.
    onStage(next.length === labels.length ? { assignments: next } : null);
  };

  /** Deal the last card back onto the stack. */
  const undo = () => {
    if (locked || assignments.length === 0) return;
    navigator.vibrate?.(6);
    setAssignments(assignments.slice(0, -1));
    onStage(null);
  };

  /**
   * Which bucket the card is headed for.
   *
   * Nearest by horizontal distance once the card is dragged low enough,
   * rather than requiring a precise landing inside a 78px target. Precision
   * dropping is miserable on a phone, and there is only ever one row of
   * buckets to choose between.
   */
  const bucketFor = (x: number, y: number): string | null => {
    let nearest: string | null = null;
    let best = Infinity;
    let armed = false;

    for (const [id, element] of buckets.current) {
      const box = element.getBoundingClientRect();
      if (y >= box.top - 90) armed = true;
      const distance = Math.abs(x - (box.left + box.width / 2));
      if (distance < best) {
        best = distance;
        nearest = id;
      }
    }
    return armed ? nearest : null;
  };

  return (
    <div className="stack--loose">
      <div className="row--between">
        <p className="eyebrow">{question.prompt}</p>
        <div className="row--tight">
          {assignments.length > 0 && !locked ? (
            <button
              type="button"
              className="button button--ghost button--inline state"
              onClick={undo}
            >
              Put one back
            </button>
          ) : null}
          <div className="dots" aria-label={`${index} of ${labels.length} sorted`}>
            {labels.map((entry, position) => (
              <span
                key={entry}
                data-state={position < index ? "done" : position === index ? "now" : "todo"}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="sorter" ref={arena}>
        <AnimatePresence mode="popLayout">
          {label ? (
            <m.div
              key={label}
              className="sorter__card"
              drag={!locked}
              dragSnapToOrigin
              dragMomentum={false}
              dragElastic={0.1}
              /* Kept inside the viewport, and shrunk toward bucket size so a
                 long name doesn't run off the screen on the way down. */
              dragConstraints={{ left: -84, right: 84, top: -60, bottom: 300 }}
              whileDrag={{ scale: 0.74, rotate: 2, cursor: "grabbing" }}
              onDrag={(_, info) => setOver(bucketFor(info.point.x, info.point.y))}
              onDragEnd={(_, info) => {
                const target = bucketFor(info.point.x, info.point.y);
                if (target) assign(target);
                else setOver(null);
              }}
              initial={{ opacity: 0, y: 22, scale: 0.94, rotate: -1.5 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: -40, scale: 0.86, rotate: 3 }}
              transition={pounce}
            >
              {label}
            </m.div>
          ) : (
            <p className="lede">All sorted.</p>
          )}
        </AnimatePresence>
      </div>

      <div className="buckets">
        {question.view.categories.map((category) => (
          <m.button
            key={category.id}
            ref={(element: HTMLButtonElement | null) => {
              if (element) buckets.current.set(category.id, element);
              else buckets.current.delete(category.id);
            }}
            type="button"
            className="bucket state"
            data-over={over === category.id}
            disabled={locked || !label}
            animate={{ scale: over === category.id ? 1.06 : 1 }}
            transition={snap}
            style={
              category.color ? ({ "--bucket-color": category.color } as CSSProperties) : undefined
            }
            onClick={() => assign(category.id)}
          >
            {category.label}
            {category.sub ? <span className="bucket__sub">{category.sub}</span> : null}
          </m.button>
        ))}
      </div>
    </div>
  );
}
