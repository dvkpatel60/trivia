import type { ComponentType, CSSProperties } from "react";
import type { Scenery as SceneryId } from "@curio/core";

/**
 * The things that move in a pack's world.
 *
 * Every shape here is a flat fill in a palette colour. That is the whole
 * point of the layer: the old background was three huge radial gradients
 * under a 58px blur, and wide gradients band on dark panels — which is why
 * it needed a tiled noise bitmap on top to look acceptable, and why it read
 * as pixelated rather than as anything.
 *
 * Flat colour has no banding to hide, so there is no grain, no blur, and
 * nothing per-frame in JavaScript: each piece is an absolutely positioned
 * SVG that CSS drifts on its own cycle.
 */

interface PieceProps {
  /** Distributes instances across the width and across the animation cycle. */
  index: number;
}

/**
 * Spread instances so they neither line up nor pulse together.
 *
 * Timing is handed over as custom properties rather than as
 * `animationDuration`, because an inline duration would beat the stylesheet
 * and cut the piece off from `--scene-drift` — the multiplier that lets the
 * whole world speed up when a question opens.
 */
function place(index: number, count: number): CSSProperties {
  const step = 100 / (count + 1);
  return {
    left: `${step * (index + 1)}%`,
    "--piece-delay": `${-(index * 2.7).toFixed(2)}s`,
    "--piece-jitter": (0.82 + ((index * 7) % 9) / 20).toFixed(2),
  } as CSSProperties;
}

/* ── Candlelight ──────────────────────────────────────────────────────── */

/** A lit candle, burning down and back up over its cycle. */
function Candle({ index }: PieceProps) {
  return (
    <svg
      className="scenery__piece scenery__candle"
      style={place(index, 5)}
      width="44"
      height="132"
      viewBox="0 0 44 132"
      aria-hidden="true"
    >
      <ellipse cx="22" cy="34" rx="9" ry="13" className="fill-accent scenery__flame" />
      <ellipse cx="22" cy="38" rx="4" ry="6" className="fill-extra" />
      <rect x="21" y="46" width="2" height="8" className="fill-outline" />
      <rect x="12" y="54" width="20" height="70" rx="4" className="fill-wax" />
      <rect x="12" y="54" width="7" height="70" className="fill-highlight" />
      <ellipse cx="22" cy="124" rx="13" ry="4" className="fill-outline" />
    </svg>
  );
}

/** Embers, rising and fading. Solid dots, no glow. */
function Embers({ index }: PieceProps) {
  return (
    <svg
      className="scenery__piece scenery__ember"
      style={place(index, 6)}
      width="7"
      height="7"
      viewBox="0 0 10 10"
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="4" className="fill-accent" />
    </svg>
  );
}

/** An old key, turning slowly as it drifts. */
function Key({ index }: PieceProps) {
  return (
    <svg
      className="scenery__piece scenery__key"
      style={place(index, 2)}
      width="48"
      height="18"
      viewBox="0 0 70 26"
      aria-hidden="true"
    >
      <circle cx="13" cy="13" r="11" className="fill-extra" />
      <circle cx="13" cy="13" r="5" className="fill-void" />
      <rect x="22" y="10" width="44" height="6" className="fill-extra" />
      <rect x="52" y="16" width="5" height="8" className="fill-extra" />
      <rect x="62" y="16" width="5" height="8" className="fill-extra" />
    </svg>
  );
}

/* ── Atlas ────────────────────────────────────────────────────────────── */

/** A range of peaks along the foot of the screen. Static, and the horizon. */
function Peaks({ index }: PieceProps) {
  const tall = index % 2 === 0;
  return (
    <svg
      className="scenery__piece scenery__peak"
      style={
        {
          left: `${index * 22 - 8}%`,
          "--piece-delay": `${-index * 3.1}s`,
          "--piece-jitter": "1",
        } as CSSProperties
      }
      width="360"
      height={tall ? 240 : 180}
      viewBox="0 0 360 240"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon points="180,10 360,240 0,240" className="fill-support" />
      <polygon points="180,10 240,86 180,120 120,86" className="fill-highlight" />
    </svg>
  );
}

/** Flat-bottomed clouds, crossing sideways. */
function Cloud({ index }: PieceProps) {
  return (
    <svg
      className="scenery__piece scenery__cloud"
      style={place(index, 4)}
      width="150"
      height="54"
      viewBox="0 0 150 54"
      aria-hidden="true"
    >
      <circle cx="42" cy="30" r="22" className="fill-extra" />
      <circle cx="76" cy="24" r="26" className="fill-extra" />
      <circle cx="110" cy="32" r="19" className="fill-extra" />
      <rect x="30" y="32" width="94" height="20" rx="10" className="fill-extra" />
    </svg>
  );
}

/** A paper plane on a long crossing. */
function Plane({ index }: PieceProps) {
  return (
    <svg
      className="scenery__piece scenery__plane"
      style={place(index, 2)}
      width="54"
      height="40"
      viewBox="0 0 54 40"
      aria-hidden="true"
    >
      <polygon points="2,20 52,2 30,20" className="fill-accent" />
      <polygon points="2,20 52,2 30,38" className="fill-highlight" />
    </svg>
  );
}

/**
 * One renderer per member of the union.
 *
 * A `Record` over `SceneryId` rather than a lookup with a fallback, so a name
 * added to the vocabulary in `packages/core` will not compile until something
 * here draws it — the same guarantee `PUZZLES` gives puzzle kinds.
 */
export const SCENERY: Record<SceneryId, { Piece: ComponentType<PieceProps>; count: number }> = {
  candles: { Piece: Candle, count: 5 },
  embers: { Piece: Embers, count: 6 },
  keys: { Piece: Key, count: 2 },
  peaks: { Piece: Peaks, count: 5 },
  clouds: { Piece: Cloud, count: 4 },
  planes: { Piece: Plane, count: 2 },
};
