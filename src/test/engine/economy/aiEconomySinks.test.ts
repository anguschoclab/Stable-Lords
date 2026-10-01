import { describe, it, expect } from 'vitest';
import { computeWeeklyBreakdown } from '@/engine/economy';
import { processTraitDevelopment, aiTrainingLimit } from '@/engine/ai/workers/rosterWorkerTraining';
import { processAIStable } from '@/engine/ai/stableManager';
import { makeRival, makeWarrior } from '@/test/_fixtures/factories';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { Warrior } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { AI_TRAIT_DEV_COST, AI_TRAIT_DEV_RESERVE, AI_PRESTIGE_FREE_TREASURY } from '@/constants/ai';

/** Deterministic RNG that always takes the "develop" branch. */
const alwaysRoll: IRNGService = {
  next: () => 0,
  uuid: () => 'rng-uuid',
  pick: <T>(arr: T[]) => arr[0]!,
  int: () => 0,
  bool: () => true,
} as unknown as IRNGService;

const developable = (over: Partial<Warrior> = {}): Warrior =>
  makeWarrior({ trainability: 0.95, fame: 20, ...over });

const rivalWith = (roster: Warrior[], treasury: number) =>
  makeRival({ roster, treasury, trainingAssignments: [], ledger: [] });

describe('AI trait development sink', () => {
  it('charges gold per development attempt when affordable', () => {
    const roster = [developable(), developable(), developable()];
    const { spent } = processTraitDevelopment(roster, 50_000, 'Aggressive', alwaysRoll);
    expect(spent).toBeGreaterThanOrEqual(AI_TRAIT_DEV_COST);
  });

  it('spends nothing below the reserve floor', () => {
    const roster = [developable(), developable()];
    const { spent } = processTraitDevelopment(roster, 100, 'Aggressive', alwaysRoll);
    expect(spent).toBe(0);
  });

  it('never spends the stable below the reserve', () => {
    // A full roster attempts development; spending must stop at the reserve.
    const roster = Array.from({ length: 12 }, () => developable());
    const treasury = AI_TRAIT_DEV_RESERVE + AI_TRAIT_DEV_COST * 2;
    const { spent } = processTraitDevelopment(roster, treasury, 'Aggressive', alwaysRoll);
    expect(treasury - spent).toBeGreaterThanOrEqual(AI_TRAIT_DEV_RESERVE);
  });

  it('wealthy stables develop more aggressively than poor ones', () => {
    // rng at 0.6 sits between the poor devChance (~0.5) and the wealthy
    // premium-program devChance (0.5 × 1.5 = 0.75): only the rich stable pays.
    const midRoll = { ...alwaysRoll, next: () => 0.6 } as IRNGService;
    const roster = Array.from({ length: 10 }, () => developable());
    const rich = processTraitDevelopment(roster, 100_000, 'Aggressive', midRoll);
    const poor = processTraitDevelopment(roster, 5_000, 'Aggressive', midRoll);
    expect(rich.spent).toBeGreaterThan(poor.spent);
  });
});

describe('AI prestige upkeep', () => {
  const baseInput = {
    week: 10,
    roster: [makeWarrior()],
    fame: 0,
    weather: 'Clear' as const,
    arenaHistory: [],
    trainers: [],
    trainingAssignments: [],
  };

  it('charges wealthy rival stables a prestige upkeep proportional to treasury', () => {
    const rich = computeWeeklyBreakdown({
      ...baseInput,
      isPlayer: false,
      treasury: AI_PRESTIGE_FREE_TREASURY * 5,
    });
    const poor = computeWeeklyBreakdown({
      ...baseInput,
      isPlayer: false,
      treasury: AI_PRESTIGE_FREE_TREASURY - 1,
    });
    const prestigeOf = (b: typeof rich) =>
      b.expenses.find((e) => e.label.includes('prestige'))?.amount ?? 0;
    expect(prestigeOf(rich)).toBeGreaterThan(prestigeOf(poor));
    expect(prestigeOf(poor)).toBe(0);
  });

  it('does not charge the player stable prestige upkeep', () => {
    const player = computeWeeklyBreakdown({ ...baseInput, isPlayer: true, treasury: 500_000 });
    expect(player.expenses.some((e) => e.label.toLowerCase().includes('prestige'))).toBe(false);
  });

  it('caps prestige upkeep so it can never drain a stable in one week', () => {
    const rich = computeWeeklyBreakdown({ ...baseInput, isPlayer: false, treasury: 1_000_000 });
    const prestige =
      rich.expenses.find((e) => e.label.toLowerCase().includes('prestige'))?.amount ?? 0;
    expect(prestige).toBeLessThanOrEqual(1_000_000 * 0.05 + 1);
  });
});

describe('AI training appetite scales with wealth', () => {
  it('grants more training slots to wealthier stables', () => {
    expect(aiTrainingLimit(100)).toBeLessThan(aiTrainingLimit(1_000));
    expect(aiTrainingLimit(1_000)).toBeLessThan(aiTrainingLimit(50_000));
  });
});

describe('economy sink integration', () => {
  it('a wealthy idle stable loses more weekly than it earns', () => {
    const state = createFreshState('7');
    const rich = rivalWith(
      Array.from({ length: 6 }, () => developable()),
      80_000
    );
    const before = rich.treasury;
    const { updatedRival } = processAIStable(rich, state);
    // No fights booked → no purse income, only upkeep + sinks.
    expect(updatedRival.treasury).toBeLessThan(before);
    expect(before - updatedRival.treasury).toBeGreaterThan(1_000);
  });
});
