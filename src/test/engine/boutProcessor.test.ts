/**
 * boutProcessor tests.
 */
import { describe, it, expect } from 'vitest';
import { resolveBout, generatePairings } from '@/engine/bout';
import { FightingStyle } from '@/types/game';

describe('boutProcessor - generatePairings', () => {
  it('should generate pairings for player and rival', () => {
    const state: any = {
      week: 1,
      player: { id: 'p1', stableName: 'Player' },
      roster: [
        {
          id: 'w1',
          status: 'Active',
          stableId: 'p1',
          style: FightingStyle.BashingAttack,
          attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
          fame: 0,
        },
      ],
      rivals: [
        {
          owner: { id: 'r1', stableName: 'Stab' },
          roster: [
            {
              id: 'w2',
              name: 'W2',
              status: 'Active',
              stableId: 'r1',
              style: FightingStyle.TotalParry,
              attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
              fame: 0,
            },
          ],
        },
      ],
      trainingAssignments: [],
      restStates: [],
      rivalries: [],
      matchHistory: [],
      arenaHistory: [],
      playerChallenges: [],
      playerAvoids: [],
      boutOffers: {
        offer1: {
          id: 'offer1',
          status: 'Signed',
          boutWeek: 1,
          warriorIds: ['w1', 'w2'],
          hype: 100,
          purse: 100,
        },
      },
    };
    const pairings = generatePairings(state);
    expect(pairings.length).toBe(1);
    expect(pairings[0]!.a.id).toBe('w1');
    expect(pairings[0]!.d.id).toBe('w2');
  });

  it('should generate tournament pairings using ID lookups and rivalMap', () => {
    const wA = { id: 'wa', name: 'WarA', status: 'Active', stableId: 's1' };
    const wD = { id: 'wd', name: 'WarD', status: 'Active', stableId: 's2' };
    const state: any = {
      week: 1,
      day: 1,
      isTournamentWeek: true,
      activeTournamentId: 't1',
      player: { id: 'p1', stableName: 'Player' },
      roster: [wA],
      rivals: [
        {
          id: 's2',
          owner: { id: 's2', stableName: 'RivalStab' },
          roster: [wD],
        },
      ],
      tournaments: [
        {
          id: 't1',
          bracket: [
            { round: 1, matchIndex: 0, warriorIdA: 'wa', warriorIdD: 'wd', stableIdD: 's2' },
          ],
        },
      ],
      warriorMap: new Map([
        ['wa', wA],
        ['wd', wD],
      ]),
      rivalMap: new Map([['s2', { id: 's2', owner: { stableName: 'RivalStab' } }]]),
      boutOffers: {},
    };
    const pairings = generatePairings(state);
    expect(pairings.length).toBe(1);
    expect(pairings[0]!.a.id).toBe('wa');
    expect(pairings[0]!.d.id).toBe('wd');
    expect(pairings[0]!.isRivalry).toBe(true);
    expect(pairings[0]!.rivalStable).toBe('RivalStab');
    expect(pairings[0]!.rivalStableId).toBe('s2');
  });

  it('should skip tournament pairings when warrior IDs are missing from warriorMap', () => {
    const state: any = {
      week: 1,
      day: 1,
      isTournamentWeek: true,
      activeTournamentId: 't1',
      player: { id: 'p1', stableName: 'Player' },
      roster: [],
      rivals: [],
      tournaments: [
        {
          id: 't1',
          bracket: [
            { round: 1, matchIndex: 0, warriorIdA: 'missing', warriorIdD: 'gone', stableIdD: 's1' },
          ],
        },
      ],
      warriorMap: new Map(),
      rivalMap: new Map(),
      boutOffers: {},
    };
    const pairings = generatePairings(state);
    expect(pairings.length).toBe(0);
  });
});

describe('boutProcessor - resolveBout', () => {
  const mockWarrior: any = {
    id: 'w1',
    name: 'W1',
    status: 'Active',
    stableId: 'p1',
    career: { wins: 0, losses: 0, kills: 0 },
    fame: 0,
    popularity: 0,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    style: FightingStyle.BashingAttack,
  };
  const mockOpponent: any = {
    id: 'w2',
    name: 'W2',
    status: 'Active',
    stableId: 'r1',
    career: { wins: 0, losses: 0, kills: 0 },
    fame: 0,
    popularity: 0,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    style: FightingStyle.TotalParry,
  };
  const mockState: any = {
    week: 1,
    roster: [mockWarrior],
    rivals: [{ owner: { id: 'r1', stableName: 'Stab' }, roster: [mockOpponent] }],
    arenaHistory: [],
    newsletter: [],
    trainers: [],
    player: { id: 'p1' },
    crowdMood: 'Calm',
    rivalries: [],
    matchHistory: [],
    graveyard: [],
  };

  it('should update records after a bout', () => {
    const ctx: any = {
      warriorMap: new Map([
        ['w1', mockWarrior],
        ['w2', mockOpponent],
      ]),
      warrior: mockWarrior,
      opponent: mockOpponent,
      isRivalry: false,
      moodMods: { fameMultiplier: 1, popMultiplier: 1 },
      week: 1,
      playerId: 'p1',
    };

    const { impact, result } = resolveBout(mockState, ctx);
    // The engine no longer mutates state directly in resolveBout, it returns a StateImpact

    expect(result.outcome.winner).toBeDefined();
    expect(impact.arenaHistory).toHaveLength(1);
  });
});
