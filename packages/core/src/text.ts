/** Comparison helpers shared by the graders. */

/** Upper-case, letters only. Lets "Wingardium Leviosa" match "wingardiumleviosa". */
export function normalizeWord(value: string): string {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function plural(count: number, one: string, many = one + "s"): string {
  return count === 1 ? one : many;
}

/** "3 of 4 pairs correct." */
export function tally(right: number, total: number, noun: string): string {
  return `${right} of ${total} ${plural(total, noun)} correct.`;
}
