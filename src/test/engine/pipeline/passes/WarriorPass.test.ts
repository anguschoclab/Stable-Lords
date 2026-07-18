import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runWarriorPass } from '@/engine/pipeline/passes/WarriorPass';
import { GameState } from '@/types/state.types';
import { IRNGService } from '@/engine/core/rng/IRNGService';
import { INITIAL_STATE } from '@/state/slices/rosterSlice/initialState';
import { INITIAL_STATE as WORLD_INITIAL_STATE } from '@/state/slices/worldSlice/initialState';
import { Warrior } from '@/types/warrior.types';
import * as trainingModule from '@/engine/training';
import * as agingModule from '@/engine/aging';

function createMockState(): GameState {
  return {
    ...INITIAL_STATE,
    ...WORLD_INITIAL_STATE,
    week: 52, // Multiple of WEEKS_PER_YEAR to trigger isAgeTick = true
    roster: [],
    hiringPool: [],
    weather: 'Clear',
    rivals: [],
  } as unknown as GameState;
}

function createMockWarrior(id: string, age: number, status: string, fame: number): Warrior {
  return {
    id,
    name: 'Test Warrior',
    age,
    status: status as any,
    level: 1,
    attributes: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, willpower: 10, perception: 10 },
    skills: { unarmed: 10, melee: 10, defense: 10, athletics: 10, endurance: 10 },
    style: { id: 'style1', name: 'Brawler', statMultipliers: {} },
    traits: [],
    flair: [],
    fame,
    popularity: 0,
    career: { wins: 0, losses: 0, kills: 0 },
    fatigue: 0,
    injuries: [],
    trainingFocus: 'strength',
  } as unknown as Warrior;
}

describe('WarriorPass', () => {
  let mockState: GameState;
  let mockRng: IRNGService;

  beforeEach(() => {
    mockState = createMockState();
    mockRng = {
      next: vi.fn().mockReturnValue(0.5),
      nextRange: vi.fn(),
      chance: vi.fn(),
      pickRandom: vi.fn(),
      pickWeighted: vi.fn(),
      uuid: vi.fn().mockReturnValue('mock-uuid'),
    } as unknown as IRNGService;
  });

  it('runs successfully with empty state', () => {
    const impact = runWarriorPass(mockState, mockRng);
    expect(impact).toBeDefined();
    expect(impact.hiringPool).toBeUndefined();
  });

  it('processes a retiring warrior and creates a trainer if fame > 500', () => {
    mockState.roster = [createMockWarrior('w1', 40, 'Active', 600)];
    mockRng.next = vi.fn().mockReturnValue(0.05); // 5% < 10% chance to become trainer

    const spyAging = vi.spyOn(agingModule, 'computeAgingImpact').mockReturnValue({
      retired: [mockState.roster[0]]
    } as any);

    const impact = runWarriorPass(mockState, mockRng);

    expect(impact.retired).toBeDefined();
    expect(impact.retired?.length).toBe(1);
    expect(impact.retired?.[0].id).toBe('w1');

    expect(impact.hiringPool).toBeDefined();
    expect(impact.hiringPool?.length).toBe(1);
    expect(impact.hiringPool?.[0].id).toBe('trainer_ret_w1'); // Id has trainer_ret_ prefix

    spyAging.mockRestore();
  });

  it('processes a retiring warrior but does not create a trainer if fame <= 500', () => {
    mockState.roster = [createMockWarrior('w2', 40, 'Active', 500)];
    mockRng.next = vi.fn().mockReturnValue(0.05);

    const spyAging = vi.spyOn(agingModule, 'computeAgingImpact').mockReturnValue({
      retired: [mockState.roster[0]]
    } as any);

    const impact = runWarriorPass(mockState, mockRng);

    expect(impact.retired).toBeDefined();
    expect(impact.retired?.length).toBe(1);
    expect(impact.hiringPool).toBeUndefined();

    spyAging.mockRestore();
  });

  it('processes a retiring warrior with fame > 500 but fails RNG check', () => {
    mockState.roster = [createMockWarrior('w3', 40, 'Active', 600)];
    mockRng.next = vi.fn().mockReturnValue(0.2); // 20% > 10%

    const spyAging = vi.spyOn(agingModule, 'computeAgingImpact').mockReturnValue({
      retired: [mockState.roster[0]]
    } as any);

    const impact = runWarriorPass(mockState, mockRng);

    expect(impact.retired).toBeDefined();
    expect(impact.retired?.length).toBe(1);
    expect(impact.hiringPool).toBeUndefined();

    spyAging.mockRestore();
  });

  it('returns seasonal growth from training impact', () => {
    const spyCompute = vi.spyOn(trainingModule, 'computeTrainingImpact').mockReturnValue({
      globalMoraleMod: 0,
      seasonGrowth: [{ warriorId: 'w1', diff: { attributes: {} } } as any],
    } as any);
    const spyTransform = vi.spyOn(trainingModule, 'trainingImpactToStateImpact').mockReturnValue({
      impact: {},
      seasonalGrowth: [{ warriorId: 'w1', diff: { attributes: {} } } as any],
    });

    const impact = runWarriorPass(mockState, mockRng);

    expect(impact.seasonalGrowth).toBeDefined();
    expect(impact.seasonalGrowth?.length).toBe(1);
    expect(impact.seasonalGrowth?.[0].warriorId).toBe('w1');

    spyCompute.mockRestore();
    spyTransform.mockRestore();
  });
});
