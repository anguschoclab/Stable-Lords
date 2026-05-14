import { SeededRNG } from '@/utils/random';
import { IRNGService } from './IRNGService';

/**
 * SeededRNG Service Implementation
 * Wraps the existing SeededRNG class to implement the IRNGService interface.
 * This enables dependency injection while maintaining deterministic behavior.
 */
export class SeededRNGService implements IRNGService {
  private rng: SeededRNG;

  constructor(seed: number) {
    this.rng = new SeededRNG(seed);
  }

  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive).
   * @returns A random number
   */
  next(): number {
    return this.rng.next();
  }

  /**
   * Picks a random element from an array.
   * @param array - The array to pick from
   * @returns A random element from the array
   */
  pick<T>(array: T[]): T {
    return this.rng.pick(array);
  }

  /**
   * Generates a unique ID with an optional prefix.
   * @param prefix - Optional prefix for the ID
   * @returns A unique string ID
   */
  uuid(prefix?: string): string {
    return this.rng.uuid(prefix);
  }

  /**
   * Returns a random integer between min (inclusive) and max (exclusive).
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns A random integer
   */
  roll(min: number, max: number): number {
    return this.rng.roll(min, max);
  }

  /**
   * Shuffles an array in place and returns it.
   * @param array - The array to shuffle
   * @returns The shuffled array
   */
  shuffle<T>(array: T[]): T[] {
    return this.rng.shuffle(array);
  }

  /**
   * Weighted random selection from items array.
   * @param items - Array of items to pick from
   * @param weights - Array of weights corresponding to items
   * @returns The selected item
   */
  pickWeighted<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
      throw new Error('Items and weights must have same length');
    }
    if (items.length === 0) throw new Error('Cannot pick from empty array');
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = this.rng.next() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      const weight = weights[i];
      if (weight === undefined) {
        throw new Error('Weight index out of bounds');
      }
      random -= weight;
      if (random <= 0) {
        const item = items[i];
        if (item === undefined) {
          throw new Error('Item index out of bounds');
        }
        return item;
      }
    }
    const fallback = items[items.length - 1];
    if (fallback === undefined) {
      throw new Error('No items available for weighted pick');
    }
    return fallback;
  }

  /**
   * Returns true with given probability (0-1).
   * @param probability - Chance of returning true (0.0 to 1.0)
   * @returns True if the roll succeeds
   */
  chance(probability: number): boolean {
    return this.rng.next() < probability;
  }
}
