import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";

import { reduced } from "./motion.js";

interface ScoreBurstProps {
  /** Fire when this changes to a positive number; resets the burst. */
  active: boolean;
  count?: number;
}

const PARTICLE_COUNT = 6;

/**
 * A handful of accent dots that fly outward when a score climbs.
 *
 * Cheap enough to mount on every row: the particles are absolutely positioned
 * CSS circles animated by motion values, and the whole tree unmounts between
 * bursts.
 */
export function ScoreBurst({ active, count = PARTICLE_COUNT }: ScoreBurstProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (active && !reduced) setKey((k) => k + 1);
  }, [active]);

  if (!active || reduced) return null;

  return (
    <AnimatePresence>
      <m.span
        key={key}
        className="score-burst"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.65 }}
      >
        {Array.from({ length: count }, (_, i) => {
          const angle = (i / count) * Math.PI * 2;
          const distance = 14 + Math.random() * 10;
          return (
            <m.span
              key={i}
              className="score-burst__dot"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                opacity: 0,
                scale: 0.3,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.02 }}
            />
          );
        })}
      </m.span>
    </AnimatePresence>
  );
}
