import { describe, it, expect } from 'vitest';
import { convertBidsToOffers, generateBoutBids } from '@/engine/ai/workers/competitionWorker';
import type { GameState, RivalStableData, Warrior } from '@/types/state.types';
import type { WarriorId, StableId, BoutOfferId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';
import { generatePairings } from '@/engine/bout/core/pairings';

function makeWarrior(id: string, fame: number = 50): Warrior {
  return {
    id: id as WarriorId,
    name: `Warrior ${id}`,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    fatigue: 0,
  } as unknown as Warrior;
}

function makeRival(id: string, roster: Warrior[]): RivalStableData {
  return {
    id: id as StableId,
    owner: {
      id: `owner_${id}`,
      name: `Owner ${id}`,
      stableName: `Stable ${id}`,
      fame: 50,
      renown: 0,
      titles: 0,
      personality: 'Aggressive',
      age: 40,
      treasury: 1000,
    },
    roster,
    fame: 50,
    treasury: 1000,
    strategy: { intent: 'AGGRESSIVE' },
    trainingAssignments: [],
  } as unknown as RivalStableData;
}

function makeState(absoluteWeek: number, rivals: RivalStableData[]): GameState {
  const week = ((absoluteWeek - 1) % 52) + 1;
  const year = Math.floor((absoluteWeek - 1) / 52) + 1;
  const warriorMap = new Map<string, Warrior>();
  const warriorToStableMap = new Map<string, { stableId: string }>();
  for (const r of rivals) {
    for (const w of r.roster) {
      warriorMap.set(w.id as string, w);
      warriorToStableMap.set(w.id as string, { stableId: r.id as string });
    }
  }
  return {
    player: {
      id: 'player',
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
    week,
    absoluteWeek,
    year,
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    roster: [],
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    rivals,
    boutOffers: {},
    recruitPool: [],
    crowdMood: 'Calm',
    warriorMap,
    warriorToStableMap,
  } as unknown as GameState;
}

describe('absoluteWeek rollover — convertBidsToOffers', () => {
  it('produces display-week boutWeek at year boundary (absoluteWeek=52, year=1)', () => {
    const wA = makeWarrior('wA');
    const wB = makeWarrior('wB');
    const rivalA = makeRival('rA', [wA]);
    const rivalB = makeRival('rB', [wB]);
    const state = makeState(52, [rivalA, rivalB]);

    const { bids } = generateBoutBids(rivalA, 52, 'Clear', 'Calm', [rivalB]);
    expect(bids.length).toBeGreaterThan(0);

    const rng = new SeededRNGService(42);
    const allBids = bids.map((bid) => ({ bid, rivalId: rivalA.id as string }));
    const offers = convertBidsToOffers(allBids, [rivalA, rivalB], state, rng, new Set());

    expect(offers.length).toBeGreaterThan(0);
    // displayWeek(52 + 2) = displayWeek(54) = 2 (wraps to year 2 week 2)
    expect(offers[0]!.boutWeek).toBe(2);
    // displayWeek(52 + 1) = displayWeek(53) = 1
    expect(offers[0]!.expirationWeek).toBe(1);
    expect(offers[0]!.createdAbsoluteWeek).toBe(52);
  });

  it('produces display-week boutWeek at year 2 boundary (absoluteWeek=104, year=2)', () => {
    const wA = makeWarrior('wA');
    const wB = makeWarrior('wB');
    const rivalA = makeRival('rA', [wA]);
    const rivalB = makeRival('rB', [wB]);
    const state = makeState(104, [rivalA, rivalB]);

    const { bids } = generateBoutBids(rivalA, 104, 'Clear', 'Calm', [rivalB]);
    expect(bids.length).toBeGreaterThan(0);

    const rng = new SeededRNGService(42);
    const allBids = bids.map((bid) => ({ bid, rivalId: rivalA.id as string }));
    const offers = convertBidsToOffers(allBids, [rivalA, rivalB], state, rng, new Set());

    expect(offers.length).toBeGreaterThan(0);
    // displayWeek(104 + 2) = displayWeek(106) = 2
    expect(offers[0]!.boutWeek).toBe(2);
    // displayWeek(104 + 1) = displayWeek(105) = 1
    expect(offers[0]!.expirationWeek).toBe(1);
    expect(offers[0]!.createdAbsoluteWeek).toBe(104);
  });
});

describe('absoluteWeek rollover — generatePairings', () => {
  it('finds offers with boutOfferAbsoluteWeek = 54 when state.absoluteWeek = 54', () => {
    const wA = makeWarrior('wA');
    const wB = makeWarrior('wB');
    const rivalA = makeRival('rA', [wA]);
    const rivalB = makeRival('rB', [wB]);
    const state = makeState(52, [rivalA, rivalB]);

    // Generate offers at absoluteWeek=52 → boutOfferAbsoluteWeek = 54
    const { bids } = generateBoutBids(rivalA, 52, 'Clear', 'Calm', [rivalB]);
    const rng = new SeededRNGService(42);
    const allBids = bids.map((bid) => ({ bid, rivalId: rivalA.id as string }));
    const offers = convertBidsToOffers(allBids, [rivalA, rivalB], state, rng, new Set());

    expect(offers.length).toBeGreaterThan(0);

    // Sign the offer
    const signedOffer = {
      ...offers[0]!,
      status: 'Signed' as const,
      responses: {
        [wA.id as WarriorId]: 'Accepted' as const,
        [wB.id as WarriorId]: 'Accepted' as const,
      },
    };

    // Advance to absoluteWeek=54 (year 2, week 2) — boutOfferAbsoluteWeek resolves to 54
    const stateAt54 = {
      ...state,
      absoluteWeek: 54,
      week: 2,
      year: 2,
      boutOffers: { [signedOffer.id as BoutOfferId]: signedOffer },
      warriorMap: state.warriorMap,
    } as GameState;

    const pairings = generatePairings(stateAt54);
    expect(pairings.length).toBeGreaterThan(0);
    expect(pairings[0]!.a.id).toBe(wA.id);
    expect(pairings[0]!.d.id).toBe(wB.id);
  });
});
