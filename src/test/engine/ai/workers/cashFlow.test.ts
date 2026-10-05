/**
 * Stage C — multi-week cash-flow forecast. `projectCashFlow` generalizes
 * `projectedWeeklyUpkeep` across an N-week horizon: recurring upkeep each
 * week, committed bout purses once, and a projected treasury floor.
 * `checkBudget` gains an optional `horizonWeeks` so big spends are judged
 * against the runway, not just this week's reserve.
 */
import { describe, it, expect } from 'vitest';
import { projectedWeeklyUpkeep, checkBudget, projectCashFlow } from '@/engine/ai/workers/budgetWorker';
import {
  makeRival,
  makeWarrior,
  makeGameState,
  makeBoutOffer,
  makeTrainer,
} from '@/test/_fixtures/factories';

const richRival = () =>
  makeRival({
    treasury: 5000,
    roster: [makeWarrior(), makeWarrior()],
    trainers: [makeTrainer()],
  });

describe('projectCashFlow', () => {
  it('N-week outflow is N × weekly upkeep with no committed spend', () => {
    const rival = richRival();
    const state = makeGameState({ rivals: [rival] });
    const weekly = projectedWeeklyUpkeep(rival);
    const proj = projectCashFlow(rival, state, 4);
    expect(proj.weeklyUpkeep).toBe(weekly);
    expect(proj.weeks).toBe(4);
    expect(proj.totalOutflow).toBe(weekly * 4);
    expect(proj.projectedFloor).toBe(rival.treasury - weekly * 4);
  });

  it('a signed offer purse is a one-time outflow inside the horizon', () => {
    const rival = richRival();
    const w = rival.roster[0]!;
    const signed = makeBoutOffer({
      warriorIds: [w.id, makeWarrior().id],
      purse: 300,
      status: 'Signed',
    });
    const state = makeGameState({ rivals: [rival], boutOffers: { [signed.id]: signed } });
    const weekly = projectedWeeklyUpkeep(rival);
    const proj = projectCashFlow(rival, state, 2);
    expect(proj.committedPurses).toBe(300);
    expect(proj.totalOutflow).toBe(weekly * 2 + 300);
  });

  it('is deterministic — same inputs, same projection', () => {
    const rival = richRival();
    const state = makeGameState({ rivals: [rival] });
    expect(projectCashFlow(rival, state, 3)).toEqual(projectCashFlow(rival, state, 3));
  });
});

describe('checkBudget horizon', () => {
  it('a spend affordable this week fails once the runway is priced in', () => {
    // treasury = reserve + cost + one week of upkeep — the spend clears the
    // this-week check with `weekly` to spare, but the 4-week runway prices
    // 4×upkeep and must refuse.
    const rival = makeRival({
      treasury: 0,
      roster: [makeWarrior(), makeWarrior(), makeWarrior(), makeWarrior(), makeWarrior()],
      trainers: [makeTrainer()],
    });
    const weekly = projectedWeeklyUpkeep(rival);
    expect(weekly).toBeGreaterThan(0);
    const reserve = Math.max(300, weekly); // BASE_RESERVE floor
    rival.treasury = reserve + 100 + weekly;

    const state = makeGameState({ rivals: [rival] });
    expect(checkBudget(rival, 100, 'OTHER').isAffordable).toBe(true);
    expect(checkBudget(rival, 100, 'OTHER', { state, horizonWeeks: 4 }).isAffordable).toBe(false);
  });
});
