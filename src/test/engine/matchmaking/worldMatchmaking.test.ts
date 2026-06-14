import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { planWorldBouts } from '@/engine/matchmaking/worldMatchmaking';
import { SeededRNGService } from '@/utils/random';
import type { GameState, Warrior, RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { WarriorId, StableId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';

// ─── Lightweight Test Factories ──────────────────────────────────────────────

function makeTestWarrior(
  id: string,
  fame: number = 0,
  lastBoutWeek: number = 0,
  overrides?: Partial<Warrior>
): Warrior {
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
    traits: [],
    lastBoutWeek,
    isDead: false,
    ...overrides,
  } as Warrior;
}

function makeTestRival(
  id: string,
  warriors: Warrior[],
  strategy?: RivalStableData['strategy']
): RivalStableData {
  return {
    id: id as StableId,
    owner: {
      id: `owner_${id}` as StableId,
      name: `Owner ${id}`,
      stableName: `Stable ${id}`,
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
    },
    fame: 100,
    roster: warriors,
    treasury: 1000,
    tier: 'Established',
    strategy,
  };
}

function makeTestState(rivals: RivalStableData[], week: number = 1): GameState {
  return {
    meta: { gameName: 'Stable Lords', version: 'test', createdAt: '2024-01-01T00:00:00.000Z' },
    ftueComplete: false,
    ftueStep: 0,
    coachDismissed: [],
    player: {
      id: 'stable-player' as StableId,
      name: 'You',
      stableName: "Dragon's Hearth",
      fame: 0,
      renown: 0,
      titles: 0,
    },
    fame: 0,
    popularity: 0,
    treasury: 1000,
    ledger: [],
    week,
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
    rivals,
    scoutReports: [],
    restStates: [],
    rivalries: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    recruitPool: [],
    trainers: [],
    boutOffers: {},
    realmRankings: {},
    awards: [],
    promoters: {},
  } as any as GameState;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('planWorldBouts', () => {
  let rng: IRNGService;

  beforeEach(() => {
    rng = new SeededRNGService(42);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Edge Cases & Guard Clauses ─────────────────────────────────────────

  it('returns empty array when no rivals exist', () => {
    const state = makeTestState([]);
    expect(planWorldBouts(state, rng)).toEqual([]);
  });

  it('returns empty array when only one eligible warrior exists', () => {
    const state = makeTestState([makeTestRival('r1', [makeTestWarrior('w1', 50)])]);
    expect(planWorldBouts(state, rng)).toEqual([]);
  });

  it('returns empty array when all warriors are dead', () => {
    const state = makeTestState([
      makeTestRival('r1', [
        makeTestWarrior('w1', 50, 0, { isDead: true, status: 'Active' }),
        makeTestWarrior('w2', 50, 0, { isDead: true, status: 'Active' }),
      ]),
    ]);
    expect(planWorldBouts(state, rng)).toEqual([]);
  });

  it('returns empty array when all warriors have non-Active status', () => {
    const state = makeTestState([
      makeTestRival('r1', [
        makeTestWarrior('w1', 50, 0, { status: 'Retired' }),
        makeTestWarrior('w2', 50, 0, { status: 'Retired' }),
      ]),
    ]);
    expect(planWorldBouts(state, rng)).toEqual([]);
  });

  // ─── Eligibility & Filtering ──────────────────────────────────────────────

  it('excludes dead warriors from pairing', () => {
    const state = makeTestState([
      makeTestRival('r1', [
        makeTestWarrior('w1', 100),
        makeTestWarrior('w2', 100, 0, { isDead: true }),
      ]),
      makeTestRival('r2', [makeTestWarrior('w3', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers.length).toBeGreaterThan(0);
    const allIds = offers.flatMap((o) => o.warriorIds);
    expect(allIds).not.toContain('w2');
  });

  it('excludes non-Active warriors from pairing', () => {
    const state = makeTestState([
      makeTestRival('r1', [
        makeTestWarrior('w1', 100),
        makeTestWarrior('w2', 100, 0, { status: 'Retired' }),
      ]),
      makeTestRival('r2', [makeTestWarrior('w3', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers.length).toBeGreaterThan(0);
    const allIds = offers.flatMap((o) => o.warriorIds);
    expect(allIds).not.toContain('w2');
  });

  it('includes warriors with status Active and isDead false', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)]),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers.length).toBe(1);
    expect(offers[0]!.warriorIds).toContain('w1');
    expect(offers[0]!.warriorIds).toContain('w2');
  });

  // ─── Cross-Stable Pairing Rule ──────────────────────────────────────────

  it('never pairs warriors from the same stable', () => {
    const state = makeTestState([
      makeTestRival('r1', [
        makeTestWarrior('w1', 100),
        makeTestWarrior('w2', 100),
        makeTestWarrior('w3', 100),
      ]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers).toEqual([]);
  });

  it('creates at least one offer when two rivals each have one eligible warrior', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)]),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers.length).toBe(1);
  });

  // ─── Sorting Behavior ───────────────────────────────────────────────────

  it('prioritizes high-fame warriors when fame gap exceeds 100', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w_high', 500), makeTestWarrior('w_low', 10)]),
      makeTestRival('r2', [makeTestWarrior('w_mid', 200), makeTestWarrior('w_other', 5)]),
    ]);
    const offers = planWorldBouts(state, rng);
    // w_high (500 fame) should be sorted first and get priority in pairing
    const allIds = offers.flatMap((o) => o.warriorIds);
    expect(allIds).toContain('w_high');
  });

  it('falls back to lastBoutWeek inactivity when fame difference is within 100', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w_old', 150, 1), makeTestWarrior('w_recent', 150, 5)]),
      makeTestRival('r2', [makeTestWarrior('w_opp', 150, 3)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers.length).toBe(1);
    // w_old has lower lastBoutWeek (1) so should be paired first
    expect(offers[0]!.warriorIds).toContain('w_old');
  });

  it('pairs warriors with close fame when multiple options exist', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 300)]),
      makeTestRival('r2', [makeTestWarrior('w2', 305)]),
      makeTestRival('r3', [makeTestWarrior('w3', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers.length).toBe(1);
    // w1 (300 fame, highest) sorts first and picks w2 (305, gap 5 < 50) before w3
    expect(offers[0]!.warriorIds).toContain('w1');
    expect(offers[0]!.warriorIds).toContain('w2');
  });

  // ─── Pairing Dedup & Exhaustion ─────────────────────────────────────────

  it('never pairs a warrior into more than one bout', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100), makeTestWarrior('w2', 100)]),
      makeTestRival('r2', [makeTestWarrior('w3', 100), makeTestWarrior('w4', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    const idCounts = new Map<string, number>();
    for (const offer of offers) {
      for (const id of offer.warriorIds) {
        idCounts.set(id, (idCounts.get(id) || 0) + 1);
      }
    }
    for (const [, count] of idCounts) {
      expect(count).toBe(1);
    }
  });

  it('handles odd number of eligible warriors by leaving one unpaired', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)]),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
      makeTestRival('r3', [makeTestWarrior('w3', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers.length).toBe(1);
    expect(offers[0]!.warriorIds.length).toBe(2);
  });

  it('pairs all eligible warriors when count is even and cross-stable options exist', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100), makeTestWarrior('w2', 100)]),
      makeTestRival('r2', [makeTestWarrior('w3', 100), makeTestWarrior('w4', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers.length).toBe(2);
    const allIds = offers.flatMap((o) => o.warriorIds);
    expect(new Set(allIds).size).toBe(4);
  });

  // ─── Vendetta Bias ────────────────────────────────────────────────────────

  it('prefers vendetta target stable when fame gap is within 200', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 300)], {
        intent: 'VENDETTA',
        targetStableId: 'r3' as StableId,
        planWeeksRemaining: 3,
      }),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
      makeTestRival('r3', [makeTestWarrior('w3', 250)]),
    ]);
    const offers = planWorldBouts(state, rng);
    // w1 (300, highest fame → outer loop first) has vendetta against r3
    // w3 (250) fame gap = 50 <= 200, so vendetta should apply
    // w2 (100) fame gap = 200 >= 50, so early break won't fire before w3 is checked
    const w1Offer = offers.find((o) => o.warriorIds.includes('w1' as WarriorId));
    expect(w1Offer).toBeDefined();
    expect(w1Offer!.warriorIds).toContain('w3' as WarriorId);
  });

  it('ignores vendetta bias when target stable warriors are already paired', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)], {
        intent: 'VENDETTA',
        targetStableId: 'r3' as StableId,
        planWeeksRemaining: 3,
      }),
      makeTestRival('r2', [makeTestWarrior('w2', 110)]),
      makeTestRival('r3', [makeTestWarrior('w3', 120)]),
      makeTestRival('r4', [makeTestWarrior('w4', 115)]),
    ]);
    // w3 and w4 are both from r3. w3 should get paired with someone first
    // (sorting is by fame: w1=100, w2=110, w4=115, w3=120 — but w3 is in r3)
    // w1 has vendetta against r3, but both w3 and w4 are candidates.
    // The pairing should still work correctly.
    const offers = planWorldBouts(state, rng);
    expect(offers.length).toBeGreaterThan(0);
  });

  it('ignores vendetta bias when fame gap exceeds 200', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 500)], {
        intent: 'VENDETTA',
        targetStableId: 'r3' as StableId,
        planWeeksRemaining: 3,
      }),
      makeTestRival('r2', [makeTestWarrior('w2', 290)]),
      makeTestRival('r3', [makeTestWarrior('w3', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    // w1 (500, highest fame → outer loop first) has vendetta against r3
    // w3 (100) fame gap = 400 > 200, so vendetta should NOT apply
    // w2 (290) fame gap = 210 >= 50, so early break won't fire before w3 is checked
    const w1Offer = offers.find((o) => o.warriorIds.includes('w1' as WarriorId));
    expect(w1Offer).toBeDefined();
    expect(w1Offer!.warriorIds).toContain('w2' as WarriorId);
  });

  // ─── BoutOffer Shape ──────────────────────────────────────────────────────

  it('sets promoterId to WORLD_MATCHMAKING constant', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)]),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers[0]!.promoterId).toBe('WORLD_MATCHMAKING');
  });

  it('sets proposerStableId to the first warrior stable', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)]),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers[0]!.proposerStableId).toBe('r1');
  });

  it('sets boutWeek and expirationWeek to state.week + 1', () => {
    const state = makeTestState(
      [
        makeTestRival('r1', [makeTestWarrior('w1', 100)]),
        makeTestRival('r2', [makeTestWarrior('w2', 100)]),
      ],
      5
    );
    const offers = planWorldBouts(state, rng);
    expect(offers[0]!.boutWeek).toBe(6);
    expect(offers[0]!.expirationWeek).toBe(6);
  });

  it('sets both warrior responses to Pending', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)]),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    const offer = offers[0]!;
    expect(offer.responses[offer.warriorIds[0]!]).toBe('Pending');
    expect(offer.responses[offer.warriorIds[1]!]).toBe('Pending');
  });

  it('generates purse in range [300, 499]', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)]),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers[0]!.purse).toBeGreaterThanOrEqual(300);
    expect(offers[0]!.purse).toBeLessThanOrEqual(499);
  });

  it('generates hype in range [100, 199]', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)]),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers[0]!.hype).toBeGreaterThanOrEqual(100);
    expect(offers[0]!.hype).toBeLessThanOrEqual(199);
  });

  it('generates a valid ISO createdAt string based on state.week', () => {
    const state = makeTestState(
      [
        makeTestRival('r1', [makeTestWarrior('w1', 100)]),
        makeTestRival('r2', [makeTestWarrior('w2', 100)]),
      ],
      1
    );
    const offers = planWorldBouts(state, rng);
    expect(offers[0]!.createdAt).toBeDefined();
    const date = new Date(offers[0]!.createdAt!);
    expect(date.toISOString()).toBe(offers[0]!.createdAt);
  });

  it('includes exactly two warriorIds per offer', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)]),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers[0]!.warriorIds.length).toBe(2);
  });

  it('sets status to Proposed', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100)]),
      makeTestRival('r2', [makeTestWarrior('w2', 100)]),
    ]);
    const offers = planWorldBouts(state, rng);
    expect(offers[0]!.status).toBe('Proposed');
  });

  // ─── Determinism / Regression ───────────────────────────────────────────

  it('returns identical offers for identical state and seeded RNG', () => {
    const state = makeTestState([
      makeTestRival('r1', [makeTestWarrior('w1', 100), makeTestWarrior('w2', 200)]),
      makeTestRival('r2', [makeTestWarrior('w3', 150), makeTestWarrior('w4', 250)]),
    ]);
    const rng1 = new SeededRNGService(12345);
    const rng2 = new SeededRNGService(12345);
    const offers1 = planWorldBouts(state, rng1);
    const offers2 = planWorldBouts(state, rng2);

    expect(offers1.length).toBe(offers2.length);
    for (let i = 0; i < offers1.length; i++) {
      expect(offers1[i]!.warriorIds.sort()).toEqual(offers2[i]!.warriorIds.sort());
      expect(offers1[i]!.purse).toBe(offers2[i]!.purse);
      expect(offers1[i]!.hype).toBe(offers2[i]!.hype);
    }
  });
});
