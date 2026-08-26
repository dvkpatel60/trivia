import { useState } from "react";

interface OptionsProps {
  options: string[];
  locked: boolean;
  onPick(index: number): void;
  /** Set once the answer is known, so picks can be marked right or wrong. */
  correct?: number | null;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * The multiple-choice list four kinds share.
 *
 * It keeps its own "what did I tap" state so the parent only hears about a
 * committed answer, and so a locked question still shows the player what
 * they chose.
 */
export function Options({ options, locked, onPick, correct }: OptionsProps) {
  const [picked, setPicked] = useState<number | null>(null);

  const choose = (index: number) => {
    if (locked || picked !== null) return;
    setPicked(index);
    onPick(index);
  };

  return (
    <div className="stack-s">
      {options.map((option, index) => {
        const isPicked = picked === index;
        const known = correct != null;
        const classes = ["option"];
        if (isPicked && !known) classes.push("picked");
        if (known && index === correct) classes.push("right");
        if (known && isPicked && index !== correct) classes.push("wrong");

        return (
          <button
            key={option}
            type="button"
            className={classes.join(" ")}
            disabled={locked || picked !== null}
            onClick={() => choose(index)}
          >
            <span className="marker">{LETTERS[index] ?? index + 1}</span>
            <span className="grow">{option}</span>
          </button>
        );
      })}
    </div>
  );
}
