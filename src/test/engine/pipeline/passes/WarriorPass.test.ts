/**
 * WarriorPass tests — verifies weekly training, aging, and trainer conversion.
 * Uses vi.mocked() pattern (not vi.spyOn) for ESM compatibility.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runWarriorPass } from '@/engine/pipeline/passes/WarriorPass';
import { LEGACY_FOUNDER_FAME_MIN, LEGACY_FOUNDER_TRAINER_CHANCE } from '@/constants/world';
import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { makeGameState } from '@/test/_fixtures/factories';

const mockComputeTrainingImpact = vi.hoisted(() => vi.fn());
const mockTrainingImpactToStateImpact = vi.hoisted(() => vi.fn());
const mockComputeAgingImpact = vi.hoisted(() => vi.fn());
const mockComputeHealthImpact = vi.hoisted(() => vi.fn());

vi.mock('@/engine/training', () => ({
  computeTrainingImpact: mockComputeTrainingImpact,
  trainingImpactToStateImpact: mockTrainingImpactToStateImpact,
}));

vi.mock('@/engine/aging', () => ({
  computeAgingImpact: mockComputeAgingImpact,
}));

vi.mock('@/engine/warrior/health', () => ({
  computeHealthImpact: mockComputeHealthImpact,
}));

function makeMockRNG(nextValue: number = 0.5): IRNGService {
  return {
    next: () => nextValue,
    uuid: () => 'test-uuid',
    pick: <T>(arr: T[]) => arr[0],
    shuffle: <T>(arr: T[]) => arr,
    int: (min: number, _max: number) => min,
  } as any;
}

function makeMockState(overrides: Partial<GameState> = {}): GameState {
  return makeGameState({
    week: 5,
    rivals: [],
    recruitPool: [],
    isFTTE: false,
    progression: {} as any,
    ...overrides,
  });
}

describe('runWarriorPass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComputeTrainingImpact.mockReturnValue({});
    mockTrainingImpactToStateImpact.mockReturnValue({ impact: {}, seasonalGrowth: [] });
    mockComputeAgingImpact.mockReturnValue({ retired: [] });
    mockComputeHealthImpact.mockReturnValue({});
  });

  it('empty roster produces empty impact', () => {
    const state = makeMockState();
    const rng = makeMockRNG();
    const result = runWarriorPass(state, rng);
    expect(result).toBeDefined();
  });

  it('retired warrior above founder fame floor with lucky RNG becomes trainer', () => {
    const retiredWarrior = {
      id: 'w1',
      name: 'Old Veteran',
      style: 'BASHING ATTACK',
      fame: LEGACY_FOUNDER_FAME_MIN + 100,
      career: { wins: 10, losses: 5, kills: 2 },
    } as any;

    mockComputeAgingImpact.mockReturnValue({
      retired: [retiredWarrior],
    });

    const state = makeMockState({ hiringPool: [] });
    const rng = makeMockRNG(LEGACY_FOUNDER_TRAINER_CHANCE - 0.01);
    const result = runWarriorPass(state, rng);
    expect(result).toBeDefined();
    // The hiringPool should include a new trainer
    expect(result.hiringPool).toBeDefined();
    expect(result.hiringPool!.length).toBeGreaterThan(0);
  });

  it('retired warrior at or below the founder fame floor does not become trainer', () => {
    const retiredWarrior = {
      id: 'w1',
      name: 'Modest Veteran',
      style: 'BASHING ATTACK',
      fame: LEGACY_FOUNDER_FAME_MIN,
      career: { wins: 5, losses: 5, kills: 0 },
    } as any;

    mockComputeAgingImpact.mockReturnValue({
      retired: [retiredWarrior],
    });

    const state = makeMockState({ hiringPool: [] });
    const rng = makeMockRNG(LEGACY_FOUNDER_TRAINER_CHANCE - 0.01);
    const result = runWarriorPass(state, rng);
    // hiringPool should not have new trainers
    expect(result.hiringPool ?? []).toHaveLength(0);
  });

  it('retired warrior above fame floor but RNG >= trainer chance does not become trainer', () => {
    const retiredWarrior = {
      id: 'w1',
      name: 'Lucky Veteran',
      style: 'BASHING ATTACK',
      fame: LEGACY_FOUNDER_FAME_MIN + 100,
      career: { wins: 15, losses: 3, kills: 5 },
    } as any;

    mockComputeAgingImpact.mockReturnValue({
      retired: [retiredWarrior],
    });

    const state = makeMockState({ hiringPool: [] });
    const rng = makeMockRNG(LEGACY_FOUNDER_TRAINER_CHANCE); // boundary: >= chance => no trainer
    const result = runWarriorPass(state, rng);
    expect(result.hiringPool ?? []).toHaveLength(0);
  });

  it('seasonalGrowth from training impact is propagated', () => {
    const mockGrowth = [{ warriorId: 'w1' as any, season: 'Spring' as any, gains: { ST: 1 } }];
    mockTrainingImpactToStateImpact.mockReturnValue({
      impact: {},
      seasonalGrowth: mockGrowth,
    });

    const state = makeMockState();
    const rng = makeMockRNG();
    const result = runWarriorPass(state, rng);
    expect(result.seasonalGrowth).toBeDefined();
    expect(result.seasonalGrowth!.length).toBeGreaterThan(0);
  });
});
