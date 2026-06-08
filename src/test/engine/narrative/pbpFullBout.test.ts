import { describe, it, expect } from 'vitest';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);

describe('PBP full-bout regression — no raw {{token}} leaks', () => {
  it('scans 60 seeded fights for raw token leaks', () => {
    const leaks: string[] = [];

    for (let seed = 1; seed <= 60; seed++) {
      const rng = new SeededRNGService(seed * 31 + 7);

      const warriorA = makeWarrior(
        undefined,
        'Garath',
        FightingStyle.StrikingAttack,
        { ST: 14, CN: 12, SZ: 12, WT: 10, WL: 12, SP: 14, DF: 12 },
        { origin: 'Kolact' },
        rng
      );

      const warriorD = makeWarrior(
        undefined,
        'Vellis',
        FightingStyle.TotalParry,
        { ST: 10, CN: 14, SZ: 10, WT: 12, WL: 14, SP: 16, DF: 14 },
        { origin: 'Andor' },
        rng
      );

      const planA = defaultPlanForWarrior(warriorA);
      const planD = defaultPlanForWarrior(warriorD);

      const out = simulateFight(planA, planD, warriorA, warriorD, seed);

      for (const entry of out.log) {
        if (!noRawTokens(entry.text)) {
          leaks.push(`seed ${seed}: ${entry.text}`);
          if (leaks.length >= 10) break;
        }
      }

      if (leaks.length >= 10) break;
    }

    expect(leaks, `Raw token leaks found:\n${leaks.join('\n')}`).toHaveLength(0);
  });
});
