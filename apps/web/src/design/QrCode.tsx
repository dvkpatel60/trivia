import { useMemo } from "react";
import qr from "qrcode-generator";

interface QrCodeProps {
  value: string;
  /** Announced to screen readers, which can't scan anything. */
  label: string;
}

/**
 * The join link as a square.
 *
 * At a party in one room, nobody should be typing `NIFFLER-42` into a phone.
 * Rendered as an inline SVG path so it inherits the pack's ink colour and
 * costs no network request.
 */
export function QrCode({ value, label }: QrCodeProps) {
  const path = useMemo(() => {
    // Type 0 lets the library pick the smallest version that fits; medium
    // error correction survives a phone camera at an angle in dim light.
    const code = qr(0, "M");
    code.addData(value);
    code.make();

    const count = code.getModuleCount();
    const parts: string[] = [];
    for (let row = 0; row < count; row++) {
      for (let column = 0; column < count; column++) {
        if (code.isDark(row, column)) parts.push(`M${column} ${row}h1v1h-1z`);
      }
    }
    return { d: parts.join(""), count };
  }, [value]);

  return (
    <svg
      className="qr"
      viewBox={`-1 -1 ${path.count + 2} ${path.count + 2}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <path d={path.d} fill="var(--surface-0)" />
    </svg>
  );
}
