import { m } from "motion/react";

import { glide, pounce, reduced } from "./motion.js";
import { Sigil } from "./Sigil.js";

interface WordmarkProps {
  /** `full` is the title card; `compact` is the sigil and name only. */
  variant?: "full" | "compact";
}

/**
 * The title card.
 *
 * Struck rather than typeset: the sigil above, the name spaced out beneath
 * it, and a hairline rule holding the whole thing together. Nothing moves
 * quickly here — the mark settles into place and the rules draw themselves
 * outward, which is what makes an opening screen feel like a threshold
 * rather than a loading state.
 */
export function Wordmark({ variant = "full" }: WordmarkProps) {
  if (variant === "compact") {
    return (
      <span className="mark mark--compact">
        <Sigil size={26} weight={2} detail="seal" className="mark__sigil" />
        <span className="mark__name">Curio.</span>
      </span>
    );
  }

  return (
    <m.div
      className="mark"
      initial={reduced ? false : "hidden"}
      animate="shown"
      variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.14 } } }}
    >
      <m.span
        className="mark__sigil"
        variants={{
          hidden: { opacity: 0, scale: 0.82, rotate: -6 },
          shown: { opacity: 1, scale: 1, rotate: 0, transition: pounce },
        }}
      >
        <Sigil size={72} weight={1.3} />
      </m.span>

      <m.span
        className="mark__rule"
        variants={{
          hidden: { scaleX: 0 },
          shown: { scaleX: 1, transition: glide },
        }}
      />

      <m.h1
        className="mark__name mark__name--hero"
        variants={{
          hidden: { opacity: 0, y: 8 },
          shown: { opacity: 1, y: 0, transition: glide },
        }}
      >
        Curio.
      </m.h1>

      <m.p
        className="mark__tagline"
        variants={{
          hidden: { opacity: 0 },
          shown: { opacity: 1, transition: { duration: 0.9 } },
        }}
      >
        The cabinet of curiosities
      </m.p>

      <m.span
        className="mark__rule"
        variants={{
          hidden: { scaleX: 0 },
          shown: { scaleX: 1, transition: glide },
        }}
      />
    </m.div>
  );
}
