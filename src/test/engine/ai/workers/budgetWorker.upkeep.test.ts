/**
 * Stage C.0 — G15: budget reserve must scale with projected weekly upkeep
 * (roster upkeep + trainer wages), not a flat 300.
 */
import { describe, it, expect } from 'vitest';
import { checkBudget, projectedWeeklyUpkeep } from '@/engine/ai/workers/budgetWorker';
import { makeRival, makeWarrior } from '@/test/_fixtures/factories';
import { WARRIOR_UPKEEP_BASE, TRAINER_WEEKLY_SALARY } from '@/constants/economy';
import type { Trainer } from '@/types/state.types';

const trainer = (tier: keyof typeof TRAINER_WEEKLY_SALARY): Trainer =>
  ({ tier, contractWeeksLeft: 5, focus: 'Balanced' }) as unknown as Trainer;

describe('projectedWeeklyUpkeep', () => {
  it('scales with roster size and fame', () => {
    const small = makeRival({ roster: [makeWarrior({ fame: 0 })] });
    const big = makeRival({
      roster: Array.from({ length: 6 }, () => makeWarrior({ fame: 100 })),
    });
    expect(projectedWeeklyUpkeep(big)).toBeGreaterThan(projectedWeeklyUpkeep(small));
    expect(projectedWeeklyUpkeep(small)).toBeGreaterThanOrEqual(WARRIOR_UPKEEP_BASE);
  });

  it('includes active trainer wages', () => {
    const tier = Object.keys(TRAINER_WEEKLY_SALARY)[0] as keyof typeof TRAINER_WEEKLY_SALARY;
    const withTrainer = makeRival({ roster: [makeWarrior()], trainers: [trainer(tier)] });
    const without = makeRival({ roster: [makeWarrior()], trainers: [] });
    expect(projectedWeeklyUpkeep(withTrainer)).toBeGreaterThan(projectedWeeklyUpkeep(without));
  });
});

describe('checkBudget — upkeep-scaled reserve', () => {
  it('a big expensive roster leaves less spendable treasury than the flat 300 reserve', () => {
    const rival = makeRival({
      treasury: 1000,
      roster: Array.from({ length: 6 }, () => makeWarrior({ fame: 200 })),
    });
    // Flat-300 reserve would allow spending ~700 (Pragmatic tolerance 1.0).
    // Real upkeep for 6×(60 + 200×1.5 + 20 training) warriors is far higher.
    expect(checkBudget(rival, 650, 'OTHER').isAffordable).toBe(false);
  });

  it('a cheap lean roster still spends near the old reserve behavior', () => {
    const rival = makeRival({
      treasury: 1000,
      roster: [makeWarrior({ fame: 0 })],
      trainers: [],
    });
    expect(checkBudget(rival, 500, 'OTHER').isAffordable).toBe(true);
  });
});
