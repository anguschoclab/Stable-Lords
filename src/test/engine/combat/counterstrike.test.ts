import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { getCounterstrikeAttBonus } from '@/engine/combat/resolution/counterstrike';
import { PS_COUNTERSTRIKE_ATT } from '@/constants/combat/combat';

// Minimal shim: the helper only reads `style` and `counterstrikePrimed`.
const fighter = (style: FightingStyle, primed: boolean) =>
  ({ style, counterstrikePrimed: primed }) as any;

describe('getCounterstrikeAttBonus', () => {
  it('is zero for a non-PS style even when primed', () => {
    expect(getCounterstrikeAttBonus(fighter(FightingStyle.BashingAttack, true))).toBe(0);
  });

  it('is zero for PS when not primed', () => {
    expect(getCounterstrikeAttBonus(fighter(FightingStyle.ParryStrike, false))).toBe(0);
  });

  it('grants the PS counterstrike ATT bonus for a primed PS fighter', () => {
    expect(getCounterstrikeAttBonus(fighter(FightingStyle.ParryStrike, true))).toBe(
      PS_COUNTERSTRIKE_ATT
    );
  });

  it('treats an undefined flag as not primed', () => {
    expect(getCounterstrikeAttBonus(fighter(FightingStyle.ParryStrike, undefined as any))).toBe(0);
  });
});
