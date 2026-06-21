import { describe, it, expect } from 'vitest';
import { FightingStyle, type Warrior } from '@/types/game';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';

function mk(style: FightingStyle, id: string): Warrior {
  const attrs = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: id as import('@/types/shared.types').WarriorId,
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

describe('BA guard-break (integration)', () => {
  it('Bashing Attack is favored against a Total Parry wall (guard erodes over the fight)', () => {
    const ba = mk(FightingStyle.BashingAttack, 'BA');
    const tp = mk(FightingStyle.TotalParry, 'TP');
    let wins = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(ba),
        defaultPlanForWarrior(tp),
        ba,
        tp,
        i * 6151 + 23
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // BA is meant to crack walls — it should be the favorite in this matchup.
    expect(rate, `BA vs TP win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.5);
  });
});
