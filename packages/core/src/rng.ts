/**
 * Seeded randomness.
 *
 * Question generation runs on the server and has to be reproducible for tests
 * and debuggable when a game goes wrong, so nothing in the engine calls
 * `Math.random` directly. Callers that genuinely want fresh randomness pass
 * `randomSeed()`.
 */

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, max). */
  int(max: number): number;
  /** A new array, shuffled. Never mutates the input. */
  shuffle<T>(items: readonly T[]): T[];
  /** One element, or undefined for an empty array. */
  pick<T>(items: readonly T[]): T | undefined;
}

/** mulberry32: small, fast, and good enough for shuffling trivia. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (max: number): number => (max <= 0 ? 0 : Math.floor(next() * max));

  const shuffle = <T,>(items: readonly T[]): T[] => {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1);
      const a = out[i] as T;
      const b = out[j] as T;
      out[i] = b;
      out[j] = a;
    }
    return out;
  };

  const pick = <T,>(items: readonly T[]): T | undefined =>
    items.length === 0 ? undefined : items[int(items.length)];

  return { next, int, shuffle, pick };
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

/**
 * Shuffle that is guaranteed to differ from the input when a different
 * arrangement exists. Unscramble and sequence puzzles are unplayable if the
 * shuffle happens to land on the original order.
 */
export function derange<T>(items: readonly T[], rng: Rng, same: (a: T, b: T) => boolean): T[] {
  if (items.length < 2) return items.slice();
  const allIdentical = items.every((item) => same(item, items[0] as T));
  if (allIdentical) return items.slice();

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = rng.shuffle(items);
    if (candidate.some((item, i) => !same(item, items[i] as T))) return candidate;
  }
  return items.slice().reverse();
}

/**
 * A seed derived from a game code and round number.
 *
 * Question generation has to be reproducible across servers: any request can
 * be the one that advances a game into its next round, and two of them racing
 * must not deal two different sets of questions. Seeding from the game's own
 * identity makes the deal a pure function of (code, round).
 */
export function seedFor(code: string, round: number): number {
  let hash = 2166136261;
  const input = `${code}#${round}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
