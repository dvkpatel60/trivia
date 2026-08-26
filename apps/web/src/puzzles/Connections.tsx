import { AnimatePresence, m } from "motion/react";
import { useState } from "react";

import { pounce, settle, snap } from "../design/motion.js";
import type { PuzzleProps } from "./types.js";

/**
 * Sixteen tiles, four hidden groups.
 *
 * Select a group's worth of tiles and lock it in. Locked guesses lift out of
 * the grid into a row of their own whether or not they were right, so the
 * board shrinks as you go and a wrong guess is still visibly spent — the
 * tension of the puzzle is entirely in what you have left.
 *
 * Nothing here knows whether a guess was correct: the server grades. The row
 * only shows what was committed.
 */
export function Connections({ question, locked, onStage }: PuzzleProps<"connections">) {
  const { tiles, groupSize, groupCount } = question.view;

  const [selected, setSelected] = useState<string[]>([]);
  const [committed, setCommitted] = useState<string[][]>([]);

  const spent = new Set(committed.flat());
  const remaining = tiles.filter((tile) => !spent.has(tile));
  const full = selected.length === groupSize;

  const done = committed.length >= groupCount - 1;

  const toggle = (tile: string) => {
    if (locked || done || spent.has(tile)) return;
    navigator.vibrate?.(6);
    setSelected((current) =>
      current.includes(tile)
        ? current.filter((entry) => entry !== tile)
        : current.length >= groupSize
          ? current
          : [...current, tile],
    );
  };

  /**
   * Grouping is not submitting.
   *
   * Every locked group re-stages what the player has so far, so somebody who
   * finds two groups and runs out of ideas simply taps Submit — the old
   * "Stop here with N" button was a second way of doing the same thing, and
   * a puzzle with two submit gestures is one too many.
   */
  const lockGroup = () => {
    if (!full || locked || done) return;
    navigator.vibrate?.(12);
    const next = [...committed, selected];
    setCommitted(next);
    setSelected([]);

    // The last group is forced, so locking the penultimate one fills it in.
    if (next.length >= groupCount - 1) {
      const last = tiles.filter((tile) => !next.flat().includes(tile));
      onStage({ groups: last.length === groupSize ? [...next, last] : next });
      return;
    }
    onStage({ groups: next });
  };

  return (
    <div className="stack--loose puzzle--dense">
      <div className="row--between">
        <p className="eyebrow">{question.prompt}</p>
        <span className="eyebrow num">
          {committed.length} / {groupCount}
        </span>
      </div>

      {/* Guesses already spent, lifted out of the board. */}
      <AnimatePresence>
        {committed.map((group, index) => (
          <m.div
            key={group.join("|")}
            className="grouped"
            layout
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={pounce}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {group.map((tile) => (
              <span key={tile} className="grouped__tile">
                {tile}
              </span>
            ))}
          </m.div>
        ))}
      </AnimatePresence>

      <m.div className="wall" layout>
        <AnimatePresence>
          {remaining.map((tile) => (
            <m.button
              key={tile}
              type="button"
              className="wall__tile state"
              layout
              data-picked={selected.includes(tile)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.94 }}
              transition={settle}
              disabled={locked || done}
              onClick={() => toggle(tile)}
            >
              {tile}
            </m.button>
          ))}
        </AnimatePresence>
      </m.div>

      <m.button
        type="button"
        className="button button--quiet state"
        disabled={locked || done || !full}
        animate={{ scale: full && !done ? 1 : 0.995 }}
        transition={snap}
        onClick={lockGroup}
      >
        {done
          ? "Every group placed"
          : full
            ? `Group these ${groupSize}`
            : `Pick ${groupSize - selected.length} more`}
      </m.button>
    </div>
  );
}
