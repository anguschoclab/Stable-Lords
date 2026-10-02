import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { getStyleWeatherModifier } from '@/constants/arena/arena';
import { THE_BATHHOUSE_ARENA, THE_DESOLATE_HEATH } from '@/data/arenas';
import { getEligibleArenasForTournament } from '@/engine/matchmaking/tournament/tournamentArenaSelection';

describe('Arena Architect Verification', () => {
  it('New arenas are discoverable by tournament system appropriately', () => {
    // Wailing Chasm and Verdant Labyrinth should be excluded from large brackets (cramped)
    const arenas = getEligibleArenasForTournament({ bracketSize: 16 });
    const hasWailing = arenas.some((a) => a.id === 'the_wailing_chasm');
    const hasShattered = arenas.some((a) => a.id === 'shattered_monolith');
    const hasVerdant = arenas.some((a) => a.id === 'verdant_labyrinth');

    expect(hasWailing).toBe(false); // Excluded due to cramped
    expect(hasVerdant).toBe(false); // Excluded due to cramped
    // Shattered Monolith is open size, so it might be included if tier allows
    if (arenas.some((a) => a.tier === 3)) {
      expect(hasShattered).toBe(true);
    }
  });

  it('New style-weather modifiers apply properly', () => {
    const modBlizzard = getStyleWeatherModifier(FightingStyle.LungingAttack, 'Blizzard', [
      'cursed',
    ]);
    expect(modBlizzard.damageMult).toBeLessThan(1.0);
    expect(modBlizzard.descriptions.some((d) => d.includes('cursed frozen chasm'))).toBe(true);

    const modRainy = getStyleWeatherModifier(FightingStyle.SlashingAttack, 'Rainy', ['living']);
    expect(modRainy.initiativeMod).toBeLessThan(0);
    expect(modRainy.descriptions.some((d) => d.includes('living labyrinth'))).toBe(true);

    // New modifiers
    const modSandstorm = getStyleWeatherModifier(FightingStyle.LungingAttack, 'Sandstorm', [
      'uneven',
    ]);
    expect(modSandstorm.damageMult).toBeLessThan(1.0);
    expect(modSandstorm.descriptions.some((d) => d.includes('Shifting sands'))).toBe(true);

    const modBloodMoon = getStyleWeatherModifier(FightingStyle.SlashingAttack, 'Blood Moon', [
      'water',
    ]);
    expect(modBloodMoon.damageMult).toBeGreaterThan(1.0);
    expect(modBloodMoon.descriptions.some((d) => d.includes('cursed swamp boils'))).toBe(true);

    const modMurky = getStyleWeatherModifier(FightingStyle.ParryRiposte, 'Mana Surge', ['indoor']);
    expect(modMurky.riposteMod).toBeGreaterThan(0);
    expect(modMurky.descriptions.some((d) => d.includes('Arcane resonances'))).toBe(true);

    const modJagged = getStyleWeatherModifier(FightingStyle.LungingAttack, 'Blizzard', [
      'elevated',
    ]);
    expect(modJagged.damageMult).toBeLessThan(1.0);
    expect(modJagged.descriptions.some((d) => d.includes('jagged peaks'))).toBe(true);
  });

  it('should correctly register and retrieve new arenas', () => {
    expect(THE_BATHHOUSE_ARENA.id).toBe('the_bathhouse_arena');
    expect(THE_DESOLATE_HEATH.id).toBe('the_desolate_heath');
    expect(THE_BATHHOUSE_ARENA.tags).toContain('water');
    expect(THE_DESOLATE_HEATH.tags).toContain('cursed');
  });

  it('New style-weather modifiers apply properly for new arenas', () => {
    const modBathhouse = getStyleWeatherModifier(FightingStyle.LungingAttack, 'Dense Fog', [
      'premium',
    ]);
    expect(modBathhouse.riposteMod).toBeGreaterThan(0);
    expect(modBathhouse.descriptions.some((d) => d.includes('premium steam'))).toBe(true);

    const modHeath = getStyleWeatherModifier(FightingStyle.SlashingAttack, 'Spooky Night', ['cursed']);
    expect(modHeath.initiativeMod).toBeLessThan(0);
    expect(modHeath.descriptions.some((d) => d.includes('cursed heath'))).toBe(true);
  });
});
