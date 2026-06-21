import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/game';
import { getMasteryBonus } from '@/engine/favorites/weaponMastery';

describe('getMasteryBonus', () => {
  it('returns all-zero when the favorite weapon is not mastered', () => {
    expect(getMasteryBonus(FightingStyle.BashingAttack, false)).toEqual({
      att: 0,
      dmg: 0,
      ini: 0,
      def: 0,
      rip: 0,
    });
  });

  it('routes brutal strikers to a damage edge', () => {
    expect(getMasteryBonus(FightingStyle.StrikingAttack, true).dmg).toBe(1);
    expect(getMasteryBonus(FightingStyle.StrikingAttack, true).att).toBe(0);
  });

  it('routes agile styles to an initiative edge', () => {
    expect(getMasteryBonus(FightingStyle.LungingAttack, true).ini).toBe(1);
  });

  it('routes tank styles to a defense edge', () => {
    expect(getMasteryBonus(FightingStyle.TotalParry, true).def).toBe(1);
  });

  it('routes cunning/parry styles to a riposte edge', () => {
    expect(getMasteryBonus(FightingStyle.ParryRiposte, true).rip).toBe(1);
  });

  it('always spends exactly one point of budget when mastered', () => {
    for (const style of Object.values(FightingStyle)) {
      const b = getMasteryBonus(style, true);
      const total = b.att + b.dmg + b.ini + b.def + b.rip;
      expect(total, `${style} mastery budget`).toBe(1);
    }
  });
});
