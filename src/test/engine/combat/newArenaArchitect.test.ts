import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { getStyleWeatherModifier } from '@/constants/arena/arena';
import { getEligibleArenasForTournament } from '@/engine/matchmaking/tournament/tournamentArenaSelection';
import { getArenaById } from '@/data/arenas';

describe('Arena Architect Verification', () => {
  it('New arenas are discoverable by tournament system appropriately', () => {
    // Meat Grinder and Verdant Labyrinth should be excluded from large brackets (cramped)
    const arenas = getEligibleArenasForTournament({ bracketSize: 16 });
    const hasMeatGrinder = arenas.some((a) => a.id === 'the_meat_grinder');
    const hasShattered = arenas.some((a) => a.id === 'shattered_monolith');
    const hasVerdant = arenas.some((a) => a.id === 'verdant_labyrinth');

    expect(hasMeatGrinder).toBe(false); // Excluded due to cramped
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

  describe('V10 arena union (#1018 Bathhouse/Heath + #1019 Crumbling Spire/Misty Pit)', () => {
    it('registers all four new arenas', () => {
      for (const id of [
        'the_bathhouse_arena',
        'the_desolate_heath',
        'the_crumbling_spire',
        'misty_pit',
      ]) {
        expect(getArenaById(id), `missing arena ${id}`).toBeDefined();
      }
    });

    it('Bathhouse: premium+Dense Fog riposte modifier applies', () => {
      const mod = getStyleWeatherModifier(FightingStyle.LungingAttack, 'Dense Fog', ['premium']);
      expect(mod.riposteMod).toBeGreaterThan(0);
      expect(mod.descriptions.some((d) => d.includes('premium steam'))).toBe(true);
    });

    it('Desolate Heath: cursed+Spooky Night initiative penalty applies', () => {
      const mod = getStyleWeatherModifier(FightingStyle.SlashingAttack, 'Spooky Night', ['cursed']);
      expect(mod.initiativeMod).toBeLessThan(0);
      expect(mod.descriptions.some((d) => d.includes('cursed heath'))).toBe(true);
    });
  });
});
