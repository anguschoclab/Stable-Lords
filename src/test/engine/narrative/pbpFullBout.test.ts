import { describe, it, expect } from 'vitest';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);
const noArticleErrors = (s: string) => !/\b a [AEIOUaeiou]/i.test(s);

describe('PBP full-bout regression — no raw {{token}} leaks', () => {
  it('scans 60 seeded fights for raw token leaks and article errors', () => {
    const leaks: string[] = [];

    for (let seed = 1; seed <= 60; seed++) {
      const rng = new SeededRNGService(seed * 31 + 7);

      const warriorA = makeWarrior(
        { id: undefined, name: 'Garath', style: FightingStyle.StrikingAttack, attrs: { ST: 14, CN: 12, SZ: 12, WT: 10, WL: 12, SP: 14, DF: 12 }, overrides: { origin: 'Kolact' }, rng: rng }
      );

      const warriorD = makeWarrior(
        { id: undefined, name: 'Vellis', style: FightingStyle.TotalParry, attrs: { ST: 10, CN: 14, SZ: 10, WT: 12, WL: 14, SP: 16, DF: 14 }, overrides: { origin: 'Andor' }, rng: rng }
      );

      const planA = defaultPlanForWarrior(warriorA);
      const planD = defaultPlanForWarrior(warriorD);

      const out = simulateFight({ planA: planA, planD: planD, warriorA: warriorA, warriorD: warriorD, providedRng: seed });

      for (const entry of out.log) {
        if (!noRawTokens(entry.text)) {
          leaks.push(`seed ${seed} [token]: ${entry.text}`);
          if (leaks.length >= 10) break;
        }
        if (!noArticleErrors(entry.text)) {
          leaks.push(`seed ${seed} [article]: ${entry.text}`);
          if (leaks.length >= 10) break;
        }
      }

      if (leaks.length >= 10) break;
    }

    expect(leaks, `PBP leaks found:\n${leaks.join('\n')}`).toHaveLength(0);
  });
});
