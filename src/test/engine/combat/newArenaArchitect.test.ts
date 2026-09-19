import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { getStyleWeatherModifier } from '@/constants/arena/arena';
import { getEligibleArenasForTournament } from '@/engine/matchmaking/tournament/tournamentArenaSelection';

describe('Arena Architect Verification', () => {
  it('New arenas are discoverable by tournament system appropriately', () => {
    // Wailing Chasm and Verdant Labyrinth should be excluded from large brackets (cramped)
    const arenas = getEligibleArenasForTournament({ bracketSize: 16 });
    const hasWailing = arenas.some(a => a.id === 'the_wailing_chasm');
    const hasShattered = arenas.some(a => a.id === 'shattered_monolith');
    const hasVerdant = arenas.some(a => a.id === 'verdant_labyrinth');

    expect(hasWailing).toBe(false); // Excluded due to cramped
    expect(hasVerdant).toBe(false); // Excluded due to cramped
    // Shattered Monolith is open size, so it might be included if tier allows
    if (arenas.some(a => a.tier === 3)) {
      expect(hasShattered).toBe(true);
    }
  });

  it('New style-weather modifiers apply properly', () => {
    const modBlizzard = getStyleWeatherModifier(FightingStyle.LungingAttack, 'Blizzard', ['cursed']);
    expect(modBlizzard.damageMult).toBeLessThan(1.0);
    expect(modBlizzard.descriptions.some(d => d.includes('cursed frozen chasm'))).toBe(true);

    const modRainy = getStyleWeatherModifier(FightingStyle.SlashingAttack, 'Rainy', ['living']);
    expect(modRainy.initiativeMod).toBeLessThan(0);
    expect(modRainy.descriptions.some(d => d.includes('living labyrinth'))).toBe(true);

    // New modifiers
    const modSandstorm = getStyleWeatherModifier(FightingStyle.LungingAttack, 'Sandstorm', ['uneven']);
    expect(modSandstorm.damageMult).toBeLessThan(1.0);
    expect(modSandstorm.descriptions.some(d => d.includes('Shifting sands'))).toBe(true);

    const modBloodMoon = getStyleWeatherModifier(FightingStyle.SlashingAttack, 'Blood Moon', ['water']);
    expect(modBloodMoon.damageMult).toBeGreaterThan(1.0);
    expect(modBloodMoon.descriptions.some(d => d.includes('cursed swamp boils'))).toBe(true);
  });
});
