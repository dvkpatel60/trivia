import { useState } from "react";

export interface OptionListProps {
  options: string[];
  locked: boolean;
  onPick(index: number): void;
  /** Known only after a reveal; marks which row was actually right. */
  correct?: number | null;
  /** Big centred labels for two-way choices. */
  variant?: "list" | "binary";
  /** Labels the group for screen readers. */
  label?: string;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * The answer list four kinds share.
 *
 * States are expressed as one `data-state` per row rather than a pile of
 * class names, so the CSS reads as a small state machine: picked sweeps a
 * fill, everything else recedes, and once the answer is known the right and
 * wrong rows get an edge and a glyph — never a flood of colour.
 */
export function OptionList({
  options,
  locked,
  onPick,
  correct,
  variant = "list",
  label,
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
    <div className={variant === "binary" ? "binary" : "options"} role="group" aria-label={label}>
      {options.map((option, index) => {
        const state = stateOf(index);
        return (
          <button
            key={option}
            type="button"
            className="option"
            data-state={state}
            disabled={locked || picked !== null}
            onClick={() => choose(index)}
          >
            <span className="option__fill" aria-hidden="true" />
            {variant === "list" ? (
              <span className="option__badge">{LETTERS[index] ?? index + 1}</span>
            ) : null}
            <span className="option__label">{option}</span>
            {state === "right" ? (
              <span className="option__mark" aria-label="correct">
                ✓
              </span>
            ) : null}
            {state === "wrong" ? (
              <span className="option__mark" aria-label="incorrect">
                ✕
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
