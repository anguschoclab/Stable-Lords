import { describe, it, expect } from 'vitest';
import * as combatDamage from '@/engine/combat/mechanics/combatDamage';

describe('combatDamage re-exports', () => {
  it('exports HIT_LOCATIONS', () => {
    expect(combatDamage.HIT_LOCATIONS).toBeDefined();
  });

  it('exports protectCovers', () => {
    expect(combatDamage.protectCovers).toBeDefined();
  });

  it('exports rollHitLocation', () => {
    expect(combatDamage.rollHitLocation).toBeDefined();
  });

  it('exports computeHitDamage', () => {
    expect(combatDamage.computeHitDamage).toBeDefined();
  });

  it('exports calculateKillWindow', () => {
    expect(combatDamage.calculateKillWindow).toBeDefined();
  });

  it('exports WEAPON_DAMAGE_TYPE', () => {
    expect(combatDamage.WEAPON_DAMAGE_TYPE).toBeDefined();
  });

  it('exports applyArmorTypeMod', () => {
    expect(combatDamage.applyArmorTypeMod).toBeDefined();
  });

  it('exports applyFlatMitigation', () => {
    expect(combatDamage.applyFlatMitigation).toBeDefined();
  });

  it('exports applyProtectMod', () => {
    expect(combatDamage.applyProtectMod).toBeDefined();
  });

  it('exports applyShieldZoneMod', () => {
    expect(combatDamage.applyShieldZoneMod).toBeDefined();
  });
});
