import type { IRNGService } from './IRNGService';

/**
 * Returns a random integer in the range [base, base + variance - 1].
 * This is a thin, deterministic wrapper around `rng.next()` used to eliminate
 * the repetitive `base + Math.floor(rng.next() * variance)` pattern.
 *
 * **Determinism contract:** each call consumes exactly one `rng.next()` in the
 * same order as the inline expression it replaces.
 */
export function rollRange(rng: IRNGService, base: number, variance: number): number {
  return base + Math.floor(rng.next() * variance);
}
