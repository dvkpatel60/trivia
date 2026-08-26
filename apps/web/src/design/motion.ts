import type { Transition, Variants } from "motion/react";

/**
 * The motion vocabulary.
 *
 * Springs rather than durations, for two reasons that matter on a phone:
 * a spring is interruptible — tap during an exit and the animation redirects
 * instead of queueing behind it — and its overshoot is what reads as physical
 * rather than as a timed fade.
 *
 * Everything in the app draws from these four, which is what keeps a
 * scoreboard, a sorter card, and a scene transition feeling like one object.
 */

/** Scene changes and anything large. Settles without visible bounce. */
export const glide: Transition = { type: "spring", stiffness: 260, damping: 32, mass: 0.9 };

/** The default for controls: quick, with just enough overshoot to feel alive. */
export const snap: Transition = { type: "spring", stiffness: 420, damping: 30, mass: 0.7 };

/** Celebratory. For verdicts, the podium, anything that should land. */
export const pounce: Transition = { type: "spring", stiffness: 320, damping: 18, mass: 0.8 };

/** Rank changes and other layout shifts, where overshoot would read as noise. */
export const settle: Transition = { type: "spring", stiffness: 300, damping: 34 };

/** Anything genuinely continuous — the ambient background. */
export const drift: Transition = { duration: 18, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" };

export const scene: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: glide },
  gone: { opacity: 0, y: -10, transition: { duration: 0.16 } },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: snap },
};

export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  shown: { opacity: 1, scale: 1, transition: pounce },
};

/** A list whose children arrive in sequence rather than as a block. */
export const cascade = (stagger = 0.045): Variants => ({
  hidden: {},
  shown: { transition: { staggerChildren: stagger, delayChildren: 0.03 } },
});

/**
 * Motion is a courtesy, not a requirement.
 *
 * Read once at module load: a viewer who has asked their system to stop
 * animating gets the layout with none of it, and every spring collapses to
 * an instant cut.
 */
export const reduced =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const maybe = <T extends Transition>(transition: T): Transition =>
  reduced ? { duration: 0 } : transition;
