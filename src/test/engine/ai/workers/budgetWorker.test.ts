import { describe, it, expect } from 'vitest';
import { checkBudget } from '@/engine/ai/workers/budgetWorker';
import type { RivalStableData } from '@/types/state.types';

function createMockRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival_1' as any,
    owner: {
      id: 'owner_1' as any,
      name: 'Test Owner',
      stableName: 'Test Stable',
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
    },
    fame: 100,
    roster: [],
    treasury: 1000,
    ledger: [],
    trainingAssignments: [],
    ...overrides,
  } as RivalStableData;
}

// ─── Risk Tier Boundaries ──────────────────────────────────────────────────

describe('checkBudget — risk tier boundaries', () => {
  it('cost=0 → Low', () => {
    const rival = createMockRival();
    const result = checkBudget(rival, 0, 'OTHER');
    expect(result.riskTier).toBe('Low');
  });

  it('cost=200 → Low (not > 200)', () => {
    const rival = createMockRival();
    const result = checkBudget(rival, 200, 'OTHER');
    expect(result.riskTier).toBe('Low');
  });

  it('cost=201 → Medium (just > 200)', () => {
    const rival = createMockRival();
    const result = checkBudget(rival, 201, 'OTHER');
    expect(result.riskTier).toBe('Medium');
  });

  it('cost=500 → Medium (not > 500)', () => {
    const rival = createMockRival();
    const result = checkBudget(rival, 500, 'OTHER');
    expect(result.riskTier).toBe('Medium');
  });

  it('cost=501 → High (just > 500)', () => {
    const rival = createMockRival();
    const result = checkBudget(rival, 501, 'OTHER');
    expect(result.riskTier).toBe('High');
  });
});

// ─── Personality Tolerance ─────────────────────────────────────────────────

describe('checkBudget — personality tolerance', () => {
  // All tests: treasury=1000, burnRate=0 → available=700

  it('Aggressive (1.5×): affordable at 1050, not at 1051', () => {
    const rival = createMockRival({
      owner: { ...createMockRival().owner, personality: 'Aggressive' },
    });
    expect(checkBudget(rival, 1050, 'OTHER').isAffordable).toBe(true);
    expect(checkBudget(rival, 1051, 'OTHER').isAffordable).toBe(false);
  });

  it('Methodical (0.8×): affordable at 560, not at 561', () => {
    const rival = createMockRival({
      owner: { ...createMockRival().owner, personality: 'Methodical' },
    });
    expect(checkBudget(rival, 560, 'OTHER').isAffordable).toBe(true);
    expect(checkBudget(rival, 561, 'OTHER').isAffordable).toBe(false);
  });

  it('Pragmatic (1.0×): affordable at 700, not at 701', () => {
    const rival = createMockRival();
    expect(checkBudget(rival, 700, 'OTHER').isAffordable).toBe(true);
    expect(checkBudget(rival, 701, 'OTHER').isAffordable).toBe(false);
  });

  it('Showman (default 1.0×): affordable at 700, not at 701', () => {
    const rival = createMockRival({
      owner: { ...createMockRival().owner, personality: 'Showman' },
    });
    expect(checkBudget(rival, 700, 'OTHER').isAffordable).toBe(true);
    expect(checkBudget(rival, 701, 'OTHER').isAffordable).toBe(false);
  });

  it('Tactician (default 1.0×): affordable at 700, not at 701', () => {
    const rival = createMockRival({
      owner: { ...createMockRival().owner, personality: 'Tactician' },
    });
    expect(checkBudget(rival, 700, 'OTHER').isAffordable).toBe(true);
    expect(checkBudget(rival, 701, 'OTHER').isAffordable).toBe(false);
  });

  it('personality undefined → defaults to Pragmatic (1.0×)', () => {
    const rival = createMockRival({
      owner: { ...createMockRival().owner, personality: undefined },
    });
    expect(checkBudget(rival, 700, 'OTHER').isAffordable).toBe(true);
    expect(checkBudget(rival, 701, 'OTHER').isAffordable).toBe(false);
  });
});

// ─── Burn Rate ─────────────────────────────────────────────────────────────

describe('checkBudget — burn rate', () => {
  // All tests: Pragmatic personality, treasury=1000

  it('burnRate=100 → available=600, affordable at 600, not at 601', () => {
    const rival = createMockRival({
      agentMemory: {
        lastTreasury: 1000,
        burnRate: 100,
        metaAwareness: {},
        knownRivals: [],
      },
    });
    expect(checkBudget(rival, 600, 'OTHER').isAffordable).toBe(true);
    expect(checkBudget(rival, 601, 'OTHER').isAffordable).toBe(false);
  });

  it('agentMemory undefined → burnRate=0, available=700', () => {
    const rival = createMockRival();
    // agentMemory not set in createMockRival default
    expect(checkBudget(rival, 700, 'OTHER').isAffordable).toBe(true);
  });

  it('burnRate=0 (explicit) → available=700', () => {
    const rival = createMockRival({
      agentMemory: {
        lastTreasury: 1000,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
      },
    });
    expect(checkBudget(rival, 700, 'OTHER').isAffordable).toBe(true);
  });

  it('agentMemory defined but burnRate undefined → burnRate=0, available=700', () => {
    const rival = createMockRival({
      agentMemory: {
        lastTreasury: 1000,
        burnRate: undefined as any,
        metaAwareness: {},
        knownRivals: [],
      },
    });
    expect(checkBudget(rival, 700, 'OTHER').isAffordable).toBe(true);
  });
});

// ─── Treasury Edge Cases ───────────────────────────────────────────────────

describe('checkBudget — treasury edge cases', () => {
  // All tests: Pragmatic personality, burnRate=0

  it('treasury=0 → available=-300, unaffordable, adjustedTreasury=0', () => {
    const rival = createMockRival({ treasury: 0 });
    const result = checkBudget(rival, 100, 'OTHER');
    expect(result.isAffordable).toBe(false);
    expect(result.adjustedTreasury).toBe(0);
  });

  it('treasury undefined → treated as 0, unaffordable, adjustedTreasury=0', () => {
    const rival = createMockRival({ treasury: undefined as any });
    const result = checkBudget(rival, 100, 'OTHER');
    expect(result.isAffordable).toBe(false);
    expect(result.adjustedTreasury).toBe(0);
  });

  it('treasury=-100 (negative, truthy) → available=-400, unaffordable, adjustedTreasury=-100', () => {
    const rival = createMockRival({ treasury: -100 });
    const result = checkBudget(rival, 100, 'OTHER');
    expect(result.isAffordable).toBe(false);
    expect(result.adjustedTreasury).toBe(-100);
  });
});

// ─── Adjusted Treasury ─────────────────────────────────────────────────────

describe('checkBudget — adjusted treasury', () => {
  it('affordable: treasury=1000, cost=100 → adjustedTreasury=900', () => {
    const rival = createMockRival({ treasury: 1000 });
    const result = checkBudget(rival, 100, 'OTHER');
    expect(result.isAffordable).toBe(true);
    expect(result.adjustedTreasury).toBe(900);
  });

  it('not affordable: treasury=100, cost=500 → adjustedTreasury=100 (unchanged)', () => {
    const rival = createMockRival({ treasury: 100 });
    const result = checkBudget(rival, 500, 'OTHER');
    expect(result.isAffordable).toBe(false);
    expect(result.adjustedTreasury).toBe(100);
  });
});

// ─── Edge Cases & Parameter ────────────────────────────────────────────────

describe('checkBudget — edge cases & parameter', () => {
  it('cost=0 → affordable, riskTier=Low, adjustedTreasury=treasury', () => {
    const rival = createMockRival({ treasury: 1000 });
    const result = checkBudget(rival, 0, 'OTHER');
    expect(result.isAffordable).toBe(true);
    expect(result.riskTier).toBe('Low');
    expect(result.adjustedTreasury).toBe(1000);
  });

  it('negative cost (-50) → affordable (quirk), adjustedTreasury=treasury+50', () => {
    const rival = createMockRival({ treasury: 1000 });
    const result = checkBudget(rival, -50, 'OTHER');
    expect(result.isAffordable).toBe(true);
    expect(result.adjustedTreasury).toBe(1050);
  });

  it('all _category values produce identical results', () => {
    const rival = createMockRival({ treasury: 1000 });
    const staff = checkBudget(rival, 250, 'STAFF');
    const roster = checkBudget(rival, 250, 'ROSTER');
    const other = checkBudget(rival, 250, 'OTHER');
    expect(staff).toEqual(roster);
    expect(roster).toEqual(other);
  });
});
