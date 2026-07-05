import { describe, it, expect, vi, afterEach } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData, GameState } from '@/types/state.types';
import {
  buildSuccessorIndex,
  handleOwnerLifecycle,
  runRivalStrategyPass,
} from '@/engine/pipeline/passes/RivalStrategyPass';
import { SeededRNG } from '@/utils/random';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeWarrior(
  id: string,
  name: string,
  overrides: Partial<Warrior> = {}
): Warrior {
  return {
    id: id as WarriorId,
    name,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    ...overrides,
  } as Warrior;
}

function makeRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1' as any,
    owner: {
      id: 'rival-1' as any,
      name: 'Owner One',
      stableName: 'Stable One',
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
    },
    roster: [],
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    ...overrides,
  } as RivalStableData;
}

function makeMinimalState(rivals: RivalStableData[]): GameState {
  const warriorMap = new Map<string, Warrior>();
  const warriorToStableMap = new Map<string, { stableId: string; isPlayer: boolean }>();
  const rivalMap = new Map<string, RivalStableData>();

  for (const rival of rivals) {
    rivalMap.set(rival.id as string, rival);
    for (const w of rival.roster) {
      warriorMap.set(w.id, w);
      warriorToStableMap.set(w.id, { stableId: rival.id as string, isPlayer: false });
    }
  }

  return {
    meta: { gameName: '', version: '', createdAt: '' },
    ftueComplete: true,
    ftueStep: undefined,
    coachDismissed: [],
    player: {
      id: 'player-1' as any,
      name: 'Player',
      stableName: 'Player Stable',
      fame: 0,
      renown: 0,
      titles: 0,
    },
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
    rivals,
    gazettes: [],
    hallOfFame: [],
    crowdMood: 'Calm',
    tournaments: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    unacknowledgedDeaths: [],
    isFTUE: false,
    day: 1,
    isTournamentWeek: false,
    promoters: {},
    boutOffers: {},
    activeTournamentId: undefined,
    realmRankings: {},
    awards: [],
    bookmarks: [],
    progression: {} as any,
    warriorMap,
    warriorToStableMap,
    rivalMap,
  } as any;
}

function makeMockRng(returns: number[]): IRNGServiceLike {
  let i = 0;
  return {
    next: () => returns[i++] ?? returns[returns.length - 1] ?? 0,
    pick: <T>(arr: T[]): T => arr[0]!,
    uuid: (p?: string) => `${p ?? 'id'}-${Math.random()}`,
    roll: (min: number, _max: number) => min,
    shuffle: <T>(arr: T[]): T[] => arr,
    pickWeighted: <T>(items: T[]): T => items[0]!,
    chance: (p: number) => p > 0,
  };
}

interface IRNGServiceLike {
  next(): number;
  pick<T>(array: T[]): T;
  uuid(prefix?: string): string;
  roll(min: number, max: number): number;
  shuffle<T>(array: T[]): T[];
  pickWeighted<T>(items: T[], weights: number[]): T;
  chance(probability: number): boolean;
}

// ─── Suite 1: buildSuccessorIndex ──────────────────────────────────────────

describe('buildSuccessorIndex', () => {
  it('undefined retired → empty Map', () => {
    const index = buildSuccessorIndex(undefined);
    expect(index.size).toBe(0);
  });

  it('empty retired array → empty Map', () => {
    const index = buildSuccessorIndex([]);
    expect(index.size).toBe(0);
  });

  it('warrior with fame > 200 and stableId set → in Map', () => {
    const w = makeWarrior('w1', 'Hero', { fame: 250, stableId: 'stable-a' as StableId });
    const index = buildSuccessorIndex([w]);
    expect(index.get('stable-a' as StableId)).toBe(w);
  });

  it('warrior with fame === 200 → NOT in Map (strict >)', () => {
    const w = makeWarrior('w1', 'Hero', { fame: 200, stableId: 'stable-a' as StableId });
    const index = buildSuccessorIndex([w]);
    expect(index.has('stable-a' as StableId)).toBe(false);
  });

  it('warrior with fame === 201 → in Map', () => {
    const w = makeWarrior('w1', 'Hero', { fame: 201, stableId: 'stable-a' as StableId });
    const index = buildSuccessorIndex([w]);
    expect(index.get('stable-a' as StableId)).toBe(w);
  });

  it('warrior with undefined stableId → NOT in Map', () => {
    const w = makeWarrior('w1', 'Hero', { fame: 300, stableId: undefined });
    const index = buildSuccessorIndex([w]);
    expect(index.size).toBe(0);
  });

  it('multiple warriors same stable, both fame > 200 → first in array wins', () => {
    const w1 = makeWarrior('w1', 'First', { fame: 300, stableId: 'stable-a' as StableId });
    const w2 = makeWarrior('w2', 'Second', { fame: 500, stableId: 'stable-a' as StableId });
    const index = buildSuccessorIndex([w1, w2]);
    expect(index.get('stable-a' as StableId)).toBe(w1);
    expect(index.size).toBe(1);
  });

  it('warriors from different stables → both in Map', () => {
    const w1 = makeWarrior('w1', 'Alpha', { fame: 300, stableId: 'stable-a' as StableId });
    const w2 = makeWarrior('w2', 'Beta', { fame: 400, stableId: 'stable-b' as StableId });
    const index = buildSuccessorIndex([w1, w2]);
    expect(index.size).toBe(2);
    expect(index.get('stable-a' as StableId)).toBe(w1);
    expect(index.get('stable-b' as StableId)).toBe(w2);
  });

  it('warrior with fame undefined → NOT in Map (defensive || 0)', () => {
    const w = makeWarrior('w1', 'Hero', { fame: undefined as any, stableId: 'stable-a' as StableId });
    const index = buildSuccessorIndex([w]);
    expect(index.size).toBe(0);
  });
});

// ─── Suite 2: handleOwnerLifecycle ─────────────────────────────────────────

describe('handleOwnerLifecycle', () => {
  it('age < 65, rng returns 0 → no succession', () => {
    const rival = makeRival({ owner: { ...makeRival().owner, age: 50 } });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([0]);
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival, gazetteItems } = handleOwnerLifecycle(rival, 5, rng as any, index);

    expect(updatedRival.owner.name).toBe('Owner One');
    expect(gazetteItems.length).toBe(0);
  });

  it('age 65-74, rng < 0.05 → succession with successor candidate', () => {
    const successor = makeWarrior('w_succ', 'Champion Retired', {
      fame: 300,
      stableId: 'rival-1' as StableId,
    });
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 70, fame: 200, generation: 1 },
    });
    const state = makeMinimalState([rival]);
    state.retired = [successor];
    const rng = makeMockRng([0.04, 0.5]); // first next() triggers succession, second for age
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival, gazetteItems } = handleOwnerLifecycle(rival, 5, rng as any, index);

    expect(updatedRival.owner.name).toBe('Champion Retired');
    expect(updatedRival.owner.generation).toBe(2);
    expect(gazetteItems.length).toBe(1);
    expect(gazetteItems[0]).toContain('SUCCESSION');
    expect(gazetteItems[0]).toContain('Champion Retired');
  });

  it('age 75+, rng < 0.2 → succession with no successor → generic name', () => {
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 200, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([0.1, 0.5]);
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival, gazetteItems } = handleOwnerLifecycle(rival, 5, rng as any, index);

    expect(updatedRival.owner.name).toBe('Lord Stable II');
    expect(updatedRival.owner.generation).toBe(1);
    expect(gazetteItems[0]).toContain('Lord Stable II');
  });

  it('week 1 → owner age increments by 1', () => {
    const rival = makeRival({ owner: { ...makeRival().owner, age: 50 } });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([1]); // high value → no succession
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival } = handleOwnerLifecycle(rival, 1, rng as any, index);

    expect(updatedRival.owner.age).toBe(51);
  });

  it('succession → fame reset to 40% of original', () => {
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 500, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([0.1, 0.5]);
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival } = handleOwnerLifecycle(rival, 5, rng as any, index);

    expect(updatedRival.owner.fame).toBe(200); // 500 * 0.4 = 200
  });

  it('succession → new age in range [25, 39]', () => {
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 200, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([0.1, 0.0]); // age = 25 + floor(0 * 15) = 25
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival } = handleOwnerLifecycle(rival, 5, rng as any, index);

    expect(updatedRival.owner.age).toBeGreaterThanOrEqual(25);
    expect(updatedRival.owner.age).toBeLessThanOrEqual(39);
  });
});

// ─── Suite 3: Integration via runRivalStrategyPass ─────────────────────────

describe('runRivalStrategyPass successor integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retired warrior with fame > 200 and matching stableId → successor name in gazette', async () => {
    // Force SeededRNG.next() to return 0.1 so succession triggers (0.1 < 0.2 for age 80)
    vi.spyOn(SeededRNG.prototype, 'next').mockReturnValue(0.1);

    vi.spyOn(
      await import('@/engine/matchmaking/worldMatchmaking'),
      'planWorldBouts'
    ).mockReturnValue([]);

    const successor = makeWarrior('w_succ', 'Legendary Fighter', {
      fame: 350,
      stableId: 'rival-1' as StableId,
    });
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 200, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    state.retired = [successor];
    state.recruitPool = [];

    const impact = runRivalStrategyPass(state, 6, undefined as any, true);

    expect(impact.newsletterItems).toBeDefined();
    const allGazetteText = (impact.newsletterItems || [])
      .flatMap((n) => n.items)
      .join(' ');
    expect(allGazetteText).toContain('Legendary Fighter');
  });

  it('retired warrior with fame <= 200 → generic Lord name in gazette', async () => {
    vi.spyOn(SeededRNG.prototype, 'next').mockReturnValue(0.1);

    vi.spyOn(
      await import('@/engine/matchmaking/worldMatchmaking'),
      'planWorldBouts'
    ).mockReturnValue([]);

    const nonSuccessor = makeWarrior('w_low', 'Low Fame Fighter', {
      fame: 150,
      stableId: 'rival-1' as StableId,
    });
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 200, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    state.retired = [nonSuccessor];
    state.recruitPool = [];

    const impact = runRivalStrategyPass(state, 6, undefined as any, true);

    expect(impact.newsletterItems).toBeDefined();
    const allGazetteText = (impact.newsletterItems || [])
      .flatMap((n) => n.items)
      .join(' ');
    expect(allGazetteText).toContain('Lord Stable');
  });
});
