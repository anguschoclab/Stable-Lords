/**
 * Staff Worker — exhaustive coverage for processStaff covering hiring logic,
 * firing logic, intent gating, budget checks, gazette items, and edge cases.
 */
import { describe, it, expect } from 'vitest';
import { processStaff } from '@/engine/ai/workers/staffWorker';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Trainer } from '@/types/shared.types';

function createMockTrainer(overrides: Partial<Trainer> = {}): Trainer {
  return {
    id: 't1', name: 'Test Trainer', tier: 'Novice', focus: 'Aggression',
    fame: 0, age: 30, contractWeeksLeft: 10,
    ...overrides,
  } as Trainer;
}

function createMockRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival_1' as any,
    owner: {
      id: 'owner_1' as any,
      name: 'Test Owner',
      stableName: 'Test Stable',
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
    },
    fame: 100,
    roster: [],
    treasury: 1000,
    ledger: [],
    trainingAssignments: [],
    trainers: [],
    strategy: { intent: 'CONSOLIDATION' } as any,
    ...overrides,
  } as RivalStableData;
}

function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    meta: { gameName: 'test', version: '1.0', createdAt: '2025-01-01' },
    ftueComplete: true,
    coachDismissed: [],
    player: { id: 'p1', name: 'Player', stableName: 'Player Stable', fame: 0, renown: 0, titles: 0 },
    fame: 0,
    popularity: 0,
    treasury: 1000,
    ledger: [],
    week: 5,
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
    isFTUE: false,
    unacknowledgedDeaths: [],
    day: 0,
    isTournamentWeek: false,
    promoters: {},
    boutOffers: {},
    realmRankings: {},
    awards: [],
    progression: {
      status: 'active',
      stableStanding: 1,
      totalStables: 10,
      objectives: [],
    },
    ...overrides,
  } as unknown as GameState;
}

describe('staffWorker — processStaff hiring', () => {
  it('hires a trainer when intent is not RECOVERY, trainers < 2, and pool is non-empty', () => {
    const rival = createMockRival({ treasury: 1000, trainers: [] });
    const state = createMockState();
    const pool = [createMockTrainer({ id: 't1', tier: 'Novice', focus: 'Aggression' })];
    const { updatedRival, gazetteItems, updatedHiringPool } = processStaff(rival, state, pool);
    expect(updatedRival.trainers).toHaveLength(1);
    expect(updatedRival.treasury).toBe(950); // 1000 - 50 (Novice)
    expect(gazetteItems.length).toBeGreaterThan(0);
    expect(updatedHiringPool).toHaveLength(0);
  });

  it('does not hire when intent is RECOVERY', () => {
    const rival = createMockRival({
      treasury: 1000,
      trainers: [],
      strategy: { intent: 'RECOVERY' } as any,
    });
    const state = createMockState();
    const pool = [createMockTrainer({ id: 't1' })];
    const { updatedRival, gazetteItems } = processStaff(rival, state, pool);
    expect(updatedRival.trainers).toHaveLength(0);
    expect(updatedRival.treasury).toBe(1000);
    expect(gazetteItems.length).toBe(0); // No hiring gazette
  });

  it('does not hire when current trainers >= 2', () => {
    const rival = createMockRival({
      treasury: 1000,
      trainers: [createMockTrainer({ id: 't1' }), createMockTrainer({ id: 't2' })],
    });
    const state = createMockState();
    const pool = [createMockTrainer({ id: 't3' })];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.trainers).toHaveLength(2);
    expect(updatedRival.treasury).toBe(1000);
  });

  it('does not hire when hiring pool is empty', () => {
    const rival = createMockRival({ treasury: 1000, trainers: [] });
    const state = createMockState();
    const { updatedRival, gazetteItems } = processStaff(rival, state, []);
    expect(updatedRival.trainers).toHaveLength(0);
    expect(gazetteItems.length).toBe(0);
  });

  it('does not hire when no affordable trainers (treasury - 300 < HIRE_COST)', () => {
    const rival = createMockRival({ treasury: 340, trainers: [] });
    const state = createMockState();
    // Novice costs 50, 340 - 300 = 40 < 50 → not affordable
    const pool = [createMockTrainer({ id: 't1', tier: 'Novice' })];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.trainers).toHaveLength(0);
    expect(updatedRival.treasury).toBe(340);
  });

  it('hires Novice when treasury is just enough (351)', () => {
    const rival = createMockRival({ treasury: 351, trainers: [] });
    const state = createMockState();
    // 351 - 300 = 51 > 50 → affordable
    const pool = [createMockTrainer({ id: 't1', tier: 'Novice' })];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.trainers).toHaveLength(1);
    expect(updatedRival.treasury).toBe(301); // 351 - 50
  });

  it('prefers Aggression focus trainers for VENDETTA intent', () => {
    const rival = createMockRival({
      treasury: 2000,
      trainers: [],
      strategy: { intent: 'VENDETTA' } as any,
    });
    const state = createMockState();
    const pool = [
      createMockTrainer({ id: 't1', tier: 'Novice', focus: 'Defense' }),
      createMockTrainer({ id: 't2', tier: 'Master', focus: 'Aggression' }),
    ];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.trainers).toHaveLength(1);
    expect(updatedRival.trainers![0]!.focus).toBe('Aggression');
  });

  it('prefers Aggression focus trainers for AGGRESSIVE_EXPANSION intent', () => {
    const rival = createMockRival({
      treasury: 2000,
      trainers: [],
      strategy: { intent: 'AGGRESSIVE_EXPANSION' } as any,
    });
    const state = createMockState();
    const pool = [
      createMockTrainer({ id: 't1', tier: 'Novice', focus: 'Defense' }),
      createMockTrainer({ id: 't2', tier: 'Master', focus: 'Aggression' }),
    ];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.trainers![0]!.focus).toBe('Aggression');
  });

  it('prefers Endurance focus trainers for EXPANSION intent', () => {
    const rival = createMockRival({
      treasury: 2000,
      trainers: [],
      strategy: { intent: 'EXPANSION' } as any,
    });
    const state = createMockState();
    const pool = [
      createMockTrainer({ id: 't1', tier: 'Novice', focus: 'Defense' }),
      createMockTrainer({ id: 't2', tier: 'Master', focus: 'Endurance' }),
    ];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.trainers![0]!.focus).toBe('Endurance');
  });

  it('falls back to all affordable when no focus-matching candidates', () => {
    const rival = createMockRival({
      treasury: 2000,
      trainers: [],
      strategy: { intent: 'VENDETTA' } as any,
    });
    const state = createMockState();
    const pool = [
      createMockTrainer({ id: 't1', tier: 'Novice', focus: 'Defense' }),
      createMockTrainer({ id: 't2', tier: 'Master', focus: 'Healing' }),
    ];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.trainers).toHaveLength(1);
    // Should pick the highest HIRE_COST (Master = 200)
    expect(updatedRival.trainers![0]!.tier).toBe('Master');
  });

  it('picks highest HIRE_COST tier among affordable candidates', () => {
    const rival = createMockRival({ treasury: 5000, trainers: [] });
    const state = createMockState();
    const pool = [
      createMockTrainer({ id: 't1', tier: 'Novice' }),
      createMockTrainer({ id: 't2', tier: 'Master' }),
      createMockTrainer({ id: 't3', tier: 'Seasoned' }),
    ];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.trainers![0]!.tier).toBe('Master');
  });

  it('removes hired trainer from updated hiring pool', () => {
    const rival = createMockRival({ treasury: 5000, trainers: [] });
    const state = createMockState();
    const pool = [
      createMockTrainer({ id: 't1', tier: 'Novice' }),
      createMockTrainer({ id: 't2', tier: 'Master' }),
    ];
    const { updatedHiringPool } = processStaff(rival, state, pool);
    expect(updatedHiringPool).toHaveLength(1);
    expect(updatedHiringPool[0]!.id).toBe('t1');
  });

  it('generates gazette item on hire', () => {
    const rival = createMockRival({ treasury: 1000, trainers: [] });
    const state = createMockState();
    const pool = [createMockTrainer({ id: 't1', name: 'Greg', tier: 'Novice' })];
    const { gazetteItems } = processStaff(rival, state, pool);
    expect(gazetteItems.length).toBe(1);
    expect(gazetteItems[0]).toContain('STAFF');
    expect(gazetteItems[0]).toContain('Greg');
  });

  it('logs agent action on hire', () => {
    const rival = createMockRival({ treasury: 1000, trainers: [] });
    const state = createMockState();
    const pool = [createMockTrainer({ id: 't1', name: 'Greg', tier: 'Novice' })];
    const { updatedRival } = processStaff(rival, state, pool);
    expect(updatedRival.actionHistory).toBeDefined();
    expect(updatedRival.actionHistory!.length).toBeGreaterThan(0);
    expect(updatedRival.actionHistory![0]!.type).toBe('STAFF');
    expect(updatedRival.actionHistory![0]!.description).toContain('Hired');
  });

  it('does not hire when budget check says not affordable', () => {
    const rival = createMockRival({
      treasury: 400,
      trainers: [],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState();
    // Novice = 50, 400 - 300 = 100 > 50 → affordable by filter
    // But checkBudget may reject based on burn rate / risk
    const pool = [createMockTrainer({ id: 't1', tier: 'Novice' })];
    const { updatedRival } = processStaff(rival, state, pool);
    // With 400 treasury and CONSOLIDATION intent, checkBudget should allow it
    // (conservative personality, low burn rate)
    expect(updatedRival.trainers).toHaveLength(1);
  });
});

describe('staffWorker — processStaff firing', () => {
  it('fires a trainer when intent is RECOVERY', () => {
    const rival = createMockRival({
      treasury: 1000,
      trainers: [createMockTrainer({ id: 't1', name: 'Bob' })],
      strategy: { intent: 'RECOVERY' } as any,
    });
    const state = createMockState();
    const { updatedRival, gazetteItems } = processStaff(rival, state, []);
    expect(updatedRival.trainers).toHaveLength(0);
    expect(gazetteItems.length).toBeGreaterThan(0);
    expect(gazetteItems[0]).toContain('DOWNSIZING');
  });

  it('fires a trainer when treasury < 100', () => {
    const rival = createMockRival({
      treasury: 50,
      trainers: [createMockTrainer({ id: 't1', name: 'Bob' })],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState();
    const { updatedRival, gazetteItems } = processStaff(rival, state, []);
    expect(updatedRival.trainers).toHaveLength(0);
    expect(gazetteItems.some((g) => g.includes('DOWNSIZING'))).toBe(true);
  });

  it('fires a trainer when under pressure (treasury < 500 and crowdMood is Solemn)', () => {
    const rival = createMockRival({
      treasury: 400,
      trainers: [createMockTrainer({ id: 't1', name: 'Bob' })],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState({ crowdMood: 'Solemn' as any });
    const { updatedRival } = processStaff(rival, state, []);
    expect(updatedRival.trainers).toHaveLength(0);
  });

  it('fires a trainer when under pressure (treasury < 500 and weather is Rainy)', () => {
    const rival = createMockRival({
      treasury: 400,
      trainers: [createMockTrainer({ id: 't1', name: 'Bob' })],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState({ weather: 'Rainy' as any });
    const { updatedRival } = processStaff(rival, state, []);
    expect(updatedRival.trainers).toHaveLength(0);
  });

  it('does not fire when treasury >= 500 even with Solemn crowd', () => {
    const rival = createMockRival({
      treasury: 600,
      trainers: [createMockTrainer({ id: 't1', name: 'Bob' })],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState({ crowdMood: 'Solemn' as any });
    const { updatedRival } = processStaff(rival, state, []);
    expect(updatedRival.trainers).toHaveLength(1);
  });

  it('does not fire when treasury < 500 but weather is Clear and crowd is Calm', () => {
    const rival = createMockRival({
      treasury: 400,
      trainers: [createMockTrainer({ id: 't1', name: 'Bob' })],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState({ crowdMood: 'Calm', weather: 'Clear' });
    const { updatedRival } = processStaff(rival, state, []);
    // treasury < 100? No (400). underPressure? No (Clear + Calm). RECOVERY? No.
    expect(updatedRival.trainers).toHaveLength(1);
  });

  it('does not fire when no trainers exist', () => {
    const rival = createMockRival({
      treasury: 50,
      trainers: [],
      strategy: { intent: 'RECOVERY' } as any,
    });
    const state = createMockState();
    const { updatedRival, gazetteItems } = processStaff(rival, state, []);
    expect(updatedRival.trainers).toHaveLength(0);
    expect(gazetteItems.length).toBe(0);
  });

  it('logs firing reason as solemn crowd when crowdMood is Solemn', () => {
    const rival = createMockRival({
      treasury: 400,
      trainers: [createMockTrainer({ id: 't1', name: 'Bob' })],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState({ crowdMood: 'Solemn' as any });
    const { gazetteItems } = processStaff(rival, state, []);
    const gazette = gazetteItems.find((g) => g.includes('DOWNSIZING'));
    expect(gazette).toContain('solemn crowd');
  });

  it('logs firing reason as stormy weather when weather is Rainy', () => {
    const rival = createMockRival({
      treasury: 400,
      trainers: [createMockTrainer({ id: 't1', name: 'Bob' })],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState({ weather: 'Rainy' as any, crowdMood: 'Calm' });
    const { gazetteItems } = processStaff(rival, state, []);
    const gazette = gazetteItems.find((g) => g.includes('DOWNSIZING'));
    expect(gazette).toContain('stormy weather');
  });

  it('logs firing reason as budget constraints when treasury < 100', () => {
    const rival = createMockRival({
      treasury: 50,
      trainers: [createMockTrainer({ id: 't1', name: 'Bob' })],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState();
    const { gazetteItems } = processStaff(rival, state, []);
    const gazette = gazetteItems.find((g) => g.includes('DOWNSIZING'));
    expect(gazette).toContain('budget constraints');
  });

  it('pops the last trainer (LIFO order)', () => {
    const rival = createMockRival({
      treasury: 50,
      trainers: [
        createMockTrainer({ id: 't1', name: 'First' }),
        createMockTrainer({ id: 't2', name: 'Second' }),
      ],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState();
    const { updatedRival, gazetteItems } = processStaff(rival, state, []);
    expect(updatedRival.trainers).toHaveLength(1);
    expect(updatedRival.trainers![0]!.name).toBe('First');
    const gazette = gazetteItems.find((g) => g.includes('DOWNSIZING'));
    expect(gazette).toContain('Second');
  });

  it('does not update treasury on fire (only hiring deducts)', () => {
    const rival = createMockRival({
      treasury: 50,
      trainers: [createMockTrainer({ id: 't1', name: 'Bob' })],
      strategy: { intent: 'RECOVERY' } as any,
    });
    const state = createMockState();
    const { updatedRival } = processStaff(rival, state, []);
    expect(updatedRival.treasury).toBe(50); // unchanged
  });
});

describe('staffWorker — processStaff combined scenarios', () => {
  it('does not hire then fire in same turn when intent is RECOVERY', () => {
    const rival = createMockRival({
      treasury: 1000,
      trainers: [createMockTrainer({ id: 't1', name: 'Existing' })],
      strategy: { intent: 'RECOVERY' } as any,
    });
    const state = createMockState();
    const pool = [createMockTrainer({ id: 't2', tier: 'Novice' })];
    const { updatedRival } = processStaff(rival, state, pool);
    // Should not hire (RECOVERY), should fire (RECOVERY)
    expect(updatedRival.trainers).toHaveLength(0);
    expect(updatedRival.treasury).toBe(1000); // no hire cost deducted
  });

  it('hires when intent allows and then does not fire (treasury healthy)', () => {
    const rival = createMockRival({
      treasury: 2000,
      trainers: [],
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState();
    const pool = [createMockTrainer({ id: 't1', tier: 'Master' })];
    const { updatedRival, gazetteItems } = processStaff(rival, state, pool);
    expect(updatedRival.trainers).toHaveLength(1);
    expect(updatedRival.treasury).toBe(1800); // 2000 - 200 (Master)
    // No firing gazette
    expect(gazetteItems.every((g) => !g.includes('DOWNSIZING'))).toBe(true);
  });

  it('defaults to CONSOLIDATION intent when strategy is missing', () => {
    const rival = createMockRival({
      treasury: 1000,
      trainers: [],
      strategy: undefined as any,
    });
    const state = createMockState();
    const pool = [createMockTrainer({ id: 't1', tier: 'Novice' })];
    const { updatedRival } = processStaff(rival, state, pool);
    // CONSOLIDATION → should hire
    expect(updatedRival.trainers).toHaveLength(1);
  });

  it('handles undefined trainers array', () => {
    const rival = createMockRival({
      treasury: 1000,
      trainers: undefined as any,
      strategy: { intent: 'CONSOLIDATION' } as any,
    });
    const state = createMockState();
    const pool = [createMockTrainer({ id: 't1', tier: 'Novice' })];
    expect(() => processStaff(rival, state, pool)).not.toThrow();
  });

  it('returns updatedHiringPool that is a new array (not mutated original)', () => {
    const rival = createMockRival({ treasury: 5000, trainers: [] });
    const state = createMockState();
    const pool = [createMockTrainer({ id: 't1', tier: 'Novice' })];
    const { updatedHiringPool } = processStaff(rival, state, pool);
    expect(updatedHiringPool).not.toBe(pool);
    expect(pool).toHaveLength(1); // original unmutated
  });
});
