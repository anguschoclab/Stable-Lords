import { describe, it, expect } from 'vitest';
import { processWeekBouts } from '@/engine/bout/services/boutProcessorService';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';

function makeMinimalWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: crypto.randomUUID() as any,
    name: 'Test Warrior',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    traits: [],
    ...overrides,
  } as Warrior;
}

function makeBaseState(): GameState {
  return {
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
    week: 1,
    year: 1,
    treasury: 1000,
    fame: 0,
    roster: [],
    rivals: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    graveyard: [],
    trainers: [],
    hiringPool: [],
    recruitPool: [],
    scoutReports: [],
    hallOfFame: [],
    retired: [],
    player: {
      id: 'player-1',
      name: 'Player',
      stableName: 'Player Stable',
      fame: 0,
      renown: 0,
      titles: 0,
    } as any,
    crowdMood: 'Calm',
    moodHistory: [],
    tournaments: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    ownerGrudges: [],
    insightTokens: [],
    unacknowledgedDeaths: [],
    day: 0,
    isTournamentWeek: false,
    activeTournamentId: undefined,
    promoters: {},
    boutOffers: {},
    realmRankings: {},
    awards: [],
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    ledger: [],
    popularity: 0,
    rosterBonus: 0,
    ftueComplete: false,
    ftueStep: 0,
    coachDismissed: [],
    isFTUE: true,
  } as GameState;
}

describe('processWeekBouts — Minimum Viable Arena', () => {
  it('should return empty results when fewer than 2 eligible warriors exist', () => {
    const state = makeBaseState();
    // One player warrior, high fatigue — not fight-ready
    state.roster = [makeMinimalWarrior({ id: 'w1' as any, name: 'Tired', fatigue: 60 })];

    const { results, summary } = processWeekBouts(state);

    expect(results).toHaveLength(0);
    expect(summary.bouts).toBe(0);
    expect(summary.deaths).toBe(0);
  });

  it('should still produce a gazette on quiet weeks via Empty headline templates', () => {
    const state = makeBaseState();
    state.roster = [makeMinimalWarrior({ id: 'w1' as any, name: 'Tired', fatigue: 60 })];

    const { impact } = processWeekBouts(state);

    expect(impact.gazettes).toBeDefined();
    expect(impact.gazettes!.length).toBe(1);

    const gazette = impact.gazettes![0]!;
    expect(gazette.headline).toBeTruthy();
    expect(gazette.week).toBe(state.week);
  });

  it('should not return manual newsletterItems for quiet weeks (gazette system handles it)', () => {
    const state = makeBaseState();
    state.roster = [makeMinimalWarrior({ id: 'w1' as any, name: 'Tired', fatigue: 60 })];

    const { impact } = processWeekBouts(state);

    // The quiet week path should NOT inject manual newsletter items
    expect(impact.newsletterItems).toBeUndefined();
  });

  it('should count rival stables when checking eligible warriors', () => {
    const state = makeBaseState();
    // Player has 1 eligible warrior
    state.roster = [makeMinimalWarrior({ id: 'w1' as any, name: 'Ready', fatigue: 0 })];
    // Rival has 1 eligible warrior — total = 2, should proceed to pairings
    state.rivals = [
      {
        id: 'rival-1',
        owner: { id: 'owner-1', name: 'Rival', stableName: 'Rival Stable', fame: 0, renown: 0, titles: 0 } as any,
        roster: [makeMinimalWarrior({ id: 'w2' as any, name: 'Rival Ready', fatigue: 0 })],
        treasury: 100,
        fame: 0,
      } as any,
    ];

    const { results } = processWeekBouts(state);

    // With exactly 2 eligible warriors across all stables, pairings may still be empty
    // if no signed contracts exist, but the guard should NOT early return
    // We just verify the function does not throw and returns normally
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return early when exactly 1 eligible warrior exists across all stables', () => {
    const state = makeBaseState();
    // Only 1 eligible total: player has 1 ready, rival has 1 tired
    state.roster = [makeMinimalWarrior({ id: 'w1' as any, name: 'Ready', fatigue: 0 })];
    state.rivals = [
      {
        id: 'rival-1',
        owner: { id: 'owner-1', name: 'Rival', stableName: 'Rival Stable', fame: 0, renown: 0, titles: 0 } as any,
        roster: [makeMinimalWarrior({ id: 'w2' as any, name: 'Tired', fatigue: 60 })],
        treasury: 100,
        fame: 0,
      } as any,
    ];

    const { results, impact } = processWeekBouts(state);

    expect(results).toHaveLength(0);
    expect(impact.gazettes).toBeDefined();
  });
});
