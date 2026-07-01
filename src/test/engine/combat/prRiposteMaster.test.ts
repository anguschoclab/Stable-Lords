import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import { styleRiposteBonus } from '@/engine/combat/resolution/resolution';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';
import { PR_COUNTER_ON_PARRY, PR_CHAIN_CAP } from '@/constants/combat/combat';
import type { Warrior } from '@/types/game';

const f = (style: FightingStyle, momentum = 0) =>
  ({ style, momentum, endurance: 100, maxEndurance: 100 }) as any;

describe('styleRiposteBonus — PR riposte master', () => {
  it('counter-on-parry adds riposte frequency only after a parry', () => {
    const afterParry = styleRiposteBonus(
      f(FightingStyle.ParryRiposte),
      f(FightingStyle.BashingAttack),
      {
        afterParry: true,
        attCommitLevel: 'Standard',
      }
    );
    expect(afterParry.ripBonus).toBe(PR_COUNTER_ON_PARRY);

    const onWhiff = styleRiposteBonus(
      f(FightingStyle.ParryRiposte),
      f(FightingStyle.BashingAttack),
      {
        afterParry: false,
        attCommitLevel: 'Standard',
      }
    );
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

function mk(style: FightingStyle, id: string): Warrior {
  const attrs = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: id as WarriorId,
    name: id,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    traits: [],
  };
}

describe('PR riposte master (integration)', () => {
  it('Parry-Riposte punishes an aggressive Striking Attack brawler', () => {
    const pr = mk(FightingStyle.ParryRiposte, 'PR');
    const st = mk(FightingStyle.StrikingAttack, 'ST');
    let wins = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(pr),
        defaultPlanForWarrior(st),
        pr,
        st,
        i * 8209 + 31
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // PR is the brawler-counter: it should hold its own against an aggressive ST.
    expect(rate, `PR vs ST win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.4);
  });
});
