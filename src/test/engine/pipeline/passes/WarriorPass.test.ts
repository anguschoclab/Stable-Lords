/**
 * WarriorPass tests — verifies weekly training, aging, and trainer conversion.
 * Uses vi.mocked() pattern (not vi.spyOn) for ESM compatibility.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runWarriorPass } from '@/engine/pipeline/passes/WarriorPass';
import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

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

vi.mock('@/engine/health', () => ({
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
  return {
    week: 5,
    year: 1,
    weather: 'Clear',
    roster: [],
    graveyard: [],
    retired: [],
    hiringPool: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    hallOfFame: [],
    crowdMood: 'Calm',
    tournaments: [],
    trainers: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    rivals: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    isFTTE: false,
    unacknowledgedDeaths: [],
    day: 0,
    isTournamentWeek: false,
    promoters: {},
    boutOffers: {},
    realmRankings: {},
    awards: [],
    bookmarks: [],
    progression: {} as any,
    ...overrides,
  } as GameState;
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

  it('retired warrior with fame > 500 and RNG < 0.1 becomes trainer', () => {
    const retiredWarrior = {
      id: 'w1',
      name: 'Old Veteran',
      style: 'BASHING ATTACK',
      fame: 600,
      career: { wins: 10, losses: 5, kills: 2 },
    } as any;

    mockComputeAgingImpact.mockReturnValue({
      retired: [retiredWarrior],
    });

    const state = makeMockState({ hiringPool: [] });
    const rng = makeMockRNG(0.05); // < 0.1 threshold
    const result = runWarriorPass(state, rng);
    expect(result).toBeDefined();
    // The hiringPool should include a new trainer
    expect(result.hiringPool).toBeDefined();
    expect(result.hiringPool!.length).toBeGreaterThan(0);
  });

  it('retired warrior with fame <= 500 does not become trainer', () => {
    const retiredWarrior = {
      id: 'w1',
      name: 'Modest Veteran',
      style: 'BASHING ATTACK',
      fame: 400,
      career: { wins: 5, losses: 5, kills: 0 },
    } as any;

    mockComputeAgingImpact.mockReturnValue({
      retired: [retiredWarrior],
    });

    const state = makeMockState({ hiringPool: [] });
    const rng = makeMockRNG(0.05);
    const result = runWarriorPass(state, rng);
    // hiringPool should not have new trainers
    expect(result.hiringPool ?? []).toHaveLength(0);
  });

  it('retired warrior with fame > 500 but RNG >= 0.1 does not become trainer', () => {
    const retiredWarrior = {
      id: 'w1',
      name: 'Lucky Veteran',
      style: 'BASHING ATTACK',
      fame: 700,
      career: { wins: 15, losses: 3, kills: 5 },
    } as any;

    mockComputeAgingImpact.mockReturnValue({
      retired: [retiredWarrior],
    });

    const state = makeMockState({ hiringPool: [] });
    const rng = makeMockRNG(0.5); // >= 0.1 threshold
    const result = runWarriorPass(state, rng);
    expect(result.hiringPool ?? []).toHaveLength(0);
  });

  it('seasonalGrowth from training impact is propagated', () => {
    const mockGrowth = [
      { warriorId: 'w1' as any, season: 'Spring' as any, gains: { ST: 1 } },
    ];
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
