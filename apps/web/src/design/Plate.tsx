import type { MediaRef } from "@curio/core";

interface PlateProps {
  media: MediaRef;
  /** Rendered instead of the image when the file isn't there yet. */
  fallback?: React.ReactNode;
  onMissing?(): void;
  /** Larger treatment for the puzzle screen; compact for the library grid. */
  size?: "full" | "thumb";
}

/**
 * The frame every generated picture sits in.
 *
 * A text-to-image model will not reliably return a consistent size, a
 * consistent background, or anything like a rounded corner — so none of that
 * is asked of it. The model supplies a subject; this supplies the identical
 * frame around it: one aspect ratio, one radius, one ground built from the
 * pack's own palette, and a vignette that lands on every edge the same way.
 *
 * That is the difference between a picture round that looks designed and one
 * that looks like a folder of downloads. What varies between images is then
 * only what is *in* them.
 */
export function Plate({ media, fallback, onMissing, size = "full" }: PlateProps) {
  return (
    <div className="plate-frame" data-size={size}>
      {fallback ?? (
        <img
          className="plate-frame__image"
          src={media.src}
          alt={media.alt}
          loading="lazy"
          decoding="async"
          onError={onMissing}
        />
      )}
      <span className="plate-frame__glaze" aria-hidden="true" />
    </div>
  );
}
