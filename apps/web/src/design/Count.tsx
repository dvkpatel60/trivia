import { animate, m, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

import { reduced } from "./motion.js";

interface CountProps {
  value: number;
  className?: string;
}

/**
 * A number that travels to its new value instead of snapping to it.
 *
 * Watching a score climb is a surprising amount of the pleasure in a trivia
 * game, and it costs nothing: the tween runs on a motion value, so React
 * never re-renders while the digits change.
 */
export function Count({ value, className }: CountProps) {
  const raw = useMotionValue(value);
  const text = useTransform(raw, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    if (reduced) {
      raw.set(value);
      return;
    }
    const controls = animate(raw, value, { duration: 0.7, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, raw]);

  return <m.span className={className}>{text}</m.span>;
}
