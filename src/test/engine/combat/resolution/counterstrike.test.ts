import { describe, it, expect } from 'vitest';
import { getCounterstrikeAttBonus } from '@/engine/combat/resolution/counterstrike';
import { FightingStyle } from '@/types/shared.types';
import type { FighterState } from '@/engine/combat/resolution/types';

describe('Counterstrike Mechanics', () => {
  describe('getCounterstrikeAttBonus', () => {
    it('returns 0 for non-ParryStrike fighters', () => {
      const fighter = {
        style: FightingStyle.BashingAttack,
        counterstrikePrimed: true,
      } as unknown as Pick<FighterState, 'style' | 'counterstrikePrimed'>;

      expect(getCounterstrikeAttBonus(fighter)).toBe(0);
    });

    it('returns 0 for ParryStrike fighters when not primed', () => {
      const fighter = {
        style: FightingStyle.ParryStrike,
        counterstrikePrimed: false,
      } as unknown as Pick<FighterState, 'style' | 'counterstrikePrimed'>;

      expect(getCounterstrikeAttBonus(fighter)).toBe(0);
    });

    it('returns the PS_COUNTERSTRIKE_ATT bonus (2) for primed ParryStrike fighters', () => {
      const fighter = {
        style: FightingStyle.ParryStrike,
        counterstrikePrimed: true,
      } as unknown as Pick<FighterState, 'style' | 'counterstrikePrimed'>;

      expect(getCounterstrikeAttBonus(fighter)).toBe(2);
    });
  });
});
