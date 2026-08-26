interface SigilProps {
  size?: number;
  /** Thinner at large sizes, so the mark stays engraved rather than drawn. */
  weight?: number;
  /**
   * `seal` drops the rays and the inner pupil.
   *
   * The full mark turns to mush below about 20px; the seal is what survives
   * being stamped small, which is the same reason real crests have a simple
   * form for the coin and an elaborate one for the banner.
   */
  detail?: "full" | "seal";
  className?: string;
}

/**
 * The mark: a curio under glass.
 *
 * A pointed arch for the cabinet, a specimen held at its centre, light coming
 * off it, and a plinth to stand the whole thing on. Struck as a seal rather
 * than drawn as a picture — symmetrical, hairline, and severe, the way a
 * crest stamped into a page is severe.
 *
 * Everything is stroked in `currentColor`, so the mark takes whichever
 * pack's world it finds itself in.
 */
export function Sigil({ size = 64, weight = 1.4, detail = "full", className }: SigilProps) {
  const rays = Array.from({ length: 8 }, (_, index) => {
    const angle = (index * Math.PI) / 4;
    const inner = 11.5;
    const outer = index % 2 === 0 ? 15.5 : 14;
    return {
      x1: 32 + Math.cos(angle) * inner,
      y1: 29 + Math.sin(angle) * inner,
      x2: 32 + Math.cos(angle) * outer,
      y2: 29 + Math.sin(angle) * outer,
    };
  });

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Curio"
    >
      {/* The cabinet: a pointed arch on a plinth. */}
      <path d="M16 52V29c0-12 7-20 16-23 9 3 16 11 16 23v23" />
      <path d="M11 52h42" />
      {detail === "full" ? <path d="M14 57h36" opacity="0.55" /> : null}

      {/* The specimen, held at the centre. */}
      <circle cx="32" cy="29" r="8.5" />

      {detail === "full" ? (
        <>
          <circle cx="32" cy="29" r="3" opacity="0.65" />

          {/* Light coming off it. */}
          <g opacity="0.7">
            {rays.map((ray, index) => (
              <line key={index} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} />
            ))}
          </g>

          {/* Two marks on the plinth, the way a crest is always flanked. */}
          <circle cx="20" cy="47" r="1.1" fill="currentColor" stroke="none" opacity="0.7" />
          <circle cx="44" cy="47" r="1.1" fill="currentColor" stroke="none" opacity="0.7" />
        </>
      ) : null}
    </svg>
  );
}
