import { describe, it, expect, vi } from 'vitest';
import { generatePromoters } from '@/engine/promoters/promoterGenerator';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { FightingStyle } from '@/types/shared.types';

describe('Promoter Generator', () => {
  it('should generate the exact number of promoters requested', () => {
    const promoters = generatePromoters(10, 12345);
    expect(promoters).toHaveLength(10);
  });

  it('should be perfectly deterministic given the same seed', () => {
    const seed = 98765;
    const promotersA = generatePromoters(5, seed);
    const promotersB = generatePromoters(5, seed);
    expect(promotersA).toEqual(promotersB);
  });

  it('should generate different outputs for different seeds', () => {
    const promotersA = generatePromoters(5, 111);
    const promotersB = generatePromoters(5, 222);
    expect(promotersA).not.toEqual(promotersB);
  });

  it('should distribute tiers according to the predefined ratio array', () => {
    // Tiers array is 30 elements long: 15 Local, 8 Regional, 5 National, 2 Legendary
    const promoters = generatePromoters(30, 555);

    const { local, regional, national, legendary } = promoters.reduce(
      (acc, p) => {
        if (p.tier === 'Local') acc.local++;
        if (p.tier === 'Regional') acc.regional++;
        if (p.tier === 'National') acc.national++;
        if (p.tier === 'Legendary') acc.legendary++;
        return acc;
      },
      { local: 0, regional: 0, national: 0, legendary: 0 }
    );

    expect(local).toBe(15);
    expect(regional).toBe(8);
    expect(national).toBe(5);
    expect(legendary).toBe(2);
  });

  it('should generate valid promoter attributes', () => {
    const promoters = generatePromoters(5, 777);
    const validPersonalities = ['Greedy', 'Honorable', 'Sadistic', 'Flashy', 'Corporate'];

    for (const promoter of promoters) {
      // ID should be a string (uuid from seeded rng)
      expect(typeof promoter.id).toBe('string');
      expect(promoter.id.length).toBeGreaterThan(0);

      // Name should have a first and last name separated by space
      expect(typeof promoter.name).toBe('string');
      expect(promoter.name.split(' ')).toHaveLength(2);

      // Age should be between 35 and 65 inclusive
      expect(promoter.age).toBeGreaterThanOrEqual(35);
      expect(promoter.age).toBeLessThanOrEqual(65);

      // Personality should be one of the defined types
      expect(validPersonalities).toContain(promoter.personality);

      // Capacities are tied directly to tier
      if (promoter.tier === 'Legendary') expect(promoter.capacity).toBe(2);
      else if (promoter.tier === 'National') expect(promoter.capacity).toBe(4);
      else if (promoter.tier === 'Regional') expect(promoter.capacity).toBe(6);
      else if (promoter.tier === 'Local') expect(promoter.capacity).toBe(10);

      // Biases should contain exactly 2 unique fighting styles
      expect(promoter.biases).toHaveLength(2);
      expect(Object.values(FightingStyle)).toContain(promoter.biases[0]);
      expect(Object.values(FightingStyle)).toContain(promoter.biases[1]);
      expect(promoter.biases[0]).not.toBe(promoter.biases[1]);

      // History should be initialized with zeroes/empty arrays
      expect(promoter.history).toEqual({
        totalPursePaid: 0,
        notableBouts: [],
        legacyFame: 0,
      });
    }
  });

  it('should accept and use a custom provided RNG service', () => {
    const customRng = new SeededRNGService(999);
    const mockNext = vi.spyOn(customRng, 'next');

    // Generating 1 promoter involves multiple RNG calls
    generatePromoters(1, 0, customRng);

    // next() is called:
    // 1. uuid generation (usually multiple times)
    // 2. picking first name
    // 3. picking last name
    // 4. age generation
    // 5. picking personality
    // 6. shuffling styles for biases
    expect(mockNext).toHaveBeenCalled();
    mockNext.mockRestore();
  });
});
