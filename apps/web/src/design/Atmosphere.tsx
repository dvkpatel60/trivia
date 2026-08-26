import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { Texture } from "@curio/core";

const LAYERS: Record<Texture, string> = {
  emberGlow: "tex-ember",
  grid: "tex-grid",
  horizonGlow: "tex-horizon",
  grain: "tex-grain",
  vignette: "tex-vignette",
};

/** What the background should be doing right now. */
export type AtmosphereMood = "idle" | "playing" | "beat" | "final";

interface AtmosphereProps {
  textures: Texture[];
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
 */
const MOODS: Record<AtmosphereMood, CSSProperties> = {
  // Waiting: wide, slow, cool. Breathing.
  idle: { "--orb-speed": "30s", "--orb-scale": "1", "--orb-glow": "0.16" } as CSSProperties,
  // A question is open: tighter and brighter, leaning in.
  playing: { "--orb-speed": "17s", "--orb-scale": "1.1", "--orb-glow": "0.24" } as CSSProperties,
  // Answer on screen: settles back out.
  beat: { "--orb-speed": "24s", "--orb-scale": "1.03", "--orb-glow": "0.2" } as CSSProperties,
  // The podium: everything converges and brightens.
  final: { "--orb-speed": "13s", "--orb-scale": "1.3", "--orb-glow": "0.34" } as CSSProperties,
};

export function Atmosphere({ textures, mood, pressure, bloomKey }: AtmosphereProps) {
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
      <div className="orb orb--a" />
      <div className="orb orb--b" />
      <div className="orb orb--c" />

      {textures.map((texture) => (
        <div key={texture} className={LAYERS[texture]} />
      ))}

      {pressureStyle ? <div className="tex-pressure" style={pressureStyle} /> : null}
      {bloomKey ? <div className="bloom" key={bloomKey} /> : null}
    </div>
  );
}
