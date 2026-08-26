import { useEffect, useState } from "react";

interface TimerProps {
  /** Server-clock deadline, already corrected for drift. Null means no timer. */
  endsAt: number | null;
  /** The full window, so the bar knows what fraction is left. */
  totalMs: number | null;
  now(): number;
}

/**
 * Counts down against the server's clock rather than the browser's.
 *
 * `now()` comes from the session, which tracks the offset between this
 * device and the server. Without that, two phones with clocks a few seconds
 * apart would show different times remaining on the same question.
 */
export function Timer({ endsAt, totalMs, now }: TimerProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (endsAt == null) return;
    const id = window.setInterval(() => tick((n) => n + 1), 200);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (endsAt == null || !totalMs) return null;

  const remaining = Math.max(0, endsAt - now());
  const fraction = Math.max(0, Math.min(1, remaining / totalMs));
  const seconds = Math.ceil(remaining / 1000);
  const urgent = fraction < 0.28;

  return (
    <div className="stack-s">
      <div className="between">
        <span className="eyebrow">Time</span>
        <span className={`timer-count${urgent ? " urgent" : ""}`}>{seconds}s</span>
      </div>
      <div className="timer-bar">
        <div
          className={`fill${urgent ? " urgent" : ""}`}
          style={{ width: `${fraction * 100}%` }}
          role="progressbar"
          aria-valuenow={seconds}
          aria-valuemin={0}
          aria-valuemax={Math.round(totalMs / 1000)}
          aria-label="Time remaining"
        />
      </div>
    </div>
  );
}
