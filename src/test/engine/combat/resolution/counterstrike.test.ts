import { describe, it, expect } from 'vitest';
import { getCounterstrikeAttBonus } from '@/engine/combat/resolution/counterstrike';
import { FightingStyle } from '@/types/shared.types';
import { PS_COUNTERSTRIKE_ATT } from '@/constants/combat/combat';

describe('Counterstrike Mechanics', () => {
  describe('getCounterstrikeAttBonus', () => {
    it('returns 0 if style is not ParryStrike', () => {
      const fighter = { style: FightingStyle.AimedBlow, counterstrikePrimed: true };
      expect(getCounterstrikeAttBonus(fighter)).toBe(0);
    });

    it('returns 0 if not primed even if style is ParryStrike', () => {
      const fighter = { style: FightingStyle.ParryStrike, counterstrikePrimed: false };
      expect(getCounterstrikeAttBonus(fighter)).toBe(0);
    });

    it('returns PS_COUNTERSTRIKE_ATT if style is ParryStrike and primed', () => {
      const fighter = { style: FightingStyle.ParryStrike, counterstrikePrimed: true };
      expect(getCounterstrikeAttBonus(fighter)).toBe(PS_COUNTERSTRIKE_ATT);
    });
  });
});
