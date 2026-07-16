import { describe, it, expect } from 'vitest';
import { findWarriorById, clearWarriorCache } from '@/engine/core/warriorLookup';
import type { GameState, TournamentEntry, Warrior, RivalStableData } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';

function makeWarrior(id: string, name?: string): Warrior {
  return {
    id: id as Warrior['id'],
    name: name ?? `Warrior ${id}`,
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
  } as Warrior;
}

function makeRival(id: string, warriors: Warrior[]): RivalStableData {
  return {
    id: id as RivalStableData['id'],
    owner: {
      id: `owner-${id}` as RivalStableData['owner']['id'],
      name: `Owner ${id}`,
      stableName: `Stable ${id}`,
      fame: 0,
      renown: 0,
      titles: 0,
    },
    fame: 0,
    roster: warriors,
    treasury: 0,
    ledger: [],
    trainingAssignments: [],
  } as RivalStableData;
}

function makeState(roster: Warrior[], rivals: RivalStableData[] = []): GameState {
  return {
    meta: { gameName: 'test', version: '1', createdAt: '2024-01-01' },
    ftueComplete: true,
    coachDismissed: [],
    player: {
      id: 'p1' as any,
      name: 'Player',
      stableName: 'Player Stable',
      fame: 0,
      renown: 0,
      titles: 0,
    },
    fame: 0,
    popularity: 0,
    treasury: 0,
    ledger: [],
    week: 1,
    year: 1,
    absoluteWeek: 1,
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    roster,
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
    rivals,
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
    bookmarks: [],
    progression: { status: 'active', stableStanding: 1, totalStables: 1, objectives: [] },
  } as GameState;
}

function makeTournament(participants: Warrior[]): TournamentEntry {
  return {
    id: 't1' as TournamentEntry['id'],
    season: 'Spring',
    week: 1,
    tierId: 'test',
    name: 'Test Tournament',
    bracket: [],
    participants,
    completed: false,
  } as TournamentEntry;
}

describe('warriorLookup', () => {
  describe('findWarriorById', () => {
    it('returns warrior from player roster when id matches', () => {
      const w = makeWarrior('p1', 'Player One');
      const state = makeState([w]);
      expect(findWarriorById(state, 'p1')).toBe(w);
    });

    it('returns warrior from rival roster when id matches', () => {
      const rw = makeWarrior('r1', 'Rival One');
      const state = makeState([], [makeRival('rival-stable', [rw])]);
      expect(findWarriorById(state, 'r1')).toBe(rw);
    });

    it('returns undefined when warrior id not found in any roster', () => {
      const state = makeState([makeWarrior('p1')], [makeRival('rs', [makeWarrior('r1')])]);
      expect(findWarriorById(state, 'nonexistent')).toBeUndefined();
    });

    it('returns undefined when state has empty roster and no rivals', () => {
      const state = makeState([]);
      expect(findWarriorById(state, 'any')).toBeUndefined();
    });

    it('prioritizes tournament participant over roster/rival warrior with same id', () => {
      const rosterW = makeWarrior('shared', 'Roster Warrior');
      const tournamentW = makeWarrior('shared', 'Tournament Warrior');
      const state = makeState([rosterW]);
      const tournament = makeTournament([tournamentW]);
      expect(findWarriorById(state, 'shared', tournament)).toBe(tournamentW);
    });

    it('returns tournament participant only when participant.attributes is truthy', () => {
      const noAttrs = { id: 'no-attrs', name: 'No Attrs' } as Warrior;
      const withAttrs = makeWarrior('with-attrs', 'With Attrs');
      const state = makeState([withAttrs]);
      const tournament = makeTournament([noAttrs, withAttrs]);
      expect(findWarriorById(state, 'no-attrs', tournament)).toBeUndefined();
      expect(findWarriorById(state, 'with-attrs', tournament)).toBe(withAttrs);
    });

    it('falls through to roster when tournament provided but warrior not among participants', () => {
      const rosterW = makeWarrior('p1', 'Roster Warrior');
      const state = makeState([rosterW]);
      const tournament = makeTournament([makeWarrior('other')]);
      expect(findWarriorById(state, 'p1', tournament)).toBe(rosterW);
    });

    it('handles state.rivals being undefined', () => {
      const w = makeWarrior('p1');
      const state = makeState([w]);
      (state as any).rivals = undefined;
      expect(findWarriorById(state, 'p1')).toBe(w);
      expect(findWarriorById(state, 'nonexistent')).toBeUndefined();
    });

    it('caching: second call with same state returns cached result', () => {
      const w1 = makeWarrior('p1', 'Original');
      const state = makeState([w1]);
      expect(findWarriorById(state, 'p1')).toBe(w1);

      // Mutate roster after first call — cache should NOT reflect new warriors
      state.roster.push(makeWarrior('p2', 'Added After Cache'));
      expect(findWarriorById(state, 'p2')).toBeUndefined();
    });

    it('caching: different state object builds a new cache', () => {
      const w1 = makeWarrior('p1', 'State One');
      const w2 = makeWarrior('p1', 'State Two');
      const state1 = makeState([w1]);
      const state2 = makeState([w2]);
      expect(findWarriorById(state1, 'p1')).toBe(w1);
      expect(findWarriorById(state2, 'p1')).toBe(w2);
    });
  });

  describe('clearWarriorCache', () => {
    it('invalidates cache so subsequent lookup rebuilds from current state', () => {
      const w1 = makeWarrior('p1', 'Original');
      const state = makeState([w1]);
      expect(findWarriorById(state, 'p1')).toBe(w1);

      // Add a new warrior and clear cache
      const w2 = makeWarrior('p2', 'After Clear');
      state.roster.push(w2);
      clearWarriorCache();
      expect(findWarriorById(state, 'p2')).toBe(w2);
    });

    it('calling clear with no prior cache usage is a safe no-op', () => {
      clearWarriorCache();
      const state = makeState([makeWarrior('p1')]);
      expect(findWarriorById(state, 'p1')).toBeDefined();
    });
  });
});
