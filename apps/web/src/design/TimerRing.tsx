import { useEffect, useState, type CSSProperties } from "react";

import { PackTimerIcon } from "./PackArtifacts.js";

interface TimerRingProps {
  /** Deadline on the corrected server clock, or null when untimed. */
  endsAt: number | null;
  totalMs: number | null;
  now(): number;
}

/** Circumference of the r=15.5 circle the ring draws, to 2dp. */
const CIRCUMFERENCE = 97.39;

/** Below this the ring turns to the warning colour and the digit swells. */
const URGENT_MS = 5_000;

/**
 * The countdown.
 *
 * The drain is one CSS animation on `stroke-dashoffset`, offset by the
 * elapsed time so it stays locked to the server's deadline. An SVG stroke
 * rather than the `conic-gradient` this used to be: a conic gradient aliases
 * along its sweep edge, and the hard-edged radial mask that turned it into a
 * ring stair-stepped the rim. A stroked circle is anti-aliased by the
 * rasteriser and costs the same.
 *
 * The number is on screen for the whole question rather than only the last
 * few seconds — players asked to see the count run down. It ticks once a
 * second, and only this leaf re-renders; the ring itself never does.
 */
export function TimerRing({ endsAt, totalMs, now }: TimerRingProps) {
  const [seconds, setSeconds] = useState<number | null>(() =>
    endsAt == null ? null : Math.max(0, Math.ceil((endsAt - now()) / 1000)),
  );

  useEffect(() => {
    if (endsAt == null) {
      setSeconds(null);
      return;
    }

    const read = () => Math.max(0, Math.ceil((endsAt - now()) / 1000));
    setSeconds(read());

    const interval = window.setInterval(() => {
      const left = read();
      setSeconds(left);
      if (left <= 0) window.clearInterval(interval);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [endsAt, now]);

  if (endsAt == null || !totalMs) {
    return (
      <span className="ring" aria-hidden="true">
        <PackTimerIcon size={14} className="ring__icon" />
      </span>
    );
  }

  const elapsed = Math.max(0, totalMs - (endsAt - now()));
  const urgent = endsAt - now() <= URGENT_MS;

  return (
    <span
      className="ring"
      data-urgent={urgent}
      role="timer"
      aria-label={seconds != null ? `${seconds} seconds left` : "Time remaining"}
      style={
        {
          "--ring-duration": `${totalMs}ms`,
          "--ring-delay": `-${elapsed}ms`,
          "--ring-length": `${CIRCUMFERENCE}`,
        } as CSSProperties
      }
    >
      <svg className="ring__dial" viewBox="0 0 36 36" aria-hidden="true">
        <circle className="ring__track" cx="18" cy="18" r="15.5" />
        <circle className="ring__drain" cx="18" cy="18" r="15.5" />
      </svg>
      <span className="ring__count num">{seconds ?? 0}</span>
    </span>
  );
}
