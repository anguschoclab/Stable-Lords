import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import {
  getMomentumDamageBonus,
  getWsAttritionBonus,
} from '@/engine/combat/resolution/tempoMechanics';
import { LU_MOMENTUM_DMG_COEFF, WS_ATTRITION_FLOOR } from '@/constants/combat/combat';

describe('getMomentumDamageBonus', () => {
  it('grants LU momentum damage vs a normal defender', () => {
    expect(
      getMomentumDamageBonus(FightingStyle.LungingAttack, 3, FightingStyle.StrikingAttack)
    ).toBe(3 * LU_MOMENTUM_DMG_COEFF);
  });

  it('is negated when the defender is Wall of Steel (immovable)', () => {
    expect(getMomentumDamageBonus(FightingStyle.LungingAttack, 3, FightingStyle.WallOfSteel)).toBe(
      0
    );
  });

  it('is zero for a non-LU attacker', () => {
    expect(
      getMomentumDamageBonus(FightingStyle.BashingAttack, 3, FightingStyle.StrikingAttack)
    ).toBe(0);
  });

  it('is zero when momentum is not positive', () => {
    expect(
      getMomentumDamageBonus(FightingStyle.LungingAttack, 0, FightingStyle.StrikingAttack)
    ).toBe(0);
  });
});

describe('getWsAttritionBonus', () => {
  it('grants the attrition floor for a WS attacker', () => {
    expect(getWsAttritionBonus(FightingStyle.WallOfSteel)).toBe(WS_ATTRITION_FLOOR);
  });

  it('is zero for any non-WS attacker', () => {
    expect(getWsAttritionBonus(FightingStyle.LungingAttack)).toBe(0);
  });
});
