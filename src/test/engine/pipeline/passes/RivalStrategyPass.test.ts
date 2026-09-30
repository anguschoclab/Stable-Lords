import { describe, it, expect, vi, afterEach } from 'vitest';
import * as worldMatchmaking from '@/engine/matchmaking/worldMatchmaking';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData, GameState } from '@/types/state.types';
import {
  buildSuccessorIndex,
  handleOwnerLifecycle,
  runRivalStrategyPass,
} from '@/engine/pipeline/passes/RivalStrategyPass';
import { SeededRNG } from '@/utils/random';
import { resolveImpacts } from '@/engine/impacts';
import {
  makeWarrior as fixtureWarrior,
  makeRival as fixtureRival,
  makeGameState as fixtureGameState,
  makeBoutOffer as fixtureBoutOffer,
} from '@/test/_fixtures/factories';

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeWarrior = (id: string, name: string, overrides: Partial<Warrior> = {}): Warrior =>
  fixtureWarrior({
    id: id as WarriorId,
    name,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 0,
    ...overrides,
  } as any);

const makeRival = (overrides: Partial<RivalStableData> = {}): RivalStableData =>
  fixtureRival({
    id: 'rival-1' as any,
    owner: {
      id: 'rival-1' as any,
      name: 'Owner One',
      stableName: 'Stable One',
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
  } as any);

// fixtureGameState builds warriorMap / warriorToStableMap / rivalMap from rivals
const makeMinimalState = (rivals: RivalStableData[]): GameState =>
  fixtureGameState({ week: 5, rivals });

function makeMockRng(returns: number[]): IRNGServiceLike {
  let i = 0;
  let idCounter = 0;
  return {
    next: () => returns[i++] ?? returns[returns.length - 1] ?? 0,
    pick: <T>(arr: T[]): T => arr[0]!,
    uuid: (p?: string) => `${p ?? 'id'}-${idCounter++}`,
    roll: (min: number, _max: number) => min,
    shuffle: <T>(arr: T[]): T[] => arr,
    chance: (p: number) => p > 0,
  };
}

interface IRNGServiceLike {
  next(): number;
  pick<T>(array: T[]): T;
  uuid(prefix?: string): string;
  roll(min: number, max: number): number;
  shuffle<T>(array: T[]): T[];
  chance(probability: number): boolean;
}

// ─── Suite 1: buildSuccessorIndex ──────────────────────────────────────────

describe('buildSuccessorIndex', () => {
  it('undefined retired → empty Map', () => {
    const index = buildSuccessorIndex(undefined);
    expect(index.size).toBe(0);
  });

  it('empty retired array → empty Map', () => {
    const index = buildSuccessorIndex([]);
    expect(index.size).toBe(0);
  });

  it('warrior with fame > 200 and stableId set → in Map', () => {
    const w = makeWarrior('w1', 'Hero', { fame: 250, stableId: 'stable-a' as StableId });
    const index = buildSuccessorIndex([w]);
    expect(index.get('stable-a' as StableId)).toBe(w);
  });

  it('warrior with fame === 200 → NOT in Map (strict >)', () => {
    const w = makeWarrior('w1', 'Hero', { fame: 200, stableId: 'stable-a' as StableId });
    const index = buildSuccessorIndex([w]);
    expect(index.has('stable-a' as StableId)).toBe(false);
  });

  it('warrior with fame === 201 → in Map', () => {
    const w = makeWarrior('w1', 'Hero', { fame: 201, stableId: 'stable-a' as StableId });
    const index = buildSuccessorIndex([w]);
    expect(index.get('stable-a' as StableId)).toBe(w);
  });

  it('warrior with undefined stableId → NOT in Map', () => {
    const w = makeWarrior('w1', 'Hero', { fame: 300, stableId: undefined });
    const index = buildSuccessorIndex([w]);
    expect(index.size).toBe(0);
  });

  it('multiple warriors same stable, both fame > 200 → first in array wins', () => {
    const w1 = makeWarrior('w1', 'First', { fame: 300, stableId: 'stable-a' as StableId });
    const w2 = makeWarrior('w2', 'Second', { fame: 500, stableId: 'stable-a' as StableId });
    const index = buildSuccessorIndex([w1, w2]);
    expect(index.get('stable-a' as StableId)).toBe(w1);
    expect(index.size).toBe(1);
  });

  it('warriors from different stables → both in Map', () => {
    const w1 = makeWarrior('w1', 'Alpha', { fame: 300, stableId: 'stable-a' as StableId });
    const w2 = makeWarrior('w2', 'Beta', { fame: 400, stableId: 'stable-b' as StableId });
    const index = buildSuccessorIndex([w1, w2]);
    expect(index.size).toBe(2);
    expect(index.get('stable-a' as StableId)).toBe(w1);
    expect(index.get('stable-b' as StableId)).toBe(w2);
  });

  it('warrior with fame undefined → NOT in Map (defensive || 0)', () => {
    const w = makeWarrior('w1', 'Hero', {
      fame: undefined as any,
      stableId: 'stable-a' as StableId,
    });
    const index = buildSuccessorIndex([w]);
    expect(index.size).toBe(0);
  });
});

// ─── Suite 2: handleOwnerLifecycle ─────────────────────────────────────────

describe('handleOwnerLifecycle', () => {
  it('age < 65, rng returns 0 → no succession', () => {
    const rival = makeRival({ owner: { ...makeRival().owner, age: 50 } });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([0]);
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival, gazetteItems } = handleOwnerLifecycle(rival, 5, rng as any, index);

    expect(updatedRival.owner.name).toBe('Owner One');
    expect(gazetteItems.length).toBe(0);
  });

  it('age 65-74, rng < 0.05 → succession with successor candidate', () => {
    const successor = makeWarrior('w_succ', 'Champion Retired', {
      fame: 300,
      stableId: 'rival-1' as StableId,
    });
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 70, fame: 200, generation: 1 },
    });
    const state = makeMinimalState([rival]);
    state.retired = [successor];
    const rng = makeMockRng([0.04, 0.5]); // first next() triggers succession, second for age
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival, gazetteItems } = handleOwnerLifecycle(rival, 5, rng as any, index);

    expect(updatedRival.owner.name).toBe('Champion Retired');
    expect(updatedRival.owner.generation).toBe(2);
    expect(gazetteItems.length).toBe(1);
    expect(gazetteItems[0]).toContain('SUCCESSION');
    expect(gazetteItems[0]).toContain('Champion Retired');
  });

  it('age 75+, rng < 0.2 → succession with no successor → generic name', () => {
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 200, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([0.1, 0.5]);
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival, gazetteItems } = handleOwnerLifecycle(rival, 5, rng as any, index);

    expect(updatedRival.owner.name).toBe('Lord Stable II');
    expect(updatedRival.owner.generation).toBe(1);
    expect(gazetteItems[0]).toContain('Lord Stable II');
  });

  it('week 1 → owner age increments by 1', () => {
    const rival = makeRival({ owner: { ...makeRival().owner, age: 50 } });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([1]); // high value → no succession
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival } = handleOwnerLifecycle(rival, 1, rng as any, index);

    expect(updatedRival.owner.age).toBe(51);
  });

  it('succession → fame reset to 40% of original', () => {
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 500, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([0.1, 0.5]);
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival } = handleOwnerLifecycle(rival, 5, rng as any, index);

    expect(updatedRival.owner.fame).toBe(200); // 500 * 0.4 = 200
  });

  it('succession → new age in range [25, 39]', () => {
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 200, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([0.1, 0.0]); // age = 25 + floor(0 * 15) = 25
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival } = handleOwnerLifecycle(rival, 5, rng as any, index);

    expect(updatedRival.owner.age).toBeGreaterThanOrEqual(25);
    expect(updatedRival.owner.age).toBeLessThanOrEqual(39);
  });

  it('succession → records the absolute week the previous owner retired', () => {
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 200, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([0.1, 0.5]);
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival } = handleOwnerLifecycle(rival, 5, rng as any, index, 140);

    expect(updatedRival.owner.ageRetired).toBe(140);
  });

  it('no succession → ageRetired stays unset', () => {
    const rival = makeRival({ owner: { ...makeRival().owner, age: 50 } });
    const state = makeMinimalState([rival]);
    const rng = makeMockRng([1]);
    const index = buildSuccessorIndex(state.retired);

    const { updatedRival } = handleOwnerLifecycle(rival, 5, rng as any, index, 140);

    expect(updatedRival.owner.ageRetired).toBeUndefined();
  });
});

// ─── Suite 3: Integration via runRivalStrategyPass ─────────────────────────

describe('runRivalStrategyPass successor integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retired warrior with fame > 200 and matching stableId → successor name in gazette', () => {
    // Force SeededRNG.next() to return 0.1 so succession triggers (0.1 < 0.2 for age 80)
    vi.spyOn(SeededRNG.prototype, 'next').mockReturnValue(0.1);

    vi.spyOn(worldMatchmaking, 'planWorldBouts').mockReturnValue([]);

    const successor = makeWarrior('w_succ', 'Legendary Fighter', {
      fame: 350,
      stableId: 'rival-1' as StableId,
    });
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 200, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    state.retired = [successor];
    state.recruitPool = [];

    const impact = runRivalStrategyPass(state, 6, undefined as any, true);

    expect(impact.newsletterItems).toBeDefined();
    const allGazetteText = (impact.newsletterItems || []).flatMap((n) => n.items).join(' ');
    expect(allGazetteText).toContain('Legendary Fighter');
  });

  it('retired warrior with fame <= 200 → generic Lord name in gazette', () => {
    vi.spyOn(SeededRNG.prototype, 'next').mockReturnValue(0.1);

    vi.spyOn(worldMatchmaking, 'planWorldBouts').mockReturnValue([]);

    const nonSuccessor = makeWarrior('w_low', 'Low Fame Fighter', {
      fame: 150,
      stableId: 'rival-1' as StableId,
    });
    const rival = makeRival({
      owner: { ...makeRival().owner, age: 80, fame: 200, generation: 0 },
    });
    const state = makeMinimalState([rival]);
    state.retired = [nonSuccessor];
    state.recruitPool = [];

    const impact = runRivalStrategyPass(state, 6, undefined as any, true);

    expect(impact.newsletterItems).toBeDefined();
    const allGazetteText = (impact.newsletterItems || []).flatMap((n) => n.items).join(' ');
    expect(allGazetteText).toContain('Lord Stable');
  });
});

// ─── Suite 4: Expired offer purge ──────────────────────────────────────────

describe('runRivalStrategyPass — expired offer purge', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeOffer = (
    id: string,
    expirationWeek: number,
    status: 'Proposed' | 'Signed' | 'Declined' = 'Proposed'
  ) =>
    fixtureBoutOffer({
      id,
      promoterId: 'test-promoter',
      warriorIds: ['w1', 'w2'],
      boutWeek: expirationWeek + 1,
      expirationWeek,
      purse: 100,
      hype: 50,
      status,
      responses: {},
    } as any);

  it('purges offers with expirationWeek < state.absoluteWeek + 1', () => {
    vi.spyOn(worldMatchmaking, 'planWorldBouts').mockReturnValue([]);

    const rival = makeRival();
    const state = makeMinimalState([rival]);
    state.recruitPool = [];
    state.absoluteWeek = 10;
    state.boutOffers = {
      'expired-offer': makeOffer('expired-offer', 5),
      'valid-offer': makeOffer('valid-offer', 12),
    } as any;

    const impact = runRivalStrategyPass(state, 11, undefined as any, true);
    const resultOffers = impact.boutOffers as Record<string, any>;

    expect(resultOffers['expired-offer']).toBeUndefined();
  });

  it('preserves offers with expirationWeek >= state.absoluteWeek + 1', () => {
    vi.spyOn(worldMatchmaking, 'planWorldBouts').mockReturnValue([]);

    const rival = makeRival();
    const state = makeMinimalState([rival]);
    state.recruitPool = [];
    state.absoluteWeek = 10;
    state.boutOffers = {
      'valid-offer': makeOffer('valid-offer', 11),
    } as any;

    const impact = runRivalStrategyPass(state, 11, undefined as any, true);
    const resultOffers = impact.boutOffers as Record<string, any>;

    expect(resultOffers['valid-offer']).toBeDefined();
  });

  it('purges only expired offers, keeping valid ones', () => {
    vi.spyOn(worldMatchmaking, 'planWorldBouts').mockReturnValue([]);

    const rival = makeRival();
    const state = makeMinimalState([rival]);
    state.recruitPool = [];
    state.absoluteWeek = 10;
    state.boutOffers = {
      'keep-1': makeOffer('keep-1', 15),
      'keep-2': makeOffer('keep-2', 11),
      'purge-1': makeOffer('purge-1', 5),
      'purge-2': makeOffer('purge-2', 9),
    } as any;

    const impact = runRivalStrategyPass(state, 11, undefined as any, true);
    const resultOffers = impact.boutOffers as Record<string, any>;

    expect(resultOffers['purge-1']).toBeUndefined();
    expect(resultOffers['purge-2']).toBeUndefined();
    expect(resultOffers['keep-1']).toBeDefined();
    expect(resultOffers['keep-2']).toBeDefined();
  });
});

// ─── Suite 5: Tournament creation (no resolution) ──────────────────────────

describe('runRivalStrategyPass — tournament week', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates tournaments without resolving them on a seasonal tournament week', () => {
    vi.spyOn(worldMatchmaking, 'planWorldBouts').mockReturnValue([]);

    const rival = makeRival({
      roster: [
        makeWarrior('w1', 'Fighter 1', { fame: 50, stableId: 'rival-1' as StableId }),
        makeWarrior('w2', 'Fighter 2', { fame: 50, stableId: 'rival-1' as StableId }),
      ],
    });
    const state = makeMinimalState([rival]);
    state.recruitPool = [];
    state.absoluteWeek = 9;
    state.week = 9;

    const impact = runRivalStrategyPass(state, 10, undefined as any, true);

    expect(impact.isTournamentWeek).toBe(true);
    expect(impact.activeTournamentId).toBeDefined();
    expect(impact.day).toBe(0);
    const tournaments = impact.tournaments as any[];
    expect(tournaments).toBeDefined();
    expect(tournaments.length).toBeGreaterThan(0);
    for (const tour of tournaments) {
      expect(tour.completed).toBe(false);
    }
    // No graveyard/arenaHistory/rosterRemovals from tournament resolution
    expect(impact.graveyard).toBeUndefined();
    expect(impact.arenaHistory).toBeUndefined();
    expect(impact.rosterRemovals).toBeUndefined();
  });
});

// ─── Suite: seasonal tournament headless gating ─────────────────────────────

describe('runRivalStrategyPass — seasonal tournament headless gating', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('headless suppresses the player-facing announcement but still seeds tournaments', () => {
    vi.spyOn(worldMatchmaking, 'planWorldBouts').mockReturnValue([]);
    const rival = makeRival();
    const state = makeMinimalState([rival]);

    const impact = runRivalStrategyPass(state, 10, undefined as any, true);

    expect(impact.tournaments?.length).toBeGreaterThan(0);
    expect(impact.isTournamentWeek).toBe(true);
    const titles = (impact.newsletterItems ?? []).map((n) => n.title);
    expect(titles).not.toContain('🎖️ TOURNAMENT ANNOUNCEMENT');
  });

  it('non-headless emits the tournament announcement', () => {
    vi.spyOn(worldMatchmaking, 'planWorldBouts').mockReturnValue([]);
    const rival = makeRival();
    const state = makeMinimalState([rival]);

    const impact = runRivalStrategyPass(state, 10, undefined as any, false);

    const titles = (impact.newsletterItems ?? []).map((n) => n.title);
    expect(titles).toContain('🎖️ TOURNAMENT ANNOUNCEMENT');
  });
});

describe('runRivalStrategyPass — bankruptcy succession', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('replaces a bankrupt stable with its successor instead of leaving a ghost', () => {
    vi.spyOn(worldMatchmaking, 'planWorldBouts').mockReturnValue([]);
    const bankrupt = makeRival({
      treasury: -100_000,
      roster: [makeWarrior('w_old', 'Old Guard', { stableId: 'rival-1' as StableId })],
    });
    const state = makeMinimalState([bankrupt]);
    state.recruitPool = [];

    const impact = runRivalStrategyPass(state, 6, undefined as any, true);

    const successor = impact.rivalReplacements?.get('rival-1' as StableId);
    expect(successor).toBeDefined();
    expect(successor!.id).not.toBe('rival-1');

    const out = resolveImpacts(structuredClone(state), [impact]);
    const ids = out.rivals.map((r) => r.id);
    expect(ids).toEqual([successor!.id]);
    expect(out.rivals.flatMap((r) => r.roster).some((w) => w.id === 'w_old')).toBe(false);
  });

  it('routes the dissolved stable roster into the recruit pool as veterans', () => {
    vi.spyOn(worldMatchmaking, 'planWorldBouts').mockReturnValue([]);
    const bankrupt = makeRival({
      treasury: -100_000,
      roster: [makeWarrior('w_old', 'Old Guard', { stableId: 'rival-1' as StableId })],
    });
    const state = makeMinimalState([bankrupt]);
    state.recruitPool = [];

    const impact = runRivalStrategyPass(state, 6, undefined as any, true);

    expect(impact.rivalReplacements?.has('rival-1' as StableId)).toBe(true);
    const poolIds = (impact.recruitPool ?? []).map((p) => p.id);
    // The dissolved warrior survives as a free agent — not silently lost.
    expect(poolIds).toContain('w_old');
  });
});
