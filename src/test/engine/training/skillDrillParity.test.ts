import { describe, it, expect, vi, beforeEach } from 'vitest';
// V30-W1.3: shared skill-drill executor — post-selection mechanics identical
// for AI and player, including the healingBonus + 1 injury roll.
import { runSkillDrillAttempt } from '@/engine/training/trainingAttempt';
import { processSkillDrillTraining } from '@/engine/training/trainingGains';
import { rollForTrainingInjury } from '@/engine/training/trainingGains';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/game';
import type { WarriorId } from '@/types/shared.types';
import type { InjuryData } from '@/types/warrior.types';
import { scriptRng } from '@/test/_fixtures/rngStub';

vi.mock('@/engine/training/trainingGains/skillDrilling', async (importActual) => {
  const actual =
    await importActual<typeof import('@/engine/training/trainingGains/skillDrilling')>();
  return { ...actual, processSkillDrillTraining: vi.fn(actual.processSkillDrillTraining) };
});
vi.mock('@/engine/training/trainingGains/injuryAndRecovery', async (importActual) => {
  const actual =
    await importActual<typeof import('@/engine/training/trainingGains/injuryAndRecovery')>();
  return { ...actual, rollForTrainingInjury: vi.fn(actual.rollForTrainingInjury) };
});

const mkWarrior = () =>
  makeComputedWarrior({}, FightingStyle.StrikingAttack, {
    id: 'w1' as WarriorId,
    fame: 0,
    age: 20,
    skillDrills: { ATT: 1 },
  });

const args = (over: Partial<Parameters<typeof runSkillDrillAttempt>[0]> = {}) => ({
  warrior: mkWarrior(),
  skill: 'ATT' as const,
  state: { trainers: [] } as never,
  healingBonus: 2,
  weather: 'Gale' as const,
  rng: scriptRng(0.99),
  ...over,
});

const drillResult = (
  over: Partial<ReturnType<typeof processSkillDrillTraining>> = {}
): ReturnType<typeof processSkillDrillTraining> => ({
  updatedWarrior: mkWarrior(),
  result: { type: 'gain', warriorId: 'w1' as WarriorId, message: 'drilled' },
  hardCapped: false,
  ...over,
});

describe('runSkillDrillAttempt (V30 unified executor)', () => {
  beforeEach(() => {
    vi.mocked(processSkillDrillTraining)
      .mockClear()
      .mockImplementation(drillResult as never);
    vi.mocked(rollForTrainingInjury).mockClear().mockReturnValue({ injury: null, result: null });
  });

  it('rolls a training injury with healingBonus + 1 — the same odds the player path uses', () => {
    runSkillDrillAttempt(args({ healingBonus: 2 }));
    expect(rollForTrainingInjury).toHaveBeenCalled();
    expect(vi.mocked(rollForTrainingInjury).mock.calls[0]![1]).toBe(3); // 2 + 1
  });

  it('forwards the ambient weather to the injury roll', () => {
    runSkillDrillAttempt(args({ weather: 'Gale' }));
    expect(vi.mocked(rollForTrainingInjury).mock.calls[0]![3]).toBe('Gale');
  });

  it('does NOT roll when the drill is hardCapped', () => {
    vi.mocked(processSkillDrillTraining).mockReturnValueOnce(drillResult({ hardCapped: true }));
    const out = runSkillDrillAttempt(args());
    expect(out.attempted).toBe(false);
    expect(rollForTrainingInjury).not.toHaveBeenCalled();
  });

  it('DOES roll on a no-progress drill — only hardCapped gates the roll (player ruleset)', () => {
    vi.mocked(processSkillDrillTraining).mockReturnValueOnce(
      drillResult({
        updatedWarrior: null,
        result: { type: 'blocked', warriorId: 'w1' as WarriorId, message: 'no progress' },
      })
    );
    const out = runSkillDrillAttempt(args());
    expect(out.attempted).toBe(true);
    expect(rollForTrainingInjury).toHaveBeenCalled();
  });

  it('applies a landed injury to the returned warrior', () => {
    const injury = { id: 'i1' as InjuryData['id'], weeksRemaining: 3 } as InjuryData;
    vi.mocked(rollForTrainingInjury).mockReturnValueOnce({
      injury,
      result: { type: 'injury', warriorId: 'w1' as WarriorId, message: 'ouch' },
    });
    const out = runSkillDrillAttempt(args());
    expect((out.warrior.injuries ?? []).length).toBe(1);
    expect(out.injuryResult?.type).toBe('injury');
  });
});
