import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeTrainerAging } from '@/engine/trainerAging';
import { runTrainerPass } from '@/engine/pipeline/passes/TrainerPass';
import { TRAINER_AGING } from '@/constants/aging';
import type { GameState, Trainer, RivalStableData } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeMockRng(nextValue: number): IRNGService {
  return {
    next: () => nextValue,
    uuid: () => 'test-uuid',
    pick: <T>(arr: T[]) => arr[0]!,
    roll: (min: number, _max: number) => min,
    shuffle: <T>(arr: T[]) => arr,
    pickWeighted: <T>(items: T[]) => items[0]!,
    chance: () => nextValue < 0.5,
  };
}

function makeTrainer(overrides?: Partial<Trainer>): Trainer {
  return {
    id: 't1',
    name: 'Test Trainer',
    tier: 'Seasoned',
    focus: 'Aggression',
    fame: 0,
    age: 45,
    contractWeeksLeft: 52,
    ...overrides,
  };
}

function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    meta: { gameName: 'Test', version: '1.0', createdAt: '' },
    ftueComplete: true,
    coachDismissed: [],
    player: {
      id: 'stable-player' as StableId,
      name: 'You',
      stableName: "Dragon's Hearth",
      fame: 0,
      renown: 0,
      titles: 0,
    },
    fame: 0,
    popularity: 0,
    treasury: 1000,
    ledger: [],
    week: 1,
    year: 1,
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    roster: [],
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    hallOfFame: [],
    crowdMood: 'Calm',
    tournaments: [],
    trainers: [],
    hiringPool: [],
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
    isFTUE: true,
    unacknowledgedDeaths: [],
    day: 0,
    isTournamentWeek: false,
    activeTournamentId: undefined,
    promoters: {},
    boutOffers: {},
    realmRankings: {},
    awards: [],
    ...overrides,
  } as GameState;
}

function makeRival(id: string, trainers?: Trainer[]): RivalStableData {
  return {
    id: id as StableId,
    owner: {
      id: `owner_${id}` as StableId,
      name: `Lord ${id}`,
      stableName: `Stable ${id}`,
      personality: 'Pragmatic',
      backstoryId: 'gladiator',
      fame: 0,
      renown: 0,
      titles: 0,
      age: 40,
      generation: 0,
    },
    fame: 0,
    treasury: 1000,
    roster: [],
    trainers,
  };
}

// ─── computeTrainerAging ────────────────────────────────────────────────────

describe('computeTrainerAging — basic aging', () => {
  it('increments age by 1 on multiples of 52 weeks', () => {
    const trainer = makeTrainer({ age: 45 });
    const state = makeGameState({ week: 52, trainers: [trainer] });
    const { updatedTrainers } = computeTrainerAging(state);

    expect(updatedTrainers[0]!.age).toBe(46);
  });

  it('does not increment age on non-multiples of 52 weeks', () => {
    const trainer = makeTrainer({ age: 45 });
    const state = makeGameState({ week: 51, trainers: [trainer] });
    const { updatedTrainers } = computeTrainerAging(state);

    expect(updatedTrainers[0]!.age).toBe(45);
  });

  it('falls back to BASE_AGE when trainer age is undefined', () => {
    const trainer = makeTrainer({ age: undefined as any as number });
    const state = makeGameState({ week: 51, trainers: [trainer] });
    const { updatedTrainers } = computeTrainerAging(state);

    expect(updatedTrainers[0]!.age).toBe(TRAINER_AGING.BASE_AGE);
  });
});

describe('computeTrainerAging — contract expiration', () => {
  it('decrements contractWeeksLeft by 1 every week for active trainers', () => {
    const trainer = makeTrainer({ contractWeeksLeft: 10 });
    const state = makeGameState({ week: 1, trainers: [trainer] });
    const { updatedTrainers } = computeTrainerAging(state);

    expect(updatedTrainers[0]!.contractWeeksLeft).toBe(9);
  });

  it('removes active trainer when contract expires', () => {
    const trainer = makeTrainer({ contractWeeksLeft: 1 });
    const state = makeGameState({ week: 1, trainers: [trainer] });
    const { updatedTrainers, news } = computeTrainerAging(state);

    expect(updatedTrainers).toHaveLength(0);
    expect(news).toHaveLength(1);
    expect(news[0]).toContain('CONTRACT:');
    expect(news[0]).not.toContain('📋');
  });

  it('does not expire contracts for hiring pool trainers', () => {
    const trainer = makeTrainer({ contractWeeksLeft: 1 });
    const state = makeGameState({ week: 1, hiringPool: [trainer] });
    const { updatedHiringPool } = computeTrainerAging(state);

    expect(updatedHiringPool).toHaveLength(1);
    expect(updatedHiringPool[0]!.contractWeeksLeft).toBe(1);
  });

  it('handles undefined trainers array gracefully', () => {
    const state = makeGameState({ trainers: undefined as any as Trainer[] });
    const { updatedTrainers } = computeTrainerAging(state);

    expect(updatedTrainers).toHaveLength(0);
  });

  it('handles undefined hiringPool array gracefully', () => {
    const state = makeGameState({ hiringPool: undefined as any as Trainer[] });
    const { updatedHiringPool } = computeTrainerAging(state);

    expect(updatedHiringPool).toHaveLength(0);
  });
});

describe('computeTrainerAging — retirement', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retires a trainer when RNG roll is below finalChance', () => {
    const trainer = makeTrainer({ age: 65 });
    const state = makeGameState({ week: 1, trainers: [trainer] });

    const mockRng = makeMockRng(0);
    const { updatedTrainers, news } = computeTrainerAging(state, mockRng);

    expect(updatedTrainers).toHaveLength(0);
    expect(news).toHaveLength(1);
    expect(news[0]).toContain('LEGACY:');
    expect(news[0]).not.toContain('🏠');
  });

  it('keeps trainer when RNG roll is above finalChance', () => {
    const trainer = makeTrainer({ age: 65 });
    const state = makeGameState({ week: 1, trainers: [trainer] });

    const mockRng = makeMockRng(0.99);
    const { updatedTrainers } = computeTrainerAging(state, mockRng);

    expect(updatedTrainers).toHaveLength(1);
  });

  it('uses "passed away" message above DEATH_THRESHOLD', () => {
    const trainer = makeTrainer({ age: 81 });
    const state = makeGameState({ week: 1, trainers: [trainer] });

    const mockRng = makeMockRng(0);
    const { news } = computeTrainerAging(state, mockRng);

    expect(news[0]!).toContain('passed away peacefully');
  });

  it('uses "retired" message below DEATH_THRESHOLD', () => {
    const trainer = makeTrainer({ age: 70 });
    const state = makeGameState({ week: 1, trainers: [trainer] });

    const mockRng = makeMockRng(0);
    const { news } = computeTrainerAging(state, mockRng);

    expect(news[0]!).toContain('retired to the countryside');
  });

  it('applies fame discount reducing retirement chance', () => {
    const lowFame = makeTrainer({ age: 65, fame: 0 });
    const highFame = makeTrainer({ age: 65, fame: 100 });

    const stateLow = makeGameState({ week: 1, trainers: [lowFame] });
    const stateHigh = makeGameState({ week: 1, trainers: [highFame] });

    // Roll exactly at the high-fame discounted threshold:
    // baseChance = 0.05 + (65-65)*0.02 = 0.05
    // fameDiscount = min(0.1, 100 * 0.001) = 0.1
    // finalChance = max(0.01, 0.05 - 0.1) = 0.01
    // Roll 0.02 > 0.01 => survives
    const mockRng = makeMockRng(0.02);

    const lowResult = computeTrainerAging(stateLow, mockRng);
    const highResult = computeTrainerAging(stateHigh, mockRng);

    expect(lowResult.updatedTrainers).toHaveLength(0); // 0.02 < 0.05
    expect(highResult.updatedTrainers).toHaveLength(1); // 0.02 > 0.01
  });

  it('applies legacy discount for retiredFromWarrior trainers', () => {
    const normal = makeTrainer({ age: 65, fame: 0 });
    const legacy = makeTrainer({ age: 65, fame: 0, retiredFromWarrior: 'Warrior1' });

    const stateNormal = makeGameState({ week: 1, trainers: [normal] });
    const stateLegacy = makeGameState({ week: 1, trainers: [legacy] });

    // baseChance = 0.05
    // legacy final = max(0.01, 0.05 - 0.05) = 0.01
    // Roll 0.02 > 0.01 => survives for legacy, retires for normal
    const mockRng = makeMockRng(0.02);

    const normalResult = computeTrainerAging(stateNormal, mockRng);
    const legacyResult = computeTrainerAging(stateLegacy, mockRng);

    expect(normalResult.updatedTrainers).toHaveLength(0);
    expect(legacyResult.updatedTrainers).toHaveLength(1);
  });

  it('respects MIN_CHANCE floor', () => {
    const trainer = makeTrainer({ age: 65, fame: 1000, retiredFromWarrior: 'W1' });
    const state = makeGameState({ week: 1, trainers: [trainer] });

    // Even with huge fame + legacy, min chance is 0.01
    // Roll 0.005 < 0.01 => still retires
    const mockRng = makeMockRng(0.005);
    const { updatedTrainers } = computeTrainerAging(state, mockRng);

    expect(updatedTrainers).toHaveLength(0);
  });
});

describe('computeTrainerAging — hiring pool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ages hiring pool trainers on aging weeks', () => {
    const trainer = makeTrainer({ age: 45 });
    const state = makeGameState({ week: 52, hiringPool: [trainer] });
    const { updatedHiringPool } = computeTrainerAging(state);

    expect(updatedHiringPool[0]!.age).toBe(46);
  });

  it('does not expire contracts in hiring pool', () => {
    const trainer = makeTrainer({ contractWeeksLeft: 1 });
    const state = makeGameState({ week: 1, hiringPool: [trainer] });
    const { updatedHiringPool } = computeTrainerAging(state);

    expect(updatedHiringPool[0]!.contractWeeksLeft).toBe(1);
  });

  it('retires hiring pool trainers above retirement age', () => {
    const trainer = makeTrainer({ age: 65 });
    const state = makeGameState({ week: 1, hiringPool: [trainer] });

    const mockRng = makeMockRng(0);
    const { updatedHiringPool, news } = computeTrainerAging(state, mockRng);

    expect(updatedHiringPool).toHaveLength(0);
    expect(news).toHaveLength(1);
  });
});

describe('computeTrainerAging — rival trainers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ages rival trainers on aging weeks', () => {
    const rival = makeRival('r1', [makeTrainer({ id: 'rt1', age: 45 })]);
    const state = makeGameState({ week: 52, rivals: [rival] });
    const { rivalsUpdates } = computeTrainerAging(state);

    expect(rivalsUpdates.size).toBe(1);
    const update = rivalsUpdates.get('r1' as StableId);
    expect(update?.trainers?.[0]!.age).toBe(46);
  });

  it('expires rival trainer contracts', () => {
    const rival = makeRival('r1', [makeTrainer({ id: 'rt1', contractWeeksLeft: 1 })]);
    const state = makeGameState({ week: 1, rivals: [rival] });
    const { rivalsUpdates, news } = computeTrainerAging(state);

    expect(rivalsUpdates.size).toBe(1);
    const update = rivalsUpdates.get('r1' as StableId);
    expect(update?.trainers).toHaveLength(0);
    expect(news[0]!).toContain('CONTRACT:');
  });

  it('retires rival trainers above retirement age', () => {
    const rival = makeRival('r1', [makeTrainer({ id: 'rt1', age: 65 })]);
    const state = makeGameState({ week: 1, rivals: [rival] });

    const mockRng = makeMockRng(0);
    const { rivalsUpdates } = computeTrainerAging(state, mockRng);

    expect(rivalsUpdates.size).toBe(1);
    const update = rivalsUpdates.get('r1' as StableId);
    expect(update?.trainers).toHaveLength(0);
  });

  it('produces rivalsUpdates when rival contracts decrement', () => {
    const rival = makeRival('r1', [makeTrainer({ id: 'rt1', age: 45, contractWeeksLeft: 52 })]);
    const state = makeGameState({ week: 1, rivals: [rival] }); // not aging week
    const { rivalsUpdates } = computeTrainerAging(state);

    // Active rival trainers always have contracts ticked down
    expect(rivalsUpdates.size).toBe(1);
    const update = rivalsUpdates.get('r1' as StableId);
    expect(update?.trainers?.[0]!.contractWeeksLeft).toBe(51);
  });

  it('handles rivals without trainers property', () => {
    const rival = makeRival('r1');
    delete (rival as Partial<RivalStableData>).trainers;
    const state = makeGameState({ week: 1, rivals: [rival] });
    const { rivalsUpdates } = computeTrainerAging(state);

    expect(rivalsUpdates.size).toBe(0);
  });

  it('handles empty rivals array', () => {
    const state = makeGameState({ week: 1, rivals: [] });
    const { rivalsUpdates } = computeTrainerAging(state);

    expect(rivalsUpdates.size).toBe(0);
  });
});

describe('computeTrainerAging — combined scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('processes player trainers, hiring pool, and rivals in one call', () => {
    const playerTrainer = makeTrainer({ id: 'pt1', age: 45, contractWeeksLeft: 52 });
    const poolTrainer = makeTrainer({ id: 'ht1', age: 45 });
    const rival = makeRival('r1', [makeTrainer({ id: 'rt1', age: 45 })]);

    const state = makeGameState({
      week: 52,
      trainers: [playerTrainer],
      hiringPool: [poolTrainer],
      rivals: [rival],
    });

    const { updatedTrainers, updatedHiringPool, rivalsUpdates } = computeTrainerAging(state);

    expect(updatedTrainers[0]!.age).toBe(46);
    expect(updatedHiringPool[0]!.age).toBe(46);
    expect(rivalsUpdates.get('r1' as StableId)?.trainers?.[0]!.age).toBe(46);
  });
});

// ─── runTrainerPass integration ─────────────────────────────────────────────

describe('runTrainerPass', () => {
  it('returns StateImpact with trainers and hiringPool', () => {
    const trainer = makeTrainer({ age: 45, contractWeeksLeft: 52 });
    const state = makeGameState({ week: 1, trainers: [trainer] });
    const impact = runTrainerPass(state);

    expect(impact.trainers).toBeDefined();
    expect(impact.hiringPool).toBeDefined();
    expect(impact.rivalsUpdates).toBeDefined();
  });

  it('includes newsletter items when there are news events', () => {
    const trainer = makeTrainer({ contractWeeksLeft: 1 });
    const state = makeGameState({ week: 1, trainers: [trainer] });
    const impact = runTrainerPass(state);

    expect(impact.newsletterItems).toBeDefined();
    expect(impact.newsletterItems!.length).toBe(1);
    expect(impact.newsletterItems![0]!.title).toBe('Trainer Career Updates');
    expect(impact.newsletterItems![0]!.items.length).toBeGreaterThan(0);
  });

  it('does not include newsletter items when nothing happens', () => {
    const trainer = makeTrainer({ age: 30, contractWeeksLeft: 52 });
    const state = makeGameState({ week: 1, trainers: [trainer] });
    const impact = runTrainerPass(state);

    expect(impact.newsletterItems).toBeUndefined();
  });

  it('passes rivalsUpdates through the impact', () => {
    const rival = makeRival('r1', [makeTrainer({ id: 'rt1', contractWeeksLeft: 1 })]);
    const state = makeGameState({ week: 1, rivals: [rival] });
    const impact = runTrainerPass(state);

    expect(impact.rivalsUpdates).toBeDefined();
    expect(impact.rivalsUpdates!.size).toBe(1);
  });
});
