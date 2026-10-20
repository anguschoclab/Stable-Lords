import type { CSSProperties } from 'react';

/** Props for {@link DriftParticles}. */
export interface DriftParticlesProps {
  /** Number of particles to render. */
  count: number;
  /** Key prefix for the particle elements (default 'p-'). */
  keyPrefix?: string;
  /** Full className applied to each particle div. */
  particleClassName: string;
  /** Per-particle base style (positioning, size, color) merged before the drift vector. */
  position?: (index: number) => CSSProperties;
  /** Per-particle horizontal drift in px (evaluated per particle). */
  tx: () => number;
  /** Per-particle vertical drift in px (evaluated per particle). */
  ty: () => number;
  /** Randomized duration window — forwarded to `driftParticleStyle`. */
  durationS?: { base: number; range: number };
  /** Max random animation delay in seconds — forwarded to `driftParticleStyle`. */
  delayS?: number;
}

/**
 * Render `count` drifting particle divs — the shared `Array.from().map()` +
 * `driftParticleStyle` idiom duplicated across weather effects.
 * NOT IMPLEMENTED — signature stub for the test-first commit; replaced in the
 * weather-dedup commit.
 */
export function DriftParticles(_props: DriftParticlesProps): never {
  throw new Error('DriftParticles: not implemented');
}
