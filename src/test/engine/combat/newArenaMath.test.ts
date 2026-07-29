import { describe, it, expect } from 'vitest';
import { THE_BRAMBLE_RING, THUNDER_PEAK } from '@/data/arenas';
import { getStyleWeatherModifier } from '@/constants/arena';
import { FightingStyle } from '@/types/shared.types';

describe('New Arenas and Modifiers', () => {
  it('should correctly register and retrieve new arenas', () => {
    expect(THE_BRAMBLE_RING.id).toBe('the_bramble_ring');
    expect(THUNDER_PEAK.id).toBe('thunder_peak');
    expect(THE_BRAMBLE_RING.tags).toContain('living');
    expect(THUNDER_PEAK.tags).toContain('elevated');
  });

  it('should apply style weather modifiers correctly with updated constants', () => {
    const modLungeRain = getStyleWeatherModifier(FightingStyle.LungingAttack, 'Rainy', []);
    expect(modLungeRain.damageMult).toBe(1 - 0.15); // Testing our updated RAIN_LUNGE_PENALTY

    const modRiposteDust = getStyleWeatherModifier(FightingStyle.ParryRiposte, 'Sandstorm', []);
    expect(modRiposteDust.damageMult).toBe(1 - 0.10); // Testing our updated DUST_RIPOSTE_PENALTY
  });
});
