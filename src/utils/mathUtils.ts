/**
 * Clamps a number between a minimum and maximum value.
 */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Returns a deterministic, seeded pseudo-random number generator.
 */
export function seededRng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}
