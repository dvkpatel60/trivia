import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { Scenery as SceneryId, Texture } from "@curio/core";

import { SCENERY } from "./Scenery.js";

const LAYERS: Record<Texture, string> = {
  grid: "tex-grid",
  vignette: "tex-vignette",
  nightGlow: "tex-nightglow",
  projector: "tex-projector",
};

/** What the background should be doing right now. */
export type AtmosphereMood = "idle" | "playing" | "beat" | "final";

interface AtmosphereProps {
  textures: Texture[];
  scenery?: SceneryId[];
  mood: AtmosphereMood;
  /** A live question's deadline, in corrected server time. */
  pressure?: { endsAt: number; totalMs: number; now: number } | null;
  /** Changes when the player gets one right, firing a single bloom. */
  bloomKey?: string | null;
}

/**
 * Each mood is three numbers. Transitions between them are CSS property
 * animations, so the background changes character without React rendering a
 * single extra frame.
 *
 * `--scene-drift` scales every drift cycle at once: a question running makes
 * the whole world move faster without anything re-rendering.
 */
const MOODS: Record<AtmosphereMood, CSSProperties> = {
  // Waiting: slow and settled. Breathing.
  idle: { "--scene-drift": "1", "--scene-lift": "1", "--scene-ink": "0.5" } as CSSProperties,
  // A question is open: quicker, and the world sits up.
  playing: { "--scene-drift": "0.6", "--scene-lift": "1.08", "--scene-ink": "0.66" } as CSSProperties,
  // Answer on screen: settles back out.
  beat: { "--scene-drift": "0.85", "--scene-lift": "1.02", "--scene-ink": "0.58" } as CSSProperties,
  // The podium: everything speeds up and brightens.
  final: { "--scene-drift": "0.45", "--scene-lift": "1.16", "--scene-ink": "0.82" } as CSSProperties,
};

export function Atmosphere({ textures, scenery, mood, pressure, bloomKey }: AtmosphereProps) {
  const pressureStyle = useMemo(() => {
    if (!pressure || pressure.totalMs <= 0) return null;
    const elapsed = Math.max(0, pressure.totalMs - (pressure.endsAt - pressure.now));
    return {
      animationDuration: `${pressure.totalMs}ms`,
      animationDelay: `-${elapsed}ms`,
    };
  }, [pressure]);

  return (
    <div className="atmosphere" style={MOODS[mood]} aria-hidden="true">
      {textures.map((texture) => (
        <div key={texture} className={LAYERS[texture]} />
      ))}

      {(scenery ?? []).map((id) => {
        const { Piece, count } = SCENERY[id];
        return (
          <div className={`scenery scenery--${id}`} key={id}>
            {Array.from({ length: count }, (_, i) => (
              <Piece key={i} index={i} />
            ))}
          </div>
        );
      })}

      {pressureStyle ? <div className="tex-pressure" style={pressureStyle} /> : null}
      {bloomKey ? <div className="bloom" key={bloomKey} /> : null}
    </div>
  );
}
