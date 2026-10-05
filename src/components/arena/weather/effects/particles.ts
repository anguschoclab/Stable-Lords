/**
 * Shared style builder for drifting weather particles — every effect scatters
 * absolutely-positioned dots with `--tx`/`--ty` travel vectors and randomized
 * animation timing; this is the one place that cast lives.
 */
import type { CSSProperties } from 'react';
import { cryptoRandom } from '@/utils/cryptoRandom';

/** Timing knobs for {@link driftParticleStyle}. */
interface DriftParticleTiming {
  /** Max random animation delay in seconds (default 3). */
  delayS?: number;
  /** Randomized duration window in seconds — omit for no explicit duration. */
  durationS?: { base: number; range: number };
}

/**
 * Build the CSSProperties for one drifting particle: `--tx`/`--ty` pixel
 * vectors plus random `animationDelay` (and optional `animationDuration`).
 * The caller spreads this into a `style` object alongside positioning props.
 */
export function driftParticleStyle(
  tx: number,
  ty: number,
  timing: DriftParticleTiming = {}
): CSSProperties & Record<string, string> {
  const { delayS = 3, durationS } = timing;
  return {
    '--tx': `${tx}px`,
    '--ty': `${ty}px`,
    animationDelay: `${cryptoRandom() * delayS}s`,
    ...(durationS
      ? { animationDuration: `${durationS.base + cryptoRandom() * durationS.range}s` }
      : {}),
  } as CSSProperties & Record<string, string>;
}
