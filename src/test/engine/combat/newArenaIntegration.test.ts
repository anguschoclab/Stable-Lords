import { describe, it, expect } from 'vitest';
import { MIST_SHROUDED_RUINS, THE_GALLOWS_TREE } from '@/data/arenas';
import { getStyleWeatherModifier } from '@/constants/arena/arena';
import { WEATHER_PENALTIES } from '@/constants/arena/weather';
import { FightingStyle } from '@/types/shared.types';

// Uses static data — no RNG or mocks needed
describe('New Arena Integration Tests', () => {
  it('should register MIST_SHROUDED_RUINS correctly', () => {
    expect(MIST_SHROUDED_RUINS.id).toBe('mist_shrouded_ruins');
    expect(MIST_SHROUDED_RUINS.tags).toContain('magical');
    expect(MIST_SHROUDED_RUINS.tags).toContain('ruins');
  });

  it('should register THE_GALLOWS_TREE correctly', () => {
    expect(THE_GALLOWS_TREE.id).toBe('the_gallows_tree');
    expect(THE_GALLOWS_TREE.tags).toContain('cursed');
  });

  it('should apply weather modifiers based on new constants', () => {
    const modRuins = getStyleWeatherModifier(FightingStyle.ParryRiposte, 'Dense Fog', ['ruins']);
    expect(modRuins.damageMult).toBe(WEATHER_PENALTIES.MIST_SHROUDED_DEFENSE_PENALTY);

    // Slashing Attack gets an implicit 1.05 from Blood Moon in addition to the 1.15 cursed bonus
    // 1.05 * 1.15 = 1.2075
    // Let's use a style without an implicit Blood Moon bonus
    const modGallows = getStyleWeatherModifier(FightingStyle.ParryStrike, 'Blood Moon', ['cursed']);
    expect(modGallows.damageMult).toBe(WEATHER_PENALTIES.GALLOWS_CURSE_DAMAGE);
  });
});
