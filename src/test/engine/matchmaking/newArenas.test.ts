import { describe, it, expect } from 'vitest';
import { getArenaById } from '@/data/arenas';
import { generatePromoters } from '@/engine/promoters/promoterGenerator';

describe('New Arenas System Integration', () => {
  it('should successfully register and retrieve GLACIAL_RIFT, SKY_PLATFORM, and MISTY_VALLEY', () => {
    const glacialRift = getArenaById('glacial_rift');
    const skyPlatform = getArenaById('sky_platform');
    const mistyValley = getArenaById('misty_valley');

    expect(glacialRift.id).toBe('glacial_rift');
    expect(skyPlatform.id).toBe('sky_platform');
    expect(mistyValley.id).toBe('misty_valley');
    expect(glacialRift.tier).toBe(2);
    expect(skyPlatform.tier).toBe(3);
    expect(mistyValley.tier).toBe(1);
  });

  it('promoters should be able to generate offers in the new arenas', () => {
    // Generate promoters. Tier 2 and 3 promoters should have the new arenas in their pool.
    const promoters = generatePromoters(100, 12345);
    let foundGlacial = false;
    let foundSky = false;
    let foundMisty = false;

    promoters.forEach(p => {
      if (p.arenaPool?.includes('glacial_rift')) foundGlacial = true;
      if (p.arenaPool?.includes('sky_platform')) foundSky = true;
      if (p.arenaPool?.includes('misty_valley')) foundMisty = true;
    });

    expect(foundGlacial).toBe(true);
    expect(foundSky).toBe(true);
    expect(foundMisty).toBe(true);
  });
});
