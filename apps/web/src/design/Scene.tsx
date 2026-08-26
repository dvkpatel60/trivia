import type { ReactNode } from "react";

interface SceneProps {
  /** Context and the timer. Never moves between questions. */
  rail?: ReactNode;
  /** The one thing you are looking at. The only region that scrolls. */
  children: ReactNode;
  /** Actions, pinned in the thumb zone above the home indicator. */
  dock?: ReactNode;
  /** Content-heavy scenes anchor to the top instead of centring. */
  flow?: "center" | "top" | "end";
  /** Distinguishes scenes so React remounts (and re-animates) between them. */
  id?: string;
}

/**
 * Every phase of the game is one of these.
 *
 * Three fixed zones rather than a scrolling column: it is what makes the app
 * feel like a stage instead of a form, and it means the answer buttons are
 * always in exactly the same place under your thumb.
 */
export function Scene({ rail, children, dock, flow = "center", id }: SceneProps) {
  return (
    <div className="scene enter" key={id}>
      <div className="scene__rail">{rail}</div>
      <div className="scene__stage" data-flow={flow}>
        {children}
      </div>
      <div className="scene__dock">{dock}</div>
    </div>
  );
}
