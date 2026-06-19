import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { styleRiposteBonus } from '@/engine/combat/resolution/resolution';
import { PR_COUNTER_ON_PARRY, PR_CHAIN_CAP } from '@/constants/combat/combat';

const f = (style: FightingStyle, momentum = 0) =>
  ({ style, momentum, endurance: 100, maxEndurance: 100 }) as any;

describe('styleRiposteBonus — PR riposte master', () => {
  it('counter-on-parry adds riposte frequency only after a parry', () => {
    const afterParry = styleRiposteBonus(f(FightingStyle.ParryRiposte), f(FightingStyle.BashingAttack), {
      afterParry: true,
      attCommitLevel: 'Standard',
    });
    expect(afterParry.ripBonus).toBe(PR_COUNTER_ON_PARRY);

    const onWhiff = styleRiposteBonus(f(FightingStyle.ParryRiposte), f(FightingStyle.BashingAttack), {
      afterParry: false,
      attCommitLevel: 'Standard',
    });
    expect(onWhiff.ripBonus).toBe(0);
  });

  it('punish-commitment scales riposte damage with the attacker commitment ladder', () => {
    const lvl = (l: any) =>
      styleRiposteBonus(f(FightingStyle.ParryRiposte), f(FightingStyle.BashingAttack), {
        attCommitLevel: l,
      }).dmgBonus;
    expect(lvl('Cautious')).toBe(0);
    expect(lvl('Standard')).toBe(1);
    expect(lvl('Full')).toBe(2);
  });

  it('defaults to Standard commitment when no level is supplied', () => {
    const r = styleRiposteBonus(f(FightingStyle.ParryRiposte), f(FightingStyle.BashingAttack), {});
    expect(r.dmgBonus).toBe(1);
  });

  it('the chain compounds with streak and caps', () => {
    const at = (streak: number) =>
      styleRiposteBonus(f(FightingStyle.ParryRiposte), f(FightingStyle.BashingAttack), {
        attCommitLevel: 'Cautious', // isolate the chain (commit = 0)
        riposteStreak: streak,
      }).dmgBonus;
    expect(at(0)).toBe(0);
    expect(at(2)).toBe(1.0); // 2 * 0.5
    expect(at(10)).toBe(PR_CHAIN_CAP); // capped
  });

  it('is inert for non-PR styles', () => {
    const r = styleRiposteBonus(f(FightingStyle.StrikingAttack), f(FightingStyle.BashingAttack), {
      afterParry: true,
      attCommitLevel: 'Full',
      riposteStreak: 5,
    });
    expect(r).toEqual({ ripBonus: 0, dmgBonus: 0 });
  });
});
