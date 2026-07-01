import { describe, it, expect } from 'vitest';
import {
  collectAllWarriors,
  collectAllActiveWarriors,
  collectAvailableWarriors,
  countActiveWarriors,
  collectHealthyWarriors,
} from '@/engine/core/warriorCollection';
import type { GameState, Warrior, RivalStableData, BoutOffer } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';

function makeWarrior(
  id: string,
  overrides: Partial<Warrior> = {}
): Warrior {
  return {
    id: id as Warrior['id'],
    name: `Warrior ${id}`,
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

function makeState(
  roster: Warrior[],
  rivals: RivalStableData[] = [],
  boutOffers: Record<string, BoutOffer> = {}
): GameState {
  return {
    meta: { gameName: 'test', version: '1', createdAt: '2024-01-01' },
    ftueComplete: true,
    coachDismissed: [],
    player: { id: 'p1' as any, name: 'Player', stableName: 'Player Stable', fame: 0, renown: 0, titles: 0 },
    fame: 0,
    popularity: 0,
    treasury: 0,
    ledger: [],
    week: 1,
    year: 1,
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
    boutOffers,
    realmRankings: {},
    awards: [],
    bookmarks: [],
    progression: { status: 'active', stableStanding: 1, totalStables: 1, objectives: [] },
  } as GameState;
}

function makeOffer(
  id: string,
  warriorIds: string[],
  boutWeek: number,
  status: BoutOffer['status'] = 'Signed'
): BoutOffer {
  return {
    id: id as BoutOffer['id'],
    promoterId: 'prom1' as any,
    warriorIds: warriorIds as any,
    boutWeek,
    expirationWeek: boutWeek + 1,
    purse: 100,
    hype: 0,
    status,
    responses: {} as any,
  } as BoutOffer;
}

describe('warriorCollection', () => {
  describe('collectAllWarriors', () => {
    it('collects warriors from player roster only when no rivals', () => {
      const w1 = makeWarrior('p1');
      const w2 = makeWarrior('p2');
      const state = makeState([w1, w2]);
      const result = collectAllWarriors(state);
      expect(result).toHaveLength(2);
      expect(result.map((w) => w.id)).toEqual(['p1', 'p2']);
    });

    it('collects warriors from both player roster and rival rosters', () => {
      const pw = makeWarrior('p1');
      const rw = makeWarrior('r1');
      const state = makeState([pw], [makeRival('rs1', [rw])]);
      const result = collectAllWarriors(state);
      expect(result).toHaveLength(2);
      expect(result.map((w) => w.id)).toEqual(['p1', 'r1']);
    });

    it('returns empty array when both roster and rivals are empty', () => {
      const state = makeState([]);
      expect(collectAllWarriors(state)).toEqual([]);
    });

    it('handles state.roster being undefined', () => {
      const state = makeState([]);
      (state as any).roster = undefined;
      expect(collectAllWarriors(state)).toEqual([]);
    });

    it('handles state.rivals being undefined', () => {
      const state = makeState([makeWarrior('p1')]);
      (state as any).rivals = undefined;
      const result = collectAllWarriors(state);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('p1');
    });

    it('handles a rival having undefined roster', () => {
      const state = makeState([makeWarrior('p1')], [makeRival('rs1', [])]);
      (state as any).rivals[0].roster = undefined;
      const result = collectAllWarriors(state);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('p1');
    });

    it('applies filter predicate: only matching warriors returned', () => {
      const w1 = makeWarrior('p1', { fame: 50 });
      const w2 = makeWarrior('p2', { fame: 10 });
      const state = makeState([w1, w2]);
      const result = collectAllWarriors(state, (w) => w.fame >= 50);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('p1');
    });

    it('returns all warriors when no filter provided', () => {
      const state = makeState([makeWarrior('p1')], [makeRival('rs', [makeWarrior('r1')])]);
      expect(collectAllWarriors(state)).toHaveLength(2);
    });

    it('filter receives each warrior as argument', () => {
      const w1 = makeWarrior('p1');
      const state = makeState([w1]);
      const seen: string[] = [];
      collectAllWarriors(state, (w) => {
        seen.push(w.id);
        return true;
      });
      expect(seen).toEqual(['p1']);
    });
  });

  describe('collectAllActiveWarriors', () => {
    it('returns only warriors with status Active', () => {
      const active = makeWarrior('a1', { status: 'Active' });
      const dead = makeWarrior('d1', { status: 'Dead' });
      const retired = makeWarrior('r1', { status: 'Retired' });
      const state = makeState([active, dead, retired]);
      const result = collectAllActiveWarriors(state);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('a1');
    });

    it('returns empty when no active warriors exist', () => {
      const state = makeState([
        makeWarrior('d1', { status: 'Dead' }),
        makeWarrior('r1', { status: 'Retired' }),
      ]);
      expect(collectAllActiveWarriors(state)).toEqual([]);
    });

    it('includes active warriors from both player and rival rosters', () => {
      const pw = makeWarrior('p1', { status: 'Active' });
      const rw = makeWarrior('r1', { status: 'Active' });
      const state = makeState([pw], [makeRival('rs', [rw])]);
      const result = collectAllActiveWarriors(state);
      expect(result).toHaveLength(2);
    });
  });

  describe('collectAvailableWarriors', () => {
    it('returns active warriors when no bout offers exist', () => {
      const w1 = makeWarrior('p1', { status: 'Active' });
      const state = makeState([w1]);
      const result = collectAvailableWarriors(state, 5);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('p1');
    });

    it('excludes warriors booked for the target week via Signed offers', () => {
      const w1 = makeWarrior('p1', { status: 'Active' });
      const w2 = makeWarrior('p2', { status: 'Active' });
      const offers = {
        o1: makeOffer('o1', ['p1'], 5, 'Signed'),
      };
      const state = makeState([w1, w2], [], offers);
      const result = collectAvailableWarriors(state, 5);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('p2');
    });

    it('does not exclude warriors from non-Signed offers', () => {
      const w1 = makeWarrior('p1', { status: 'Active' });
      const offers = {
        o1: makeOffer('o1', ['p1'], 5, 'Proposed'),
      };
      const state = makeState([w1], [], offers);
      const result = collectAvailableWarriors(state, 5);
      expect(result).toHaveLength(1);
    });

    it('does not exclude warriors from Signed offers for a different week', () => {
      const w1 = makeWarrior('p1', { status: 'Active' });
      const offers = {
        o1: makeOffer('o1', ['p1'], 3, 'Signed'),
      };
      const state = makeState([w1], [], offers);
      const result = collectAvailableWarriors(state, 5);
      expect(result).toHaveLength(1);
    });

    it('handles state.boutOffers being undefined', () => {
      const w1 = makeWarrior('p1', { status: 'Active' });
      const state = makeState([w1]);
      (state as any).boutOffers = undefined;
      const result = collectAvailableWarriors(state, 5);
      expect(result).toHaveLength(1);
    });

    it('handles offer with undefined warriorIds', () => {
      const w1 = makeWarrior('p1', { status: 'Active' });
      const offers = {
        o1: makeOffer('o1', [], 5, 'Signed'),
      };
      (offers.o1 as any).warriorIds = undefined;
      const state = makeState([w1], [], offers);
      const result = collectAvailableWarriors(state, 5);
      expect(result).toHaveLength(1);
    });

    it('returns empty when all active warriors are booked', () => {
      const w1 = makeWarrior('p1', { status: 'Active' });
      const offers = {
        o1: makeOffer('o1', ['p1'], 5, 'Signed'),
      };
      const state = makeState([w1], [], offers);
      expect(collectAvailableWarriors(state, 5)).toEqual([]);
    });
  });

  describe('countActiveWarriors', () => {
    it('returns 0 when no warriors exist', () => {
      const state = makeState([]);
      expect(countActiveWarriors(state)).toBe(0);
    });

    it('returns correct count of active warriors across player and rivals', () => {
      const pw1 = makeWarrior('p1', { status: 'Active' });
      const pw2 = makeWarrior('p2', { status: 'Active' });
      const rw1 = makeWarrior('r1', { status: 'Active' });
      const state = makeState([pw1, pw2], [makeRival('rs', [rw1])]);
      expect(countActiveWarriors(state)).toBe(3);
    });

    it('returns 0 when all warriors are non-active', () => {
      const state = makeState([
        makeWarrior('d1', { status: 'Dead' }),
        makeWarrior('r1', { status: 'Retired' }),
      ]);
      expect(countActiveWarriors(state)).toBe(0);
    });
  });

  describe('collectHealthyWarriors', () => {
    it('returns active warriors with no injuries', () => {
      const w1 = makeWarrior('p1', { status: 'Active', injuries: [] });
      const state = makeState([w1]);
      const result = collectHealthyWarriors(state);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('p1');
    });

    it('excludes active warriors with injuries', () => {
      const w1 = makeWarrior('p1', { status: 'Active', injuries: [] });
      const w2 = makeWarrior('p2', {
        status: 'Active',
        injuries: [{ id: 'inj1' as any, name: 'Broken Arm', description: '', severity: 'Minor', weeksRemaining: 2, penalties: {} }],
      });
      const state = makeState([w1, w2]);
      const result = collectHealthyWarriors(state);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('p1');
    });

    it('excludes non-active warriors', () => {
      const w1 = makeWarrior('p1', { status: 'Dead', injuries: [] });
      const state = makeState([w1]);
      expect(collectHealthyWarriors(state)).toEqual([]);
    });

    it('handles warrior with undefined injuries field', () => {
      const w1 = makeWarrior('p1', { status: 'Active' });
      (w1 as any).injuries = undefined;
      const state = makeState([w1]);
      const result = collectHealthyWarriors(state);
      expect(result).toHaveLength(1);
    });

    it('handles warrior with empty injuries array', () => {
      const w1 = makeWarrior('p1', { status: 'Active', injuries: [] });
      const state = makeState([w1]);
      expect(collectHealthyWarriors(state)).toHaveLength(1);
    });
  });
});
