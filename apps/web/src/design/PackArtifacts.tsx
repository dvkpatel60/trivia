import { useEffect, useState } from "react";

type PackId = "hogwarts" | "atlas" | string;

/**
 * Read the current pack from the root element, set by applyPack().
 *
 * Stays in sync because applyPack() writes dataset.pack on every pack switch.
 */
export function usePack(): PackId {
  const [pack, setPack] = useState<PackId>(
    () => document.documentElement.dataset.pack ?? "hogwarts",
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setPack(document.documentElement.dataset.pack ?? "hogwarts");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-pack"],
    });
    return () => observer.disconnect();
  }, []);

  return pack;
}

/* ── Hourglass (Hogwarts) ─────────────────────────────────────── */

export function Hourglass({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Time"
    >
      <path d="M5 3h14" />
      <path d="M19 3v4a2 2 0 0 1-1 1.73l-5 4.27a2 2 0 0 1-2 0L6 8.73A2 2 0 0 1 5 7V3" />
      <path d="M5 21v-4a2 2 0 0 1 1-1.73l5-4.27a2 2 0 0 1 2 0l5 4.27A2 2 0 0 1 19 17v4" />
      <path d="M5 21h14" />
    </svg>
  );
}

/* ── Compass (Atlas) ──────────────────────────────────────────── */

export function Compass({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Time"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" opacity={0.25} stroke="none" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" />
    </svg>
  );
}

/* ── Coin (Hogwarts) ──────────────────────────────────────────── */

export function Coin({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      role="img"
      aria-label="Points"
    >
      <circle cx="10" cy="10" r="8.5" />
      <circle cx="10" cy="10" r="5.5" opacity={0.4} />
      <text
        x="10"
        y="14"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        fontFamily="var(--display)"
      >
        P
      </text>
    </svg>
  );
}

/* ── Waypoint (Atlas) ─────────────────────────────────────────── */

export function Waypoint({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Points"
    >
      <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.3L10 14.5 5.1 17l.9-5.3-4-3.9 5.5-.8z" />
    </svg>
  );
}

/* ── Candle progress (Hogwarts) ───────────────────────────────── */

export function CandleProgress({
  total,
  done,
  size = 10,
  className,
}: {
  total: number;
  done: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`candle-row ${className ?? ""}`} aria-label={`${done} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size * 1.6}
          viewBox="0 0 10 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeLinecap="round"
          className="candle"
          data-lit={i < done}
        >
          {/* flame */}
          <path
            d="M5 1.5c1.2 1.5 2 2.8 0 4.5-2-1.7-.8-3 0-4.5z"
            fill={i < done ? "var(--accent)" : "none"}
            opacity={i < done ? 0.9 : 0.2}
          />
          {/* wick */}
          <line x1="5" y1="5.5" x2="5" y2="7" opacity={0.5} />
          {/* wax body */}
          <rect x="3" y="7" width="4" height="7.5" rx="1" opacity={i < done ? 0.7 : 0.15} />
          {/* base */}
          <line x1="2" y1="14.5" x2="8" y2="14.5" opacity={0.3} />
        </svg>
      ))}
    </span>
  );
}

/* ── Path progress (Atlas) ────────────────────────────────────── */

export function PathProgress({
  total,
  done,
  size = 10,
  className,
}: {
  total: number;
  done: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`path-row ${className ?? ""}`} aria-label={`${done} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          className="waypoint-dot"
          data-reached={i < done}
        >
          <circle cx="6" cy="6" r="4" fill={i < done ? "var(--accent)" : "none"} opacity={i < done ? 0.8 : 0.2} />
          {i < total - 1 ? (
            <line x1="10" y1="6" x2="12" y2="6" opacity={0.25} />
          ) : null}
        </svg>
      ))}
    </span>
  );
}

/* ── Sorting hat (Hogwarts leader) ────────────────────────────── */

export function SortingHat({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Leading"
    >
      {/* brim */}
      <ellipse cx="12" cy="19" rx="10" ry="3" opacity={0.5} />
      {/* cone body */}
      <path d="M6 18c0-6 3-11 6-14 3 3 6 8 6 14" />
      {/* fold/crease */}
      <path d="M9 15c1.5-1 4.5-1 6 0" opacity={0.5} />
      {/* tip curl */}
      <path d="M12 4c-1-2 1-3 2-2" opacity={0.6} />
    </svg>
  );
}

/* ── Star (Atlas leader) ──────────────────────────────────────── */

export function Star({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Leading"
    >
      <path d="M12 2l2.9 6.3 6.9.9-5 4.7 1.2 6.8L12 17l-6 3.7 1.2-6.8-5-4.7 6.9-.9z" />
    </svg>
  );
}

/* ── Podium vessels ───────────────────────────────────────────────────── */

/**
 * What a player's final score stands up as.
 *
 * The podium used to be three bars at hardcoded heights, ordered by rank —
 * so a runaway win and a one-point squeak drew the same picture. These are
 * sized from the score itself, and they are the pack's own object rather
 * than a histogram column.
 */

/** Candlelight: a candle, burnt down as far as the score is short. */
export function CandleVessel({ lead }: { lead: boolean }) {
  return (
    <span className="vessel vessel--candle" data-lead={lead}>
      <svg className="vessel__flame" viewBox="0 0 16 24" width="15" height="22" aria-hidden="true">
        <ellipse cx="8" cy="13" rx="5" ry="9" fill="var(--accent)" />
        <ellipse cx="8" cy="16" rx="2" ry="4.5" fill="var(--on-accent)" opacity="0.45" />
      </svg>
      <span className="vessel__wick" />
      <span className="vessel__body">
        <span className="vessel__face" />
      </span>
    </span>
  );
}

/** Atlas: a peak, as high as the score reached. */
export function PeakVessel({ lead }: { lead: boolean }) {
  return (
    <span className="vessel vessel--peak" data-lead={lead}>
      <svg className="vessel__flag" viewBox="0 0 22 26" width="20" height="24" aria-hidden="true">
        <rect x="9" y="2" width="2" height="24" fill="var(--outline)" />
        <polygon points="11,3 22,8 11,13" fill="var(--accent)" />
      </svg>
      <svg
        className="vessel__body"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon points="50,0 100,100 0,100" fill="var(--support)" />
        <polygon points="50,0 72,44 50,58 28,44" fill="var(--extra)" opacity="0.5" />
      </svg>
    </span>
  );
}

export function PackVessel({ lead }: { lead: boolean }) {
  const pack = usePack();
  return pack === "atlas" ? <PeakVessel lead={lead} /> : <CandleVessel lead={lead} />;
}

/* ── Convenience: themed pack-aware components ────────────────── */

export function PackTimerIcon({ size, className }: { size?: number; className?: string }) {
  const pack = usePack();
  return pack === "atlas" ? (
    <Compass size={size} className={className} />
  ) : (
    <Hourglass size={size} className={className} />
  );
}

export function PackScoreIcon({ size, className }: { size?: number; className?: string }) {
  const pack = usePack();
  return pack === "atlas" ? (
    <Waypoint size={size} className={className} />
  ) : (
    <Coin size={size} className={className} />
  );
}

export function PackLeaderIcon({ size, className }: { size?: number; className?: string }) {
  const pack = usePack();
  return pack === "atlas" ? (
    <Star size={size} className={className} />
  ) : (
    <SortingHat size={size} className={className} />
  );
}

export function PackProgress({
  total,
  done,
  size,
  className,
}: {
  total: number;
  done: number;
  size?: number;
  className?: string;
}) {
  const pack = usePack();
  return pack === "atlas" ? (
    <PathProgress total={total} done={done} size={size} className={className} />
  ) : (
    <CandleProgress total={total} done={done} size={size} className={className} />
  );
}
