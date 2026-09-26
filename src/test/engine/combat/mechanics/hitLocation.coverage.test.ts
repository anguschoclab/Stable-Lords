import { describe, it, expect, vi } from 'vitest';
import * as hitLocationModule from '@/engine/combat/mechanics/hitLocation';

const { rollHitLocation, HIT_LOCATIONS, protectCovers } = hitLocationModule;

describe('hitLocation coverage edge cases', () => {
  it('covers the exposed branch and returns an exposed location', () => {
    let rngCallCount = 0;
    const rng = () => {
      rngCallCount++;
      if (rngCallCount === 1) return 0.2;
      return 0;
    };

    const location = rollHitLocation(rng, 'Any', 'Body');
    expect(location).toBe('head');
  });

  it('covers the fallback branch when exposed.length is 0 (all covered?)', () => {
    let rngCallCount = 0;
    const rng = () => {
      rngCallCount++;
      if (rngCallCount === 1) return 0.5;
      return 0.99;
    };
    const location = rollHitLocation(rng, 'Any', 'Body');
    expect(location).toBe(HIT_LOCATIONS[HIT_LOCATIONS.length - 1]);
  });

  it('covers the undefined pick fallback (pick ?? "chest")', () => {
    let rngCallCount = 0;
    const rng = () => {
      rngCallCount++;
      if (rngCallCount === 1) return 0.5;
      return 1;
    };
    const location = rollHitLocation(rng, 'Any', 'Body');
    expect(location).toBe('chest');
  });

  it('covers the undefined exposed pick fallback', () => {
    let rngCallCount = 0;
    const rng = () => {
      rngCallCount++;
      if (rngCallCount === 1) return 0.2;
      if (rngCallCount === 2) return 1;
      return 0.5;
    };
    const location = rollHitLocation(rng, 'Any', 'Body');
    expect(location).toBe(HIT_LOCATIONS[Math.floor(0.5 * HIT_LOCATIONS.length)]);
  });

  it('handles targeted attack branch successfully', () => {
    let rngCallCount = 0;
    const rng = () => {
      rngCallCount++;
      return 0.1; // Succeeds the TARGET_HIT_CHANCE check
    };
    const location = rollHitLocation(rng, 'Head', 'None');
    expect(location).toBe('head');
  });

  it('handles targeted attack branch failing chance', () => {
    let rngCallCount = 0;
    const rng = () => {
      rngCallCount++;
      if (rngCallCount === 1) return 0.99; // Fails TARGET_HIT_CHANCE check
      if (rngCallCount === 2) return 0.5; // Fails exposed check
      return 0; // Pick first location
    };
    const location = rollHitLocation(rng, 'Head', 'None');
    expect(location).toBe(HIT_LOCATIONS[0]);
  });

  it('handles target attack missing due to protect', () => {
    let rngCallCount = 0;
    const rng = () => {
      rngCallCount++;
      if (rngCallCount === 1) return 0.99; // Fails TARGET_MISS_CHANCE
      if (rngCallCount === 2) return 0.5;
      return 0;
    };
    const location = rollHitLocation(rng, 'Head', 'Head');
    expect(location).toBe(HIT_LOCATIONS[0]);
  });

  it('handles non-existent target string by falling through', () => {
    let rngCallCount = 0;
    const rng = () => {
      rngCallCount++;
      if (rngCallCount === 1) return 0.5;
      return 0;
    };
    const location = rollHitLocation(rng, 'NonExistent', 'None');
    expect(location).toBe(HIT_LOCATIONS[0]);
  });

  it('handles exposed.length === 0 via mocked spy on protectCovers', () => {
    vi.spyOn(hitLocationModule, 'protectCovers').mockReturnValue([...HIT_LOCATIONS]);

    let rngCallCount = 0;
    const rng = () => {
      rngCallCount++;
      if (rngCallCount === 1) return 0.2; // triggers exposed check
      return 0; // fallback pick
    };

    const location = rollHitLocation(rng, 'Any', 'Everything');
    expect(location).toBe(HIT_LOCATIONS[0]);
    vi.restoreAllMocks();
  });
});

describe('protectCovers extra coverage', () => {
  it('handles empty string properly', () => {
    expect(protectCovers('')).toEqual([]);
  });

  it('handles "Any"', () => {
    expect(protectCovers('Any')).toEqual([]);
  });

  it('handles "none_armor"', () => {
    expect(protectCovers('none_armor')).toEqual([]);
  });

  it('handles "none_helm"', () => {
    expect(protectCovers('none_helm')).toEqual([]);
  });

  it('covers leather', () => {
    expect(protectCovers('leather')).toEqual(['chest', 'abdomen']);
  });
  it('covers padded', () => {
    expect(protectCovers('padded')).toEqual(['chest', 'abdomen']);
  });
  it('covers studded_leather', () => {
    expect(protectCovers('studded_leather')).toEqual(['chest', 'abdomen']);
  });
  it('covers armor', () => {
    expect(protectCovers('plate_armor')).toEqual(['chest', 'abdomen']);
  });
  it('covers mail', () => {
    expect(protectCovers('chain_mail')).toEqual(['chest', 'abdomen']);
  });
  it('covers arms', () => {
    expect(protectCovers('arms')).toEqual(['right arm', 'left arm']);
  });
  it('covers legs', () => {
    expect(protectCovers('legs')).toEqual(['right leg', 'left leg']);
  });
  it('covers fallback unknown string', () => {
    expect(protectCovers('bizarre_unknown_string')).toEqual([]);
  });
});
