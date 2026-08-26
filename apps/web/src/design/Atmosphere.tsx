import { useMemo } from "react";
import type { Texture } from "@curio/core";

const LAYERS: Record<Texture, string> = {
  emberGlow: "tex-ember",
  grid: "tex-grid",
  horizonGlow: "tex-horizon",
  grain: "tex-grain",
  vignette: "tex-vignette",
};

interface AtmosphereProps {
  textures: Texture[];
  /**
   * The current question's deadline, in corrected server time. Drives the
   * pressure bloom at the screen edge.
   */
  pressure?: { endsAt: number; totalMs: number; now: number } | null;
}

/**
 * The pack's world, behind everything.
 *
 * Fixed and inert, so nothing here can intercept a tap. The pressure layer
 * is a CSS animation offset by however much of the question has already
 * elapsed, which means it stays in step with the server's clock without
 * React rendering a single extra frame.
 */
export function Atmosphere({ textures, pressure }: AtmosphereProps) {
  const pressureStyle = useMemo(() => {
    if (!pressure || pressure.totalMs <= 0) return null;
    const elapsed = Math.max(0, pressure.totalMs - (pressure.endsAt - pressure.now));
    return {
      animationDuration: `${pressure.totalMs}ms`,
      animationDelay: `-${elapsed}ms`,
    };
  }, [pressure]);

  return (
    <div className="atmosphere" aria-hidden="true">
      {textures.map((texture) => (
        <div key={texture} className={LAYERS[texture]} />
      ))}
      {pressureStyle ? <div className="tex-pressure" style={pressureStyle} /> : null}
    </div>
  );
}
