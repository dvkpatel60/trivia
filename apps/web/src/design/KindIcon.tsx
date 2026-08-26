/** Small glyphs for the puzzle kinds, keyed by `PuzzleKind.icon`. */
const PATHS: Record<string, string> = {
  book: "M4 3h9a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4z",
  scale: "M12 3v18M5 8h14M7 8l-3 6h6zM17 8l-3 6h6z",
  wand: "M4 20 20 4M15 4h5v5",
  key: "M15 4a5 5 0 1 1-4.6 7L4 17.4 6.6 20l1.6-1.6",
  eye: "M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  owl: "M6 4a6 6 0 0 0-2 12v2a4 4 0 0 0 8 0 4 4 0 0 0 8 0v-2a6 6 0 0 0-2-12M8 10h.01M16 10h.01",
  hat: "M3 9 12 4l9 5-9 5z M7 11v5c0 1.7 2.2 3 5 3s5-1.3 5-3v-5",
  hourglass: "M7 3h10M7 21h10M8 3c0 5 8 5 8 18M16 3c0 5-8 5-8 18",
  frame: "M3 5h18v14H3z M3 15l5-5 4 4 3-3 6 6",
  grid: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
};

interface KindIconProps {
  icon: string;
  size?: number;
}

export function KindIcon({ icon, size = 18 }: KindIconProps) {
  const path = PATHS[icon];
  if (!path) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
