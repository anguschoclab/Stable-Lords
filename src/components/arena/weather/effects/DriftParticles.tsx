import type { CSSProperties, ReactElement } from 'react';
import { driftParticleStyle } from './particles';

/** Drift-vector + timing bundle for {@link DriftParticles}. */
interface DriftSpec {
  /** Per-particle horizontal drift in px (evaluated per particle). */
  tx: () => number;
  /** Per-particle vertical drift in px (evaluated per particle). */
  ty: () => number;
  /** Randomized duration window — forwarded to `driftParticleStyle`. */
  durationS?: { base: number; range: number };
  /** Max random animation delay in seconds — forwarded to `driftParticleStyle`. */
  delayS?: number;
}

/** Props for {@link DriftParticles}. */
interface DriftParticlesProps {
  /** Number of particles to render. */
  count: number;
  /** Key prefix for the particle elements (default 'p-'). */
  keyPrefix?: string;
  /** Full className applied to each particle div. */
  particleClassName: string;
  /** Per-particle base style (positioning, size, color) merged before the drift vector. */
  position?: (index: number) => CSSProperties;
  /** Drift vector + timing — mirrors `driftParticleStyle(tx, ty, opts)`. */
  drift: DriftSpec;
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
  drift,
}: DriftParticlesProps): ReactElement[] {
  return Array.from({ length: count }).map((_, i) => (
    <div
      key={`${keyPrefix}${i}`}
      className={particleClassName}
      style={{
        ...position?.(i),
        ...driftParticleStyle(drift.tx(), drift.ty(), {
          delayS: drift.delayS,
          durationS: drift.durationS,
        }),
      }}
    />
  ));
}
