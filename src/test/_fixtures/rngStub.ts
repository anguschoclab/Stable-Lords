import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Scripted rng — every `next()` draw returns the same value, so draw-order
 * differences between two paths can't be masked by the stub. Use `0.0` to make
 * every probability check succeed (gains + injury rolls land) and `0.99` to
 * make them all miss.
 */
export const scriptRng = (nextVal: number): IRNGService =>
  ({
    next: () => nextVal,
    pick: <T>(arr: T[]): T => arr[0]!,
    roll: () => 1,
    uuid: (p?: string) => (p ? `${p}-u` : 'u'),
    shuffle: <T>(arr: T[]): T[] => arr,
    chance: (p: number) => nextVal < p,
  }) as unknown as IRNGService;
