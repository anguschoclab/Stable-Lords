import { IRNGContext } from './IRNGContext';
import { IRNGService } from './IRNGService';
import { SeededRNGService } from '@/utils/random';

/**
 * RNG Context Implementation
 * Manages RNG instances with a base seed and supports child contexts.
 */
export class RNGContext implements IRNGContext {
  /**
   * Constructor.
   * @param baseSeed - Base seed.
   */
  constructor(private baseSeed: number) {}

  /**
   * Get rng.
   * @param seed - Seed. (optional)
   * @returns The result.
   */
  getRNG(seed?: number): IRNGService {
    return new SeededRNGService(seed ?? this.baseSeed);
  }

  /**
   * Create child.
   * @param seedOffset - Seed offset.
   * @returns The result.
   */
  createChild(seedOffset: number): IRNGContext {
    return new RNGContext(this.baseSeed + seedOffset);
  }

  /**
   * Get base seed.
   * @returns The result.
   */
  getBaseSeed(): number {
    return this.baseSeed;
  }
}
