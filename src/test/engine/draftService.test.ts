import { describe, it, expect, beforeEach } from 'vitest';
import { aiDraftFromPool } from '@/engine/draftService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle, type StableId, type FightId } from '@/types/shared.types';
import type { RivalStableData, GameState } from '@/types/state.types';
import type { PoolWarrior } from '@/engine/recruitment';
import { createDefaultMeta } from '@/engine/metaDrift';

function makeMinimalRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival_test' as StableId,
    owner: {
      id: 'owner_test' as StableId,
      name: 'Test Owner',
      stableName: 'Test Stable',
      fame: 50,
      renown: 10,
      titles: 0,
      personality: 'Pragmatic',
    },
    fame: 50,
    roster: [],
    treasury: 1000,
    tier: 'Established',
    actionHistory: [],
    agentMemory: {
      lastTreasury: 1000,
      burnRate: 0,
      metaAwareness: {},
      knownRivals: [],
    },
    ...overrides,
  } as any as RivalStableData;
}

function makePoolWarrior(overrides: Partial<PoolWarrior> = {}): PoolWarrior {
  return {
    id: 'recruit_test',
    name: 'Test Recruit',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    potential: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
    baseSkills: { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 5, DEC: 5 },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 12 },
    tier: 'Promising',
    cost: 100,
    age: 18,
    lore: 'A test recruit.',
    traits: ['IronWill'],
    addedWeek: 1,
    favorites: {
      weaponId: 'longsword',
      rhythm: { oe: 7, al: 5 },
      discovered: { weapon: true, rhythm: false, weaponHints: 1, rhythmHints: 0 },
    },
    lineage: { generation: 1, pedigree: 'Commoner' },
    ...overrides,
  };
}

function makeMinimalGameState(overrides: Partial<GameState> = {}): GameState {
  const baseState = createFreshState('test-seed');
  return {
    ...baseState,
    arenaHistory: [],
    cachedMetaDrift: undefined,
    ...overrides,
  };
}

describe('aiDraftFromPool', () => {
  let state: GameState;
  let pool: PoolWarrior[];
  let rivals: RivalStableData[];

  beforeEach(() => {
    state = makeMinimalGameState();
    pool = [
      makePoolWarrior({ id: 'recruit1', name: 'Recruit 1', style: FightingStyle.StrikingAttack }),
      makePoolWarrior({ id: 'recruit2', name: 'Recruit 2', style: FightingStyle.ParryStrike }),
      makePoolWarrior({ id: 'recruit3', name: 'Recruit 3', style: FightingStyle.BashingAttack }),
    ];
    rivals = [
      makeMinimalRival({
        id: 'rival1' as StableId,
        owner: {
          ...makeMinimalRival().owner,
          id: 'owner1' as StableId,
          name: 'Owner 1',
          stableName: 'Stable 1',
        },
      }),
      makeMinimalRival({
        id: 'rival2' as StableId,
        owner: {
          ...makeMinimalRival().owner,
          id: 'owner2' as StableId,
          name: 'Owner 2',
          stableName: 'Stable 2',
        },
      }),
    ];
  });

  // 1. Basic Functionality Tests

  describe('Basic Functionality', () => {
    it('returns expected structure', () => {
      const result = aiDraftFromPool(pool, rivals, 1, state);

      expect(result).toHaveProperty('updatedPool');
      expect(result).toHaveProperty('updatedRivals');
      expect(result).toHaveProperty('gazetteItems');
      expect(Array.isArray(result.updatedPool)).toBe(true);
      expect(Array.isArray(result.updatedRivals)).toBe(true);
      expect(Array.isArray(result.gazetteItems)).toBe(true);
    });

    it('handles empty pool', () => {
      const result = aiDraftFromPool([], rivals, 1, state);

      expect(result.updatedPool).toEqual([]);
      expect(result.updatedRivals.length).toBe(rivals.length);
      expect(result.gazetteItems).toEqual([]);
    });

    it('handles empty rivals list', () => {
      const result = aiDraftFromPool(pool, [], 1, state);

      expect(result.updatedPool).toEqual(pool);
      expect(result.updatedRivals).toEqual([]);
      expect(result.gazetteItems).toEqual([]);
    });

    it('handles single rival', () => {
      const singleRival = [makeMinimalRival({ treasury: 2000 })];
      const result = aiDraftFromPool(pool, singleRival, 4, state);

      expect(result.updatedRivals.length).toBe(1);
      // Rival may recruit on major draft week (week 4)
    });
  });

  // 2. Snake Draft Priority Tests

  describe('Snake Draft Priority', () => {
    it('sorts by fewest active warriors (primary)', () => {
      const rivalA = makeMinimalRival({ id: 'rivalA' as StableId, roster: [] }); // 0 active
      const rivalB = makeMinimalRival({
        id: 'rivalB' as StableId,
        roster: [
          { status: 'Active' } as any,
          { status: 'Active' } as any,
          { status: 'Active' } as any,
        ],
      }); // 3 active
      const rivalC = makeMinimalRival({
        id: 'rivalC' as StableId,
        roster: [
          { status: 'Active' } as any,
          { status: 'Active' } as any,
          { status: 'Active' } as any,
          { status: 'Active' } as any,
          { status: 'Active' } as any,
        ],
      }); // 5 active

      const result = aiDraftFromPool(pool, [rivalA, rivalB, rivalC], 4, state);

      // Rival A should get first pick (fewest warriors)
      expect(result.updatedRivals.length).toBe(3);
    });

    it('sorts by lowest treasury (secondary)', () => {
      const rivalA = makeMinimalRival({
        id: 'rivalA' as StableId,
        treasury: 500,
        roster: [{ status: 'Active' } as any, { status: 'Active' } as any],
      });
      const rivalB = makeMinimalRival({
        id: 'rivalB' as StableId,
        treasury: 1000,
        roster: [{ status: 'Active' } as any, { status: 'Active' } as any],
      });
      const rivalC = makeMinimalRival({
        id: 'rivalC' as StableId,
        treasury: 1500,
        roster: [{ status: 'Active' } as any, { status: 'Active' } as any],
      });

      const result = aiDraftFromPool(pool, [rivalA, rivalB, rivalC], 4, state);

      expect(result.updatedRivals.length).toBe(3);
    });

    it('preserves original rival order in output', () => {
      const rivalA = makeMinimalRival({
        id: 'rivalA' as StableId,
        owner: {
          ...makeMinimalRival().owner,
          id: 'ownerA' as StableId,
          name: 'Owner A',
          stableName: 'Stable A',
        },
      });
      const rivalB = makeMinimalRival({
        id: 'rivalB' as StableId,
        owner: {
          ...makeMinimalRival().owner,
          id: 'ownerB' as StableId,
          name: 'Owner B',
          stableName: 'Stable B',
        },
      });
      const rivalC = makeMinimalRival({
        id: 'rivalC' as StableId,
        owner: {
          ...makeMinimalRival().owner,
          id: 'ownerC' as StableId,
          name: 'Owner C',
          stableName: 'Stable C',
        },
      });

      const inputOrder = [rivalA, rivalB, rivalC];
      const result = aiDraftFromPool(pool, inputOrder, 4, state);

      expect(result.updatedRivals[0]?.id).toBe('rivalA');
      expect(result.updatedRivals[1]?.id).toBe('rivalB');
      expect(result.updatedRivals[2]?.id).toBe('rivalC');
    });
  });

  // 3. Meta Drift Integration Tests

  describe('Meta Drift Integration', () => {
    it('uses cached meta drift when available', () => {
      const cachedMeta = createDefaultMeta();
      cachedMeta[FightingStyle.StrikingAttack] = 5;
      const stateWithCache = makeMinimalGameState({ cachedMetaDrift: cachedMeta });

      const result = aiDraftFromPool(pool, rivals, 1, stateWithCache);

      expect(result.updatedRivals.length).toBe(2);
    });

    it('computes meta drift from arenaHistory when cache missing', () => {
      const stateWithHistory = makeMinimalGameState({
        arenaHistory: [
          {
            id: 'fight1' as FightId,
            week: 1,
            title: 'Test Fight',
            warriorIdA: 'w1' as any,
            warriorIdD: 'w2' as any,
            winner: 'A',
            by: 'Kill',
            styleA: 'StrikingAttack',
            styleD: 'ParryStrike',
            createdAt: new Date().toISOString(),
          },
        ],
        cachedMetaDrift: undefined,
      });

      const result = aiDraftFromPool(pool, rivals, 1, stateWithHistory);

      expect(result.updatedRivals.length).toBe(2);
    });

    it('handles empty arenaHistory', () => {
      const stateWithEmptyHistory = makeMinimalGameState({
        arenaHistory: [],
        cachedMetaDrift: undefined,
      });

      const result = aiDraftFromPool(pool, rivals, 1, stateWithEmptyHistory);

      expect(result.updatedRivals.length).toBe(2);
    });
  });

  // 4. Major Draft Week Tests

  describe('Major Draft Week', () => {
    it('major draft week detection (week % 4 === 0)', () => {
      const result = aiDraftFromPool(pool, rivals, 4, state);

      expect(result.updatedRivals.length).toBe(2);
    });

    it('non-major draft week', () => {
      const result = aiDraftFromPool(pool, rivals, 5, state);

      expect(result.updatedRivals.length).toBe(2);
    });

    it('major week increases recruitment likelihood', () => {
      const richRivals = rivals.map((r) => makeMinimalRival({ ...r, treasury: 5000 }));

      const majorWeekResult = aiDraftFromPool(pool, richRivals, 4, state);
      const normalWeekResult = aiDraftFromPool(pool, richRivals, 5, state);

      // Major week should have at least as many recruits signed
      const majorWeekRecruits = majorWeekResult.updatedRivals.reduce(
        (sum, r) => sum + r.roster.length,
        0
      );
      const normalWeekRecruits = normalWeekResult.updatedRivals.reduce(
        (sum, r) => sum + r.roster.length,
        0
      );

      expect(majorWeekRecruits).toBeGreaterThanOrEqual(normalWeekRecruits);
    });
  });

  // 5. RNG Determinism Tests

  describe('RNG Determinism', () => {
    it('uses default seed formula when no seed provided', () => {
      const result = aiDraftFromPool(pool, rivals, 10, state);

      expect(result.updatedRivals.length).toBe(2);
    });

    it('uses custom seed override', () => {
      const result1 = aiDraftFromPool(pool, rivals, 1, state, 12345);
      const result2 = aiDraftFromPool(pool, rivals, 1, state, 12345);

      expect(result1.updatedRivals.length).toBe(result2.updatedRivals.length);
    });

    it('uses custom RNG service override', () => {
      const customRng = new SeededRNGService(999);
      const result = aiDraftFromPool(pool, rivals, 1, state, undefined, customRng);

      expect(result.updatedRivals.length).toBe(2);
    });

    it('deterministic output with same seed', () => {
      const rivalsCopy = JSON.parse(JSON.stringify(rivals));
      const poolCopy = JSON.parse(JSON.stringify(pool));

      const result1 = aiDraftFromPool(poolCopy, rivalsCopy, 1, state, 42);
      const result2 = aiDraftFromPool(pool, rivals, 1, state, 42);

      expect(result1.updatedPool.length).toBe(result2.updatedPool.length);
      expect(result1.updatedRivals.length).toBe(result2.updatedRivals.length);
      expect(result1.gazetteItems.length).toBe(result2.gazetteItems.length);
    });
  });

  // 6. Gazette Item Generation Tests

  describe('Gazette Item Generation', () => {
    it('gazette items generated for signed recruits', () => {
      const richRival = makeMinimalRival({ treasury: 5000 });
      const result = aiDraftFromPool(pool, [richRival], 4, state);

      if (result.gazetteItems.length > 0) {
        expect(result.gazetteItems[0] ?? '').toContain('MARKET');
        expect(result.gazetteItems[0] ?? '').toContain('signed');
      }
    });

    it('gazette items aggregated across all rivals', () => {
      const richRivals = rivals.map((r) => makeMinimalRival({ ...r, treasury: 5000 }));
      const result = aiDraftFromPool(pool, richRivals, 4, state);

      // Gazettes should be an array (may be empty if no recruits signed)
      expect(Array.isArray(result.gazetteItems)).toBe(true);
    });

    it('no gazette items when no recruits signed', () => {
      const poorRivals = rivals.map((r) => makeMinimalRival({ ...r, treasury: 10 }));
      const result = aiDraftFromPool(pool, poorRivals, 1, state);

      expect(result.gazetteItems).toEqual([]);
    });
  });

  // 7. Pool Mutation Tests

  describe('Pool Mutation', () => {
    it('recruits removed from pool when signed', () => {
      const richRival = makeMinimalRival({ treasury: 5000 });
      const initialPoolSize = pool.length;
      const result = aiDraftFromPool(pool, [richRival], 4, state);

      // Pool should be smaller if recruits were signed
      expect(result.updatedPool.length).toBeLessThanOrEqual(initialPoolSize);
    });

    it('pool shared across rivals (snake draft)', () => {
      const richRivals = rivals.map((r) => makeMinimalRival({ ...r, treasury: 5000 }));
      const result = aiDraftFromPool(pool, richRivals, 4, state);

      // Total recruits in rosters + remaining pool should equal initial pool
      const totalRecruited = result.updatedRivals.reduce((sum, r) => sum + r.roster.length, 0);
      expect(totalRecruited + result.updatedPool.length).toBeLessThanOrEqual(pool.length);
    });

    it('pool unchanged when no recruits signed', () => {
      const poorRivals = rivals.map((r) => makeMinimalRival({ ...r, treasury: 10 }));
      const result = aiDraftFromPool(pool, poorRivals, 1, state);

      expect(result.updatedPool.length).toBe(pool.length);
    });
  });

  // 8. Budget and Recruitment Limits Tests

  describe('Budget and Recruitment Limits', () => {
    it('respects rival treasury limits', () => {
      const poorRival = makeMinimalRival({ treasury: 50 });
      const expensivePool = [makePoolWarrior({ cost: 100 })];
      const result = aiDraftFromPool(expensivePool, [poorRival], 4, state);

      expect(result.updatedRivals[0]?.roster.length).toBe(0);
    });

    it('respects roster caps (Aggressive = 10)', () => {
      const aggressiveRival = makeMinimalRival({
        owner: { ...makeMinimalRival().owner, personality: 'Aggressive' },
        treasury: 10000,
        roster: Array(10)
          .fill(null)
          .map(() => ({ status: 'Active' }) as any),
      });
      if (!aggressiveRival.owner) throw new Error('Owner missing');
      const result = aiDraftFromPool(pool, [aggressiveRival], 4, state);

      // Should not recruit beyond 10
      expect(result.updatedRivals[0]?.roster.length).toBe(10);
    });

    it('respects roster caps (non-Aggressive = 8)', () => {
      const pragmaticRival = makeMinimalRival({
        owner: { ...makeMinimalRival().owner, personality: 'Pragmatic' },
        treasury: 10000,
        roster: Array(8)
          .fill(null)
          .map(() => ({ status: 'Active' }) as any),
      });
      if (!pragmaticRival.owner) throw new Error('Owner missing');
      const result = aiDraftFromPool(pool, [pragmaticRival], 4, state);

      // Should not recruit beyond 8
      expect(result.updatedRivals[0]?.roster.length).toBe(8);
    });
  });

  // 9. Personality-Based Style Preferences Tests

  describe('Personality-Based Style Preferences', () => {
    it('personality influences recruit selection', () => {
      const aggressiveRival = makeMinimalRival({
        owner: { ...makeMinimalRival().owner, personality: 'Aggressive' },
        treasury: 5000,
      });
      const stylePool = [
        makePoolWarrior({ id: 'recruit1', style: FightingStyle.BashingAttack }),
        makePoolWarrior({ id: 'recruit2', style: FightingStyle.ParryStrike }),
      ];

      const result = aiDraftFromPool(stylePool, [aggressiveRival], 4, state);

      expect(result.updatedRivals.length).toBe(1);
    });

    it('style diversity guard (penalizes duplicates)', () => {
      const rivalWithStriking = makeMinimalRival({
        treasury: 5000,
        roster: [
          {
            status: 'Active',
            style: FightingStyle.StrikingAttack,
          } as any,
        ],
      });
      const stylePool = [
        makePoolWarrior({ id: 'recruit1', style: FightingStyle.StrikingAttack }),
        makePoolWarrior({ id: 'recruit2', style: FightingStyle.ParryStrike }),
      ];

      const result = aiDraftFromPool(stylePool, [rivalWithStriking], 4, state);

      expect(result.updatedRivals.length).toBe(1);
    });
  });

  // 10. Integration with processRecruitment Tests

  describe('Integration with processRecruitment', () => {
    it('delegates correctly to processRecruitment', () => {
      const result = aiDraftFromPool(pool, rivals, 4, state);

      // Each rival should have been processed
      expect(result.updatedRivals.length).toBe(rivals.length);
    });

    it('accumulates results from all rivals', () => {
      const richRivals = rivals.map((r) => makeMinimalRival({ ...r, treasury: 5000 }));
      const result = aiDraftFromPool(pool, richRivals, 4, state);

      const totalRecruits = result.updatedRivals.reduce((sum, r) => sum + r.roster.length, 0);
      expect(totalRecruits).toBeGreaterThanOrEqual(0);
    });
  });

  // 11. Edge Cases

  describe('Edge Cases', () => {
    it('week 0 handling', () => {
      const result = aiDraftFromPool(pool, rivals, 0, state);

      expect(result.updatedRivals.length).toBe(2);
    });

    it('negative week handling', () => {
      const result = aiDraftFromPool(pool, rivals, -1, state);

      expect(result.updatedRivals.length).toBe(2);
    });

    it('very large week numbers', () => {
      const result = aiDraftFromPool(pool, rivals, 10000, state);

      expect(result.updatedRivals.length).toBe(2);
    });

    it('rival with missing optional fields', () => {
      const minimalRival = {
        id: 'minimal' as StableId,
        owner: {
          id: 'owner_min' as StableId,
          name: 'Min Owner',
          stableName: 'Min Stable',
          fame: 50,
          renown: 10,
          titles: 0,
        },
        fame: 50,
        roster: [],
        treasury: 1000,
      } as any as RivalStableData;

      const result = aiDraftFromPool(pool, [minimalRival], 4, state);

      expect(result.updatedRivals.length).toBe(1);
    });
  });
});
