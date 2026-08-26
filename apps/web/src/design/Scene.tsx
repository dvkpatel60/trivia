import { m } from "motion/react";
import type { ReactNode } from "react";

import { glide, reduced } from "./motion.js";

interface SceneProps {
  /** Context and the timer. Never moves between questions. */
  rail?: ReactNode;
  /** The one thing you are looking at. The only region that scrolls. */
  children: ReactNode;
  /** Actions, pinned in the thumb zone above the home indicator. */
  dock?: ReactNode;
  /** Content-heavy scenes anchor to the top instead of centring. */
  flow?: "center" | "top" | "end";
  /** Distinguishes scenes, so a phase change animates rather than mutating. */
  id?: string;
}

/**
 * Every phase of the game is one of these.
 *
 * Three fixed zones rather than a scrolling column: it is what makes the app
 * feel like a stage instead of a form, and it means the answer buttons are
 * always in the same place under your thumb.
 *
 * The rail and dock animate independently of the stage, so context and
 * actions stay put while the content beneath them changes — the thing that
 * separates an app from a slideshow.
 */
export function Scene({ rail, children, dock, flow = "center", id }: SceneProps) {
  return (
    <m.div
      className="scene"
      key={id}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={glide}
    >
      <div className="scene__rail">{rail}</div>
      <div className="scene__stage" data-flow={flow}>
        {children}
      </div>
      <div className="scene__dock">{dock}</div>
    </m.div>
  );
}
