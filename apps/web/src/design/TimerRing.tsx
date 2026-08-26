import { useEffect, useState, type CSSProperties } from "react";

import { PackTimerIcon } from "./PackArtifacts.js";

interface TimerRingProps {
  /** Deadline on the corrected server clock, or null when untimed. */
  endsAt: number | null;
  totalMs: number | null;
  now(): number;
}

/** Digits appear only for the last stretch; before that the ring is enough. */
const COUNT_FROM_MS = 5_000;

/**
 * The countdown.
 *
 * The drain is a single CSS animation offset by the elapsed time, so it runs
 * on the compositor and stays locked to the server's deadline — React renders
 * this once per question rather than five times a second. Only the last few
 * seconds put a number on screen, and only then does anything re-render.
 */
export function TimerRing({ endsAt, totalMs, now }: TimerRingProps) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    setSeconds(null);
    if (endsAt == null) return;

    let interval: number | undefined;
    const begin = () => {
      interval = window.setInterval(() => {
        const left = Math.max(0, endsAt - now());
        setSeconds(Math.ceil(left / 1000));
        if (left <= 0) window.clearInterval(interval);
      }, 200);
    };

    const untilCountdown = endsAt - now() - COUNT_FROM_MS;
    const start = window.setTimeout(begin, Math.max(0, untilCountdown));

    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [endsAt, now]);

  if (endsAt == null || !totalMs) {
    return (
      <span className="ring" aria-hidden="true">
        <PackTimerIcon size={14} className="ring__icon" />
      </span>
    );
  }

  const elapsed = Math.max(0, totalMs - (endsAt - now()));
  const urgent = seconds != null;

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
        } as CSSProperties
      }
    >
      <PackTimerIcon size={14} className="ring__icon" />
      {seconds != null ? <span className="ring__count">{seconds}</span> : null}
    </span>
  );
}
