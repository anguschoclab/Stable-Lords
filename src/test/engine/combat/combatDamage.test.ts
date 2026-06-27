import { describe, it, expect } from 'vitest';
import {
  HIT_LOCATIONS,
  protectCovers,
  rollHitLocation,
  LOCATION_DAMAGE_MULT,
  LOCATION_KILL_MULT,
  WEAPON_DAMAGE_TYPE,
  applyArmorTypeMod,
  applyProtectMod,
  applyShieldZoneMod,
  computeHitDamage,
  calculateKillWindow,
} from '@/engine/combat/mechanics/combatDamage';

describe('combatDamage barrel export', () => {
  it('should export all required functions and constants', () => {
    expect(HIT_LOCATIONS).toBeDefined();
    expect(protectCovers).toBeInstanceOf(Function);
    expect(rollHitLocation).toBeInstanceOf(Function);
    expect(LOCATION_DAMAGE_MULT).toBeDefined();
    expect(LOCATION_KILL_MULT).toBeDefined();

    expect(WEAPON_DAMAGE_TYPE).toBeDefined();
    expect(applyArmorTypeMod).toBeInstanceOf(Function);

    expect(applyProtectMod).toBeInstanceOf(Function);
    expect(applyShieldZoneMod).toBeInstanceOf(Function);

    expect(computeHitDamage).toBeInstanceOf(Function);
    expect(calculateKillWindow).toBeInstanceOf(Function);
  });
});
