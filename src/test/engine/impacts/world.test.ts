/**
 * World Domain Impact Handlers — exhaustive coverage for week, day, season,
 * weather, recruitPool, seasonalGrowth, realmRankings, and worldHandlers map.
 */
import { describe, it, expect } from 'vitest';
import type { GameState, RankingEntry, SeasonalGrowth } from '@/types/state.types';
import type { PoolWarrior } from '@/engine/recruitment';
import {
  week,
  day,
  season,
  weather,
  recruitPool,
  seasonalGrowth,
  realmRankings,
  worldHandlers,
} from '@/engine/impacts/world';

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

describe('world impacts — week', () => {
  it('sets state.week to the passed value', () => {
    const state = createMockState({ week: 1 });
    week(state, 5);
    expect(state.week).toBe(5);
  });

  it('sets state.week to 0', () => {
    const state = createMockState({ week: 10 });
    week(state, 0);
    expect(state.week).toBe(0);
  });

  it('overwrites existing week value', () => {
    const state = createMockState({ week: 42 });
    week(state, 7);
    expect(state.week).toBe(7);
  });
});

describe('world impacts — day', () => {
  it('sets state.day to the passed value', () => {
    const state = createMockState({ day: 0 });
    day(state, 3);
    expect(state.day).toBe(3);
  });

  it('sets state.day to 0', () => {
    const state = createMockState({ day: 5 });
    day(state, 0);
    expect(state.day).toBe(0);
  });

  it('overwrites existing day value', () => {
    const state = createMockState({ day: 7 });
    day(state, 2);
    expect(state.day).toBe(2);
  });
});

describe('world impacts — season', () => {
  it('sets state.season to Spring', () => {
    const state = createMockState({ season: 'Winter' });
    season(state, 'Spring');
    expect(state.season).toBe('Spring');
  });

  it('sets state.season to Summer', () => {
    const state = createMockState({ season: 'Spring' });
    season(state, 'Summer');
    expect(state.season).toBe('Summer');
  });

  it('sets state.season to Fall', () => {
    const state = createMockState();
    season(state, 'Fall');
    expect(state.season).toBe('Fall');
  });

  it('sets state.season to Winter', () => {
    const state = createMockState();
    season(state, 'Winter');
    expect(state.season).toBe('Winter');
  });
});

describe('world impacts — weather', () => {
  it('sets state.weather to Clear', () => {
    const state = createMockState({ weather: 'Rainy' });
    weather(state, 'Clear');
    expect(state.weather).toBe('Clear');
  });

  it('sets state.weather to Rainy', () => {
    const state = createMockState();
    weather(state, 'Rainy');
    expect(state.weather).toBe('Rainy');
  });

  it('sets state.weather to Moonlight Duel', () => {
    const state = createMockState();
    weather(state, 'Moonlight Duel');
    expect(state.weather).toBe('Moonlight Duel');
  });
});

describe('world impacts — recruitPool', () => {
  it('sets state.recruitPool to the passed array', () => {
    const state = createMockState({ recruitPool: [] });
    const pool: PoolWarrior[] = [
      {
        id: 'pw1',
        name: 'Recruit1',
        style: 'STRIKING ATTACK' as any,
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        potential: {} as any,
        baseSkills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
        derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 10 },
        tier: 'Common',
        cost: 50,
        age: 18,
        lore: '',
        traits: [],
        addedWeek: 1,
        favorites: {} as any,
        luckfactor: { ATT: 0, PAR: 0, DEF: 0, INI: 0, RIP: 0, DEC: 0 },
      } as PoolWarrior,
    ];
    recruitPool(state, pool);
    expect(state.recruitPool).toBe(pool);
    expect(state.recruitPool).toHaveLength(1);
    expect(state.recruitPool[0]?.name).toBe('Recruit1');
  });

  it('sets state.recruitPool to empty array', () => {
    const state = createMockState();
    recruitPool(state, []);
    expect(state.recruitPool).toEqual([]);
  });

  it('replaces existing recruitPool', () => {
    const state = createMockState({
      recruitPool: [{ id: 'old' } as PoolWarrior],
    });
    const newPool: PoolWarrior[] = [
      { id: 'new1' } as PoolWarrior,
      { id: 'new2' } as PoolWarrior,
    ];
    recruitPool(state, newPool);
    expect(state.recruitPool).toBe(newPool);
    expect(state.recruitPool).toHaveLength(2);
  });
});

describe('world impacts — seasonalGrowth', () => {
  it('sets state.seasonalGrowth to the passed array', () => {
    const state = createMockState({ seasonalGrowth: [] });
    const growth: SeasonalGrowth[] = [
      {
        warriorId: 'w1' as any,
        season: 'Spring',
        gains: { ST: 1, CN: 1 },
      },
    ];
    seasonalGrowth(state, growth);
    expect(state.seasonalGrowth).toBe(growth);
    expect(state.seasonalGrowth).toHaveLength(1);
  });

  it('sets state.seasonalGrowth to empty array', () => {
    const state = createMockState();
    seasonalGrowth(state, []);
    expect(state.seasonalGrowth).toEqual([]);
  });

  it('replaces existing seasonalGrowth', () => {
    const state = createMockState({
      seasonalGrowth: [{ warriorId: 'old' as any, season: 'Spring', gains: {} }],
    });
    const newGrowth: SeasonalGrowth[] = [
      { warriorId: 'new' as any, season: 'Summer', gains: { SP: 2 } },
    ];
    seasonalGrowth(state, newGrowth);
    expect(state.seasonalGrowth).toBe(newGrowth);
    expect(state.seasonalGrowth).toHaveLength(1);
  });
});

describe('world impacts — realmRankings', () => {
  it('sets state.realmRankings to the passed Record', () => {
    const state = createMockState({ realmRankings: {} });
    const rankings: Record<string, RankingEntry> = {
      w1: { overallRank: 1, classRank: 1, compositeScore: 100 },
      w2: { overallRank: 5, classRank: 3, compositeScore: 80 },
    };
    realmRankings(state, rankings);
    expect(state.realmRankings).toBe(rankings);
    expect(Object.keys(state.realmRankings)).toHaveLength(2);
  });

  it('sets state.realmRankings to empty object', () => {
    const state = createMockState();
    realmRankings(state, {});
    expect(state.realmRankings).toEqual({});
  });

  it('replaces existing realmRankings', () => {
    const state = createMockState({
      realmRankings: { old: { overallRank: 10, classRank: 5, compositeScore: 50 } } as Record<string, RankingEntry>,
    });
    const newRankings: Record<string, RankingEntry> = {
      new1: { overallRank: 1, classRank: 1, compositeScore: 100 },
    };
    realmRankings(state, newRankings);
    expect(state.realmRankings).toBe(newRankings);
    expect(Object.keys(state.realmRankings)).toHaveLength(1);
  });
});

describe('world impacts — worldHandlers map', () => {
  it('has all 7 handler keys', () => {
    expect(Object.keys(worldHandlers)).toHaveLength(7);
    expect(Object.keys(worldHandlers).sort()).toEqual(
      ['day', 'recruitPool', 'realmRankings', 'season', 'seasonalGrowth', 'weather', 'week'].sort()
    );
  });

  it('worldHandlers.week === week function', () => {
    expect(worldHandlers.week).toBe(week);
  });

  it('worldHandlers.day === day function', () => {
    expect(worldHandlers.day).toBe(day);
  });

  it('worldHandlers.season === season function', () => {
    expect(worldHandlers.season).toBe(season);
  });

  it('worldHandlers.weather === weather function', () => {
    expect(worldHandlers.weather).toBe(weather);
  });

  it('worldHandlers.recruitPool === recruitPool function', () => {
    expect(worldHandlers.recruitPool).toBe(recruitPool);
  });

  it('worldHandlers.seasonalGrowth === seasonalGrowth function', () => {
    expect(worldHandlers.seasonalGrowth).toBe(seasonalGrowth);
  });

  it('worldHandlers.realmRankings === realmRankings function', () => {
    expect(worldHandlers.realmRankings).toBe(realmRankings);
  });

  it('each handler mutates state correctly when called through the map', () => {
    const state = createMockState();
    worldHandlers.week(state, 99);
    expect(state.week).toBe(99);

    worldHandlers.day(state, 4);
    expect(state.day).toBe(4);

    worldHandlers.season(state, 'Winter');
    expect(state.season).toBe('Winter');

    worldHandlers.weather(state, 'Rainy');
    expect(state.weather).toBe('Rainy');

    worldHandlers.recruitPool(state, []);
    expect(state.recruitPool).toEqual([]);

    worldHandlers.seasonalGrowth(state, []);
    expect(state.seasonalGrowth).toEqual([]);

    worldHandlers.realmRankings(state, {});
    expect(state.realmRankings).toEqual({});
  });
});
