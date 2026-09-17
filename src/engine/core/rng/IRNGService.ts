/**
 * RNG Service Interface
 * Provides a contract for random number generation, enabling
 * dependency injection and testability.
 */
export interface IRNGService {
  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive).
   */
  next(): number;

  /**
   * Picks a random element from an array.
   */
  pick<T>(array: T[]): T;

  /**
   * Generates a unique ID with an optional prefix.
   */
  uuid(prefix?: string): string;

  /**
   * Returns a random integer between min (inclusive) and max (exclusive).
   */
  roll(min: number, max: number): number;

  /**
   * Shuffles an array in place and returns it.
   */
  shuffle<T>(array: T[]): T[];

  /**
   * Weighted random selection from items array.
   * @deprecated Use {@link rollWeighted} for string-keyed weight maps. `pickWeighted`
   * is retained for parallel-array selection of non-string items.
   */
  pickWeighted<T>(items: T[], weights: number[]): T;

  /**
   * Weighted random selection of a string key from a weight map.
   * Falls back to the first key if the total weight is zero.
   */
  rollWeighted<K extends string>(weights: Partial<Record<K, number>>): K;

  /**
   * Returns true with given probability (0-1).
   */
  chance(probability: number): boolean;
}
