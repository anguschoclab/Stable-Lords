import { describe, it, expect, vi, beforeEach } from 'vitest';
// V30-W1.2: shared attribute-training attempt executor — both the player
// assignment path and the AI roster worker consume this one implementation.
import { runTrainingAttempt } from '@/engine/training/trainingAttempt';
import { processAttributeTraining } from '@/engine/training/trainingGains';
import { rollForTrainingInjury } from '@/engine/training/trainingGains';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/game';
import type { WarriorId, InjuryData } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

// Registry-level partial mocks so the barrel re-exports intercept correctly.
vi.mock('@/engine/training/trainingGains/attributeTraining', async (importActual) => {
  const actual =
    await importActual<typeof import('@/engine/training/trainingGains/attributeTraining')>();
  return { ...actual, processAttributeTraining: vi.fn(actual.processAttributeTraining) };
});
vi.mock('@/engine/training/trainingGains/injuryAndRecovery', async (importActual) => {
  const actual =
    await importActual<typeof import('@/engine/training/trainingGains/injuryAndRecovery')>();
  return { ...actual, rollForTrainingInjury: vi.fn(actual.rollForTrainingInjury) };
});

const mkWarrior = (over = {}) =>
  makeComputedWarrior(
    { ST: 10 },
    FightingStyle.StrikingAttack,
    {
      id: 'w1' as WarriorId,
      fame: 0,
      age: 20,
      potential: { ST: 18, CN: 18, SZ: 15, WT: 18, WL: 18, SP: 18, DF: 18 },
      ...over,
    }
  );

const makeRNG = (nextVal = 0.99): IRNGService =>
  ({
    next: () => nextVal,
    pick: <T>(arr: T[]): T => arr[0]!,
    roll: () => 1,
    uuid: (p?: string) => (p ? `${p}-u` : 'u'),
    shuffle: <T>(arr: T[]): T[] => arr,
    chance: (p: number) => nextVal < p,
  }) as unknown as IRNGService;

const args = (over: Partial<Parameters<typeof runTrainingAttempt>[0]> = {}) =>
  ({
    warrior: mkWarrior(),
    attribute: 'ST' as const,
    stableCtx: { season: 'Summer' as const, trainers: [] },
    seasonalGrowth: [],
    healingBonus: 0,
    weather: 'Rainy' as const,
    rng: makeRNG(),
    ...over,
  });

const attrResult = (
  over: Partial<ReturnType<typeof processAttributeTraining>> = {}
): ReturnType<typeof processAttributeTraining> =>
  ({
    updatedWarrior: mkWarrior(),
    updatedSeasonalGrowth: undefined,
    result: { type: 'gain', warriorId: 'w1' as WarriorId, message: 'gained' },
    hardCapped: false,
    ...over,
  });

describe('runTrainingAttempt (V30 unified executor)', () => {
  beforeEach(() => {
    vi.mocked(processAttributeTraining).mockClear().mockImplementation(attrResult as never);
    vi.mocked(rollForTrainingInjury)
      .mockClear()
      .mockReturnValue({ injury: null, result: null });
  });

  it('forwards the ambient weather to the injury roll', () => {
    runTrainingAttempt(args({ weather: 'Rainy' }));
    expect(rollForTrainingInjury).toHaveBeenCalled();
    expect(vi.mocked(rollForTrainingInjury).mock.calls[0]![3]).toBe('Rainy');
  });

  it('does NOT roll an injury when the attempt is hardCapped', () => {
    vi.mocked(processAttributeTraining).mockReturnValueOnce(attrResult({ hardCapped: true }));
    const out = runTrainingAttempt(args());
    expect(out.attempted).toBe(false);
    expect(rollForTrainingInjury).not.toHaveBeenCalled();
    expect(out.injury).toBeNull();
  });

  it('does NOT roll an injury when the attempt is blocked with a message', () => {
    vi.mocked(processAttributeTraining).mockReturnValueOnce(
      attrResult({
        updatedWarrior: undefined,
        result: { type: 'blocked', warriorId: 'w1' as WarriorId, message: 'burned' },
      })
    );
    const out = runTrainingAttempt(args());
    expect(out.attempted).toBe(false);
    expect(rollForTrainingInjury).not.toHaveBeenCalled();
  });

  it('rolls the injury and applies it to the returned warrior when the roll lands', () => {
    const injury = { id: 'i1' as InjuryData['id'], weeksRemaining: 2 } as InjuryData;
    vi.mocked(rollForTrainingInjury).mockReturnValueOnce({
      injury,
      result: { type: 'injury', warriorId: 'w1' as WarriorId, message: 'ouch' },
    });
    const out = runTrainingAttempt(args());
    expect(out.attempted).toBe(true);
    expect(out.injury).toBe(injury);
    expect((out.warrior.injuries ?? []).length).toBe(1);
    expect(out.injuryResult?.type).toBe('injury');
  });

  it('recomputes derived stats when the attribute changed', () => {
    const grown = mkWarrior();
    grown.attributes = { ...grown.attributes, ST: 11 };
    vi.mocked(processAttributeTraining).mockReturnValueOnce(attrResult({ updatedWarrior: grown }));
    const out = runTrainingAttempt(args());
    expect(out.warrior.derivedStats).toBeDefined();
    expect(out.warrior.baseSkills).toBeDefined();
  });

  it('threads updatedSeasonalGrowth through when the attempt returns it', () => {
    const growth = [{ warriorId: 'w1' as WarriorId }];
    vi.mocked(processAttributeTraining).mockReturnValueOnce(
      attrResult({ updatedSeasonalGrowth: growth as never })
    );
    const out = runTrainingAttempt(args());
    expect(out.seasonalGrowth).toBe(growth);
  });
});
