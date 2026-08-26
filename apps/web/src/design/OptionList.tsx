import { m } from "motion/react";
import { useState } from "react";

import { cascade, rise, snap } from "./motion.js";

export interface OptionListProps {
  options: string[];
  locked: boolean;
  onPick(index: number): void;
  /** Known only after a reveal; marks which row was actually right. */
  correct?: number | null;
  /** Big centred labels for two-way choices. */
  variant?: "list" | "binary";
  label?: string;
  /**
   * Shared identity for the row the player picks.
   *
   * The next screen renders its verdict under the same id, so the option you
   * tapped physically travels into the answer rather than one screen fading
   * into another. It is the single most expensive-feeling thing in the app
   * and it costs one prop.
   */
  morphId?: string;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * The answer list four kinds share.
 *
 * States are one `data-state` per row rather than a pile of class names, so
 * the CSS reads as a small state machine: picked sweeps a fill, everything
 * else recedes, and once the answer is known the right and wrong rows get an
 * edge and a glyph — never a flood of colour.
 */
export function OptionList({
  options,
  locked,
  onPick,
  correct,
  variant = "list",
  label,
  morphId,
}: OptionListProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const known = correct != null;

  const choose = (index: number) => {
    if (locked || picked !== null) return;
    setPicked(index);
    navigator.vibrate?.(8);
    onPick(index);
  };

  const stateOf = (index: number): string => {
    if (known && index === correct) return "right";
    if (known && index === picked) return "wrong";
    if (picked === index) return "picked";
    if (picked !== null) return "passed";
    return "open";
  };

  return (
    <m.div
      className={variant === "binary" ? "binary" : "options"}
      role="group"
      aria-label={label}
      variants={cascade(0.04)}
      initial="hidden"
      animate="shown"
    >
      {options.map((option, index) => {
        const state = stateOf(index);
        const isPicked = picked === index;
        return (
          <m.button
            key={option}
            type="button"
            className="option state"
            data-state={state}
            variants={rise}
            layout
            {...(morphId && isPicked ? { layoutId: morphId } : {})}
            whileTap={locked || picked !== null ? undefined : { scale: 0.975 }}
            transition={snap}
            disabled={locked || picked !== null}
            onClick={() => choose(index)}
          >
            <span className="option__fill" aria-hidden="true" />
            {variant === "list" ? (
              <span className="option__badge">{LETTERS[index] ?? index + 1}</span>
            ) : null}
            <span className="option__label">{option}</span>
            {state === "right" ? (
              <m.span
                className="option__mark"
                aria-label="correct"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={snap}
              >
                ✓
              </m.span>
            ) : null}
            {state === "wrong" ? (
              <m.span
                className="option__mark"
                aria-label="incorrect"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={snap}
              >
                ✕
              </m.span>
            ) : null}
          </m.button>
        );
      })}
    </m.div>
  );
}
