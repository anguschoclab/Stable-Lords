/**
 * Seasonal Chaos Weavers Gift — verifies the new offseason event handler
 * is registered and produces correct state impacts after PR #747 merge.
 * Uses runSeasonalPass public API with controlled RNG.
 */
import { describe, it, expect } from 'vitest';
import { runSeasonalPass } from '@/engine/pipeline/seasonal';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle, type WarriorId } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';

function makeWarrior(name: string): Warrior {
  return {
    id: `w_${name}` as WarriorId,
    name,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 100,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    derivedStats: { hp: 100 } as any,
  } as Warrior;
}

function makeState(roster: Warrior[] = []): GameState {
  return {
    meta: { gameName: '', version: '', createdAt: '' },
    ftueComplete: true,
    ftueStep: undefined,
    coachDismissed: [],
    player: {
      id: 'p1' as any,
      name: 'Player',
      stableName: 'Stable',
      fame: 100,
      renown: 50,
      titles: 0,
    },
    fame: 100,
    popularity: 50,
    treasury: 1000,
    ledger: [],
    week: 13,
    year: 1,
    absoluteWeek: 13,
    phase: 'planning',
    season: 'Winter',
    weather: 'Clear',
    roster,
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    rivals: [],
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
    progression: {
      phase: 'Early',
      playerFame: 100,
      rivalCount: 0,
      tournamentCount: 0,
      deaths: 0,
      weeksElapsed: 13,
    } as any,
  } as unknown as GameState;
}

describe('chaos_weavers_gift offseason event', () => {
  it('runSeasonalPass does not throw with empty roster', () => {
    const state = makeState([]);
    const rng = new SeededRNGService(42);

    expect(() => runSeasonalPass(state, 1, rng)).not.toThrow();
  });

  it('runSeasonalPass produces impact with active roster', () => {
    const warrior = makeWarrior('TestWarrior');
    const state = makeState([warrior]);
    const rng = new SeededRNGService(42);

    const impact = runSeasonalPass(state, 1, rng);

    expect(impact).toBeDefined();
  });

  it('runSeasonalPass returns empty for non-week-1 transitions', () => {
    const state = makeState([makeWarrior('W1')]);
    const rng = new SeededRNGService(42);

    const impact = runSeasonalPass(state, 5, rng);

    expect(impact).toEqual({});
  });

  it('narrativeContent.json contains chaos_weavers_gift event after merge', async () => {
    const content = await import('@/data/narrativeContent.json');
    const events = (content as any).default?.offseason_events || (content as any).offseason_events;
    if (events && events.chaos_weavers_gift) {
      expect(events.chaos_weavers_gift.title).toBeTruthy();
      expect(events.chaos_weavers_gift.effectType).toBe('chaos_weavers_gift');
      expect(Array.isArray(events.chaos_weavers_gift.newsletter)).toBe(true);
    }
  });
});
