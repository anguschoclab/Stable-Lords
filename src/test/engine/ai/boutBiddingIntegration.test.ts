import { describe, it, expect, vi } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData, GameState } from '@/types/state.types';
import {
  generateBoutBids,
  convertBidsToOffers,
  BID_MATCHMAKING_ID,
} from '@/engine/ai/workers/competitionWorker/boutBidding';
import { SeededRNGService } from '@/utils/random';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeWarrior(name: string, style: FightingStyle, fame: number = 100): Warrior {
  return {
    id: `w_${name}` as WarriorId,
    name,
    style,
    attributes: { ST: 10, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
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

function makeRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1' as any,
    owner: {
      id: 'owner-1' as any,
      name: 'Owner',
      stableName: 'Stable',
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
    player: { id: 'player-1' as any, name: 'Player', stableName: 'Player Stable', fame: 0, renown: 0, titles: 0 },
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

// ─── Unit tests for convertBidsToOffers ─────────────────────────────────────

describe('convertBidsToOffers', () => {
  it('creates bout offers from bids with matching opponents', () => {
    const warriorA = makeWarrior('Alpha', FightingStyle.StrikingAttack);
    const warriorB = makeWarrior('Bravo', FightingStyle.BashingAttack);
    const rivalA = makeRival({ id: 'rival-a' as any, roster: [warriorA] });
    const rivalB = makeRival({
      id: 'rival-b' as any,
      owner: { ...makeRival().owner, id: 'owner-b' as any, name: 'OwnerB', stableName: 'StableB' },
      roster: [warriorB],
    });
    const state = makeMinimalState([rivalA, rivalB]);

    const { bids } = generateBoutBids(rivalA, 5, 'Clear', 'Calm', [rivalB]);
    expect(bids.length).toBeGreaterThan(0);

    const rng = new SeededRNGService(42);
    const allBids = bids.map((bid) => ({ bid, rivalId: rivalA.id as string }));
    const offers = convertBidsToOffers(allBids, [rivalA, rivalB], state, rng, 6, new Set());

    expect(offers.length).toBeGreaterThan(0);
    const offer = offers[0]!;
    expect(offer.promoterId).toBe(BID_MATCHMAKING_ID);
    expect(offer.warriorIds).toContain(warriorA.id);
    expect(offer.warriorIds).toContain(warriorB.id);
    expect(offer.status).toBe('Proposed');
    expect(offer.boutWeek).toBe(6);
    expect(offer.expirationWeek).toBe(6);
  });

  it('VENDETTA bid creates offer targeting the specified stable', () => {
    const warriorA = makeWarrior('Vindicator', FightingStyle.StrikingAttack);
    const warriorB = makeWarrior('Target', FightingStyle.BashingAttack);
    const rivalA = makeRival({
      id: 'rival-a' as any,
      roster: [warriorA],
      strategy: { intent: 'VENDETTA', targetStableId: 'rival-b' as any, planWeeksRemaining: 4 },
    });
    const rivalB = makeRival({
      id: 'rival-b' as any,
      owner: { ...makeRival().owner, id: 'owner-b' as any, name: 'OwnerB', stableName: 'StableB' },
      roster: [warriorB],
    });
    const state = makeMinimalState([rivalA, rivalB]);

    const { bids } = generateBoutBids(rivalA, 5, 'Clear', 'Calm', [rivalB]);
    expect(bids.length).toBeGreaterThan(0);
    expect(bids[0]!.targetStableId).toBe('rival-b');

    const rng = new SeededRNGService(42);
    const allBids = bids.map((bid) => ({ bid, rivalId: rivalA.id as string }));
    const offers = convertBidsToOffers(allBids, [rivalA, rivalB], state, rng, 6, new Set());

    expect(offers.length).toBeGreaterThan(0);
    const offer = offers[0]!;
    expect(offer.warriorIds).toContain(warriorA.id);
    expect(offer.warriorIds).toContain(warriorB.id);
  });

  it('RECOVERY bid respects maxFame filter', () => {
    const warriorA = makeWarrior('Healer', FightingStyle.LungingAttack);
    const weakOpp = makeWarrior('Weak', FightingStyle.BashingAttack, 30);
    const strongOpp = makeWarrior('Strong', FightingStyle.BashingAttack, 200);
    const rivalA = makeRival({
      id: 'rival-a' as any,
      roster: [warriorA],
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 2 },
    });
    const rivalB = makeRival({
      id: 'rival-b' as any,
      owner: { ...makeRival().owner, id: 'owner-b' as any, name: 'OwnerB', stableName: 'StableB' },
      roster: [strongOpp],
    });
    const rivalC = makeRival({
      id: 'rival-c' as any,
      owner: { ...makeRival().owner, id: 'owner-c' as any, name: 'OwnerC', stableName: 'StableC' },
      roster: [weakOpp],
    });
    const state = makeMinimalState([rivalA, rivalB, rivalC]);

    const { bids } = generateBoutBids(rivalA, 5, 'Clear', 'Calm', [rivalB, rivalC]);
    expect(bids.length).toBeGreaterThan(0);
    expect(bids[0]!.maxFame).toBe(50);

    const rng = new SeededRNGService(42);
    const allBids = bids.map((bid) => ({ bid, rivalId: rivalA.id as string }));
    const offers = convertBidsToOffers(allBids, [rivalA, rivalB, rivalC], state, rng, 6, new Set());

    expect(offers.length).toBeGreaterThan(0);
    const offer = offers[0]!;
    expect(offer.warriorIds).toContain(warriorA.id);
    expect(offer.warriorIds).toContain(weakOpp.id);
    expect(offer.warriorIds).not.toContain(strongOpp.id);
  });

  it('warrior already paired is not double-booked', () => {
    const warriorA = makeWarrior('Alpha', FightingStyle.StrikingAttack);
    const warriorB = makeWarrior('Bravo', FightingStyle.BashingAttack);
    const rivalA = makeRival({ id: 'rival-a' as any, roster: [warriorA] });
    const rivalB = makeRival({
      id: 'rival-b' as any,
      owner: { ...makeRival().owner, id: 'owner-b' as any, name: 'OwnerB', stableName: 'StableB' },
      roster: [warriorB],
    });
    const state = makeMinimalState([rivalA, rivalB]);

    const { bids } = generateBoutBids(rivalA, 5, 'Clear', 'Calm', [rivalB]);
    const rng = new SeededRNGService(42);
    const allBids = bids.map((bid) => ({ bid, rivalId: rivalA.id as string }));

    // warriorA already has an offer — should not be paired again
    const existing = new Set<string>([warriorA.id]);
    const offers = convertBidsToOffers(allBids, [rivalA, rivalB], state, rng, 6, existing);

    expect(offers.length).toBe(0);
  });

  it('CONSOLIDATION bid creates offer with opponent from different stable', () => {
    const warriorA = makeWarrior('Alpha', FightingStyle.StrikingAttack);
    const warriorB = makeWarrior('Bravo', FightingStyle.BashingAttack);
    const rivalA = makeRival({ id: 'rival-a' as any, roster: [warriorA] });
    const rivalB = makeRival({
      id: 'rival-b' as any,
      owner: { ...makeRival().owner, id: 'owner-b' as any, name: 'OwnerB', stableName: 'StableB' },
      roster: [warriorB],
    });
    const state = makeMinimalState([rivalA, rivalB]);

    const { bids } = generateBoutBids(rivalA, 5, 'Clear', 'Calm', [rivalB]);
    const rng = new SeededRNGService(42);
    const allBids = bids.map((bid) => ({ bid, rivalId: rivalA.id as string }));
    const offers = convertBidsToOffers(allBids, [rivalA, rivalB], state, rng, 6, new Set());

    expect(offers.length).toBeGreaterThan(0);
    const offer = offers[0]!;
    expect(offer.warriorIds.length).toBe(2);
    // The two warriors must be from different stables
    const ids = new Set(offer.warriorIds);
    expect(ids.has(warriorA.id)).toBe(true);
    expect(ids.has(warriorB.id)).toBe(true);
  });
});

// ─── Integration test through RivalStrategyPass ──────────────────────────────

describe('RivalStrategyPass bid integration', () => {
  it('bids from generateBoutBids produce bout offers in RivalStrategyPass impact', async () => {
    const { runRivalStrategyPass } = await import('@/engine/pipeline/passes/RivalStrategyPass');
    const worldMm = await import('@/engine/matchmaking/worldMatchmaking');
    vi.spyOn(worldMm, 'planWorldBouts').mockReturnValue([]);

    const warrior1 = makeWarrior('Fighter1', FightingStyle.StrikingAttack);
    const warrior2 = makeWarrior('Fighter2', FightingStyle.BashingAttack);
    const rival1 = makeRival({ id: 'rival-1' as any, roster: [warrior1] });
    const rival2 = makeRival({
      id: 'rival-2' as any,
      owner: { ...makeRival().owner, id: 'owner-2' as any, name: 'Owner2', stableName: 'Stable2' },
      roster: [warrior2],
    });

    const state = makeMinimalState([rival1, rival2]);
    state.recruitPool = [];

    const impact = runRivalStrategyPass(state, 6, undefined as any, true);

    expect(impact).toBeDefined();
    expect(impact.boutOffers).toBeDefined();

    const allOffers = Object.values(impact.boutOffers!);
    const bidOffers = allOffers.filter((o) => o.promoterId === BID_MATCHMAKING_ID);
    expect(bidOffers.length).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });
});
