/**
 * boutProcessor tests.
 */
import { describe, it, expect } from 'vitest';
import { resolveBout, generatePairings } from '@/engine/bout';
import { FightingStyle } from '@/types/game';
import { makeWarrior, makeRival, makeBoutOffer, makeGameState } from '@/test/_fixtures/factories';
import type { WarriorId, BoutOfferId, StableId } from '@/types/shared.types';

describe('boutProcessor - generatePairings', () => {
  it('should generate pairings for player and rival', () => {
    const state: any = makeGameState({
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
    });
    const { pairings, voidedOffers } = generatePairings(state);
    expect(pairings.length).toBe(1);
    expect(pairings[0]!.a.id).toBe('w1');
    expect(pairings[0]!.d.id).toBe('w2');
    expect(voidedOffers).toHaveLength(0);
  });

  it('should void a duplicate signed offer when a warrior is booked twice in one week', () => {
    const state: any = {
      week: 1,
      absoluteWeek: 1,
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
              status: 'Active',
              stableId: 'r1',
              style: FightingStyle.TotalParry,
              attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
              fame: 0,
            },
            {
              id: 'w3',
              status: 'Active',
              stableId: 'r1',
              style: FightingStyle.TotalParry,
              attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
              fame: 0,
            },
          ],
        },
      ],
      boutOffers: {
        offer1: {
          id: 'offer1',
          status: 'Signed',
          boutWeek: 1,
          warriorIds: ['w1', 'w2'],
          hype: 100,
          purse: 100,
        },
        offer2: {
          id: 'offer2',
          status: 'Signed',
          boutWeek: 1,
          warriorIds: ['w1', 'w3'],
          hype: 50,
          purse: 50,
        },
      },
    };
    const { pairings, voidedOffers } = generatePairings(state);
    expect(pairings.length).toBe(1);
    expect(voidedOffers.map((o) => o.id)).toEqual(['offer2']);
  });

  it('should dedupe deterministically regardless of offer map insertion order', () => {
    const mkState = (offerOrder: string[]): any =>
      makeGameState({
        roster: [makeWarrior({ id: 'w1' as WarriorId })],
        rivals: [
          makeRival({
            id: 'r1' as StableId,
            roster: [
              makeWarrior({ id: 'w2' as WarriorId }),
              makeWarrior({ id: 'w3' as WarriorId }),
            ],
          }),
        ],
        boutOffers: Object.fromEntries(
          offerOrder.map((id, i) => {
            const offer = makeBoutOffer({
              id: id as BoutOfferId,
              status: 'Signed',
              boutWeek: 1,
              warriorIds: ['w1' as WarriorId, (i === 0 ? 'w2' : 'w3') as WarriorId],
            });
            return [id, offer];
          })
        ),
      });

    const a = generatePairings(mkState(['offer-a', 'offer-b']));
    const b = generatePairings(mkState(['offer-b', 'offer-a']));
    expect(a.pairings.map((p) => p.contractId)).toEqual(b.pairings.map((p) => p.contractId));
    expect(a.voidedOffers.map((o) => o.id)).toEqual(b.voidedOffers.map((o) => o.id));
    expect(a.pairings).toHaveLength(1);
    expect(a.voidedOffers).toHaveLength(1);
  });

  it('should not double-book a tournament participant signed to a contract the same week', () => {
    const wA = { id: 'wa', name: 'WarA', status: 'Active', stableId: 's1' };
    const wD = { id: 'wd', name: 'WarD', status: 'Active', stableId: 's2' };
    const wE = { id: 'we', name: 'WarE', status: 'Active', stableId: 's2' };
    const state: any = {
      week: 1,
      day: 1,
      absoluteWeek: 1,
      isTournamentWeek: true,
      activeTournamentId: 't1',
      player: { id: 'p1', stableName: 'Player' },
      roster: [wA],
      rivals: [{ id: 's2', owner: { id: 's2', stableName: 'RivalStab' }, roster: [wD, wE] }],
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
        ['we', wE],
      ]),
      rivalMap: new Map([['s2', { id: 's2', owner: { stableName: 'RivalStab' } }]]),
      boutOffers: {
        offer1: {
          id: 'offer1',
          status: 'Signed',
          boutWeek: 1,
          warriorIds: ['wa', 'we'],
          hype: 100,
          purse: 100,
        },
      },
    };
    const { pairings, voidedOffers } = generatePairings(state);
    // The tournament bracket is authoritative — the signed offer is voided.
    expect(pairings).toHaveLength(1);
    expect(pairings[0]!.contractId).toBe('tour_t1_1_0');
    expect(voidedOffers.map((o) => o.id)).toEqual(['offer1']);
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
    const { pairings } = generatePairings(state);
    expect(pairings.length).toBe(1);
    expect(pairings[0]!.a.id).toBe('wa');
    expect(pairings[0]!.d.id).toBe('wd');
    expect(pairings[0]!.isRivalry).toBe(true);
    expect(pairings[0]!.rivalStable).toBe('RivalStab');
    expect(pairings[0]!.rivalStableId).toBe('s2');
  });

  it('should void a signed offer whose side-D warrior is dead on the roster', () => {
    // Dead-status warriors stay indexed in warriorMap (buildActiveWarriorMap
    // maps every roster entry regardless of status), so pairing-time liveness
    // must catch them — otherwise the dead warrior is booked and fights.
    const deadD = {
      id: 'w2',
      name: 'W2',
      status: 'Dead',
      stableId: 'r1',
      style: FightingStyle.TotalParry,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      fame: 0,
    };
    const state: any = makeGameState({
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
      rivals: [{ owner: { id: 'r1', stableName: 'Stab' }, roster: [deadD] }],
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
    });
    const { pairings, voidedOffers } = generatePairings(state);
    expect(pairings).toHaveLength(0);
    expect(voidedOffers.map((o) => o.id)).toEqual(['offer1']);
  });

  it('should void a signed offer naming a warrior missing from every roster', () => {
    // A warrior who left the world entirely after signing (death-time roster
    // removal) must cancel the contract — a silent drop leaves a 'Signed'
    // offer that can never resolve or pay out.
    const state: any = makeGameState({
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
      rivals: [{ owner: { id: 'r1', stableName: 'Stab' }, roster: [] }],
      boutOffers: {
        offer1: {
          id: 'offer1',
          status: 'Signed',
          boutWeek: 1,
          warriorIds: ['w1', 'w-gone'],
          hype: 100,
          purse: 100,
        },
      },
    });
    const { pairings, voidedOffers } = generatePairings(state);
    expect(pairings).toHaveLength(0);
    expect(voidedOffers.map((o) => o.id)).toEqual(['offer1']);
  });

  it('should void a signed offer whose side-A warrior is dead', () => {
    const deadA = {
      id: 'w1',
      name: 'W1',
      status: 'Dead',
      stableId: 'p1',
      style: FightingStyle.BashingAttack,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      fame: 0,
    };
    const liveD = {
      id: 'w2',
      name: 'W2',
      status: 'Active',
      stableId: 'r1',
      style: FightingStyle.TotalParry,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      fame: 0,
    };
    const state: any = makeGameState({
      player: { id: 'p1', stableName: 'Player' },
      roster: [deadA],
      rivals: [{ owner: { id: 'r1', stableName: 'Stab' }, roster: [liveD] }],
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
    });
    const { pairings, voidedOffers } = generatePairings(state);
    expect(pairings).toHaveLength(0);
    expect(voidedOffers.map((o) => o.id)).toEqual(['offer1']);
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
    const { pairings } = generatePairings(state);
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
  const mockState: any = makeGameState({
    roster: [mockWarrior],
    rivals: [{ owner: { id: 'r1', stableName: 'Stab' }, roster: [mockOpponent] }],
    player: { id: 'p1' },
  });

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

    expect(result?.outcome.winner).toBeDefined();
    expect(impact.arenaHistory).toHaveLength(1);
  });

  it('skips a bout whose side-D combatant is dead and returns the contract for voiding', () => {
    // A dead warrior lingering on a roster stays in warriorMap — resolution
    // must refuse the bout, emit no phantom result, and hand the contract back
    // so the caller can cancel it rather than leave a 'Signed' ghost.
    const deadOpponent = { ...mockOpponent, status: 'Dead' };
    const contract: any = {
      id: 'offer-dead',
      status: 'Signed',
      boutWeek: 1,
      warriorIds: ['w1', 'w2'],
      purse: 100,
    };
    const state: any = {
      ...mockState,
      deadWarriorIds: ['w2'],
      boutOffers: { 'offer-dead': contract },
    };
    const ctx: any = {
      warriorMap: new Map([
        ['w1', mockWarrior],
        ['w2', deadOpponent],
      ]),
      warrior: mockWarrior,
      opponent: deadOpponent,
      isRivalry: false,
      moodMods: { fameMultiplier: 1, popMultiplier: 1 },
      week: 1,
      playerId: 'p1',
      contract,
    };

    const res = resolveBout(state, ctx);

    expect(res.result).toBeNull();
    expect(res.voidedOffer?.id).toBe('offer-dead');
    expect(res.impact.arenaHistory ?? []).toHaveLength(0);
    expect(res.impact.graveyard ?? []).toHaveLength(0);
  });

  it('skips a bout whose combatant is missing from warriorMap', () => {
    const contract: any = {
      id: 'offer-gone',
      status: 'Signed',
      boutWeek: 1,
      warriorIds: ['w1', 'w2'],
      purse: 100,
    };
    const state: any = { ...mockState, boutOffers: { 'offer-gone': contract } };
    const ctx: any = {
      warriorMap: new Map([['w1', mockWarrior]]),
      warrior: mockWarrior,
      opponent: mockOpponent,
      isRivalry: false,
      moodMods: { fameMultiplier: 1, popMultiplier: 1 },
      week: 1,
      playerId: 'p1',
      contract,
    };

    const res = resolveBout(state, ctx);

    expect(res.result).toBeNull();
    expect(res.voidedOffer?.id).toBe('offer-gone');
  });
});
