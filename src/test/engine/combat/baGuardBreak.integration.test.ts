import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/game';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { mk } from './_helpers';

describe('BA guard-break (integration)', () => {
  it('Bashing Attack is favored against a Total Parry wall (guard erodes over the fight)', () => {
    const ba = mk(FightingStyle.BashingAttack, 'BA');
    const tp = mk(FightingStyle.TotalParry, 'TP');
    let wins = 0;
    const N = 200;
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
