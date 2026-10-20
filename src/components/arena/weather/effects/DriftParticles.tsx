import type { CSSProperties, ReactElement } from 'react';
import { driftParticleStyle } from './particles';

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
 */
export function DriftParticles({
  count,
  keyPrefix = 'p-',
  particleClassName,
  position,
  tx,
  ty,
  durationS,
  delayS,
}: DriftParticlesProps): ReactElement[] {
  return Array.from({ length: count }).map((_, i) => (
    <div
      key={`${keyPrefix}${i}`}
      className={particleClassName}
      style={{
        ...position?.(i),
        ...driftParticleStyle(tx(), ty(), { delayS, durationS }),
      }}
    />
  ));
}
