import type { IRNGService } from './IRNGService';
import type { RNG } from '@/engine/narrative/types';

/**
 * Adapter to convert IRNGService to a simple RNG function.
 */
export function rngFromService(service: IRNGService): RNG {
  return () => service.next();
}

/**
 * Normalizes an RNG input that may be either an IRNGService or a plain RNG function.
 */
export function normalizeRng(rng: IRNGService | RNG): RNG {
  if (typeof rng === 'function') return rng;
  return rngFromService(rng);
}
