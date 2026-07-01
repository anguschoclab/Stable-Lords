import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/game';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { mk } from './_helpers';

describe('PS counterstrike (integration)', () => {
  it('a Parry-Strike fighter is not a free win for an aggressive Bashing Attack', () => {
    const ps = mk(FightingStyle.ParryStrike, 'PS');
    const ba = mk(FightingStyle.BashingAttack, 'BA');
    let wins = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(ps),
        defaultPlanForWarrior(ba),
        ps,
        ba,
        i * 4099 + 17
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    // Directional floor: PS vs BA is a bad matchup, but PS should still be
    // functional (not a free win). The counterstrike helps PS land when it
    // does win initiative; overall competitiveness is validated by the
    // balance harness (40-60% band across all matchups).
    expect(rate, `PS vs BA win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.15);
  });
});
