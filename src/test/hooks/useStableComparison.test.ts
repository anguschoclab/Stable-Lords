// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { stableStats, useStableComparison } from '@/hooks/useScoutingStableComparison';
import type { RivalStableData, Warrior, OwnerGrudge } from '@/types/game';
import { FightingStyle } from '@/types/game';
import type { StableId, GrudgeId, WarriorId } from '@/types/shared.types';
import '@/test/_setup/setup';

let storeOverride: any = {};

const defaultStoreState = {
  ownerGrudges: [] as OwnerGrudge[],
};

vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    useGameStore: (selector?: (state: any) => any) => {
      const state = { ...defaultStoreState, ...storeOverride };
      return selector ? selector(state) : state;
    },
  };
});

function createMockWarrior(id: string, overrides?: Partial<Warrior>): Warrior {
  return {
    id: id as WarriorId,
    name: `Warrior ${id}`,
    status: 'Active',
    fame: 0,
    popularity: 0,
    style: FightingStyle.StrikingAttack,
    champion: false,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    ...overrides,
  } as Warrior;
}

function createMockRival(id: string, overrides?: Partial<RivalStableData>): RivalStableData {
  return {
    id: id as StableId,
    owner: {
      id: id as StableId,
      name: `Owner ${id}`,
      stableName: `Stable ${id}`,
      fame: 0,
      renown: 0,
      titles: 0,
      personality: 'Pragmatic',
    },
    fame: 0,
    roster: [],
    treasury: 0,
    ...overrides,
  } as RivalStableData;
}

function createMockGrudge(
  ownerIdA: string,
  ownerIdB: string,
  overrides?: Partial<OwnerGrudge>
): OwnerGrudge {
  return {
    id: `grudge-${ownerIdA}-${ownerIdB}` as GrudgeId,
    ownerIdA: ownerIdA as StableId,
    ownerIdB: ownerIdB as StableId,
    intensity: 1,
    reason: 'Test grudge',
    startWeek: 1,
    lastEscalation: 1,
    ...overrides,
  } as OwnerGrudge;
}

describe('stableStats', () => {
  it('returns rosterSize aliased from activeCount', () => {
    const rival = createMockRival('r1', {
      roster: [createMockWarrior('w1')],
    });
    const result = stableStats(rival);
    expect(result.rosterSize).toBe(result.activeCount);
  });

  it('returns avgAttrs aliased from avgAttributes', () => {
    const rival = createMockRival('r1', {
      roster: [
        createMockWarrior('w1', {
          attributes: { ST: 12, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        }),
      ],
    });
    const result = stableStats(rival);
    expect(result.avgAttrs).toBe(result.avgAttributes);
    expect(result.avgAttrs.ST).toBe(12);
  });

  it('handles empty roster correctly', () => {
    const rival = createMockRival('r1', { roster: [] });
    const result = stableStats(rival);
    expect(result.rosterSize).toBe(0);
    expect(result.totalWins).toBe(0);
    expect(result.totalLosses).toBe(0);
    expect(result.totalKills).toBe(0);
    expect(result.totalFame).toBe(0);
    expect(result.avgFame).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.styleCounts).toEqual({});
    expect(result.topWarrior).toBeNull();
    expect(result.avgAttrs).toEqual({ ST: 0, CN: 0, SZ: 0, WT: 0, WL: 0, SP: 0, DF: 0 });
  });

  it('ignores non-active warriors', () => {
    const rival = createMockRival('r1', {
      roster: [
        createMockWarrior('w1', {
          status: 'Dead',
          fame: 100,
          career: { wins: 5, losses: 2, kills: 1 },
        }),
        createMockWarrior('w2', {
          status: 'Retired',
          fame: 200,
          career: { wins: 10, losses: 1, kills: 2 },
        }),
      ],
    });
    const result = stableStats(rival);
    expect(result.rosterSize).toBe(0);
    expect(result.totalFame).toBe(0);
    expect(result.totalWins).toBe(0);
  });

  it('preserves all base fields from calculateStableStats', () => {
    const rival = createMockRival('r1', {
      roster: [
        createMockWarrior('w1', {
          fame: 100,
          career: { wins: 10, losses: 5, kills: 2 },
          style: FightingStyle.BashingAttack,
        }),
      ],
    });
    const result = stableStats(rival);
    expect(result.activeCount).toBe(1);
    expect(result.totalWins).toBe(10);
    expect(result.totalLosses).toBe(5);
    expect(result.totalKills).toBe(2);
    expect(result.totalFame).toBe(100);
    expect(result.avgFame).toBe(100);
    expect(result.winRate).toBe(67);
    expect(result.styleCounts).toEqual({ [FightingStyle.BashingAttack]: 1 });
    expect(result.topWarrior).not.toBeNull();
    expect(result.topWarrior!.id).toBe('w1' as WarriorId);
  });
});

describe('useStableComparison', () => {
  beforeEach(() => {
    storeOverride = {};
  });

  it('returns correct initial state with no rivals selected', () => {
    const rival1 = createMockRival('r1');
    const rival2 = createMockRival('r2');
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    expect(result.current.idA).toBeNull();
    expect(result.current.idB).toBeNull();
    expect(result.current.rivalA).toBeUndefined();
    expect(result.current.rivalB).toBeUndefined();
    expect(result.current.statsA).toBeNull();
    expect(result.current.statsB).toBeNull();
    expect(result.current.grudge).toBeNull();
    expect(result.current.clashes).toBe(false);
    expect(result.current.modsA).toEqual({});
    expect(result.current.modsB).toEqual({});
    expect(result.current.maxWins).toBe(1);
    expect(result.current.maxKills).toBe(1);
    expect(result.current.maxFame).toBe(1);
    expect(result.current.maxRoster).toBe(1);
    expect(result.current.maxAttr).toBe(25);
  });

  it('selects rival A and populates statsA', () => {
    const rival1 = createMockRival('r1', {
      roster: [createMockWarrior('w1', { career: { wins: 5, losses: 3, kills: 1 } })],
    });
    const rival2 = createMockRival('r2');
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
    });

    expect(result.current.idA).toBe('r1');
    expect(result.current.rivalA).toBe(rival1);
    expect(result.current.statsA).not.toBeNull();
    expect(result.current.statsA!.totalWins).toBe(5);
    expect(result.current.statsA!.rosterSize).toBe(1);
  });

  it('selects rival B and populates statsB', () => {
    const rival1 = createMockRival('r1');
    const rival2 = createMockRival('r2', {
      roster: [
        createMockWarrior('w2', { career: { wins: 8, losses: 2, kills: 3 } }),
        createMockWarrior('w3', { career: { wins: 4, losses: 1, kills: 0 } }),
      ],
    });
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdB('r2');
    });

    expect(result.current.idB).toBe('r2');
    expect(result.current.rivalB).toBe(rival2);
    expect(result.current.statsB).not.toBeNull();
    expect(result.current.statsB!.totalWins).toBe(12);
    expect(result.current.statsB!.rosterSize).toBe(2);
  });

  it('updates max values when both rivals are selected', () => {
    const rival1 = createMockRival('r1', {
      roster: [createMockWarrior('w1', { career: { wins: 5, losses: 0, kills: 1 }, fame: 50 })],
    });
    const rival2 = createMockRival('r2', {
      roster: [createMockWarrior('w2', { career: { wins: 10, losses: 0, kills: 3 }, fame: 100 })],
    });
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.maxWins).toBe(10);
    expect(result.current.maxKills).toBe(3);
    expect(result.current.maxFame).toBe(100);
    expect(result.current.maxRoster).toBe(1);
  });

  it('detects grudge in forward order', () => {
    const rival1 = createMockRival('r1');
    const rival2 = createMockRival('r2');
    storeOverride = {
      ownerGrudges: [createMockGrudge('r1', 'r2', { intensity: 3, reason: 'Blood feud' })],
    };

    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.grudge).not.toBeNull();
    expect(result.current.grudge!.intensity).toBe(3);
    expect(result.current.grudge!.reason).toBe('Blood feud');
  });

  it('detects grudge in reversed order', () => {
    const rival1 = createMockRival('r1');
    const rival2 = createMockRival('r2');
    storeOverride = {
      ownerGrudges: [createMockGrudge('r2', 'r1', { intensity: 2 })],
    };

    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.grudge).not.toBeNull();
    expect(result.current.grudge!.intensity).toBe(2);
  });

  it('detects personality clash', () => {
    const rival1 = createMockRival('r1', {
      owner: {
        id: 'r1' as StableId,
        name: 'O1',
        stableName: 'S1',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: 'Aggressive',
      },
    });
    const rival2 = createMockRival('r2', {
      owner: {
        id: 'r2' as StableId,
        name: 'O2',
        stableName: 'S2',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: 'Methodical',
      },
    });
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.clashes).toBe(true);
  });

  it('maps philosophy modifiers', () => {
    const rival1 = createMockRival('r1', { philosophy: 'Brute Force' });
    const rival2 = createMockRival('r2', { philosophy: 'Iron Defense' });
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.modsA).toEqual({ OE: 2, AL: -1, killDesire: 2 });
    expect(result.current.modsB).toEqual({ OE: -2, AL: -1, killDesire: -2 });
  });

  it('handles empty rivals array', () => {
    const { result } = renderHook(() => useStableComparison([]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.rivalA).toBeUndefined();
    expect(result.current.rivalB).toBeUndefined();
    expect(result.current.statsA).toBeNull();
    expect(result.current.statsB).toBeNull();
    expect(result.current.maxWins).toBe(1);
    expect(result.current.maxKills).toBe(1);
    expect(result.current.maxFame).toBe(1);
    expect(result.current.maxRoster).toBe(1);
  });

  it('handles non-existent rival ID', () => {
    const rival1 = createMockRival('r1');
    const { result } = renderHook(() => useStableComparison([rival1]));

    act(() => {
      result.current.setIdA('fake-id');
    });

    expect(result.current.rivalA).toBeUndefined();
    expect(result.current.statsA).toBeNull();
  });

  it('returns null grudge when no grudges exist', () => {
    const rival1 = createMockRival('r1');
    const rival2 = createMockRival('r2');
    storeOverride = { ownerGrudges: [] };

    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.grudge).toBeNull();
  });

  it('returns null grudge when grudge exists for different pair', () => {
    const rival1 = createMockRival('r1');
    const rival2 = createMockRival('r2');
    const rival3 = createMockRival('r3');
    storeOverride = {
      ownerGrudges: [createMockGrudge('r2', 'r3')],
    };

    const { result } = renderHook(() => useStableComparison([rival1, rival2, rival3]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.grudge).toBeNull();
  });

  it('returns false for compatible personalities', () => {
    const rival1 = createMockRival('r1', {
      owner: {
        id: 'r1' as StableId,
        name: 'O1',
        stableName: 'S1',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: 'Pragmatic',
      },
    });
    const rival2 = createMockRival('r2', {
      owner: {
        id: 'r2' as StableId,
        name: 'O2',
        stableName: 'S2',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: 'Aggressive',
      },
    });
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.clashes).toBe(false);
  });

  it('returns false when one rival has no personality', () => {
    const rival1 = createMockRival('r1', {
      owner: {
        id: 'r1' as StableId,
        name: 'O1',
        stableName: 'S1',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: undefined,
      },
    });
    const rival2 = createMockRival('r2', {
      owner: {
        id: 'r2' as StableId,
        name: 'O2',
        stableName: 'S2',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: 'Aggressive',
      },
    });
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.clashes).toBe(false);
  });

  it('returns false when both rivals have no personality', () => {
    const rival1 = createMockRival('r1', {
      owner: {
        id: 'r1' as StableId,
        name: 'O1',
        stableName: 'S1',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: undefined,
      },
    });
    const rival2 = createMockRival('r2', {
      owner: {
        id: 'r2' as StableId,
        name: 'O2',
        stableName: 'S2',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: undefined,
      },
    });
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.clashes).toBe(false);
  });

  it('returns empty mods when philosophy is missing', () => {
    const rival1 = createMockRival('r1', { philosophy: undefined });
    const rival2 = createMockRival('r2');
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.modsA).toEqual({});
  });

  it('returns empty mods for unknown philosophy', () => {
    const rival1 = createMockRival('r1', { philosophy: 'Nonexistent' });
    const rival2 = createMockRival('r2');
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.modsA).toEqual({});
  });

  it('computes max values correctly when only one rival is selected', () => {
    const rival1 = createMockRival('r1', {
      roster: [createMockWarrior('w1', { career: { wins: 7, losses: 0, kills: 2 }, fame: 30 })],
    });
    const { result } = renderHook(() => useStableComparison([rival1]));

    act(() => {
      result.current.setIdA('r1');
    });

    expect(result.current.maxWins).toBe(7);
    expect(result.current.maxKills).toBe(2);
    expect(result.current.maxFame).toBe(30);
    expect(result.current.maxRoster).toBe(1);
    expect(result.current.grudge).toBeNull();
    expect(result.current.clashes).toBe(false);
    expect(result.current.modsB).toEqual({});
  });

  it('defaults max values to 1 when both rivals have zero stats', () => {
    const rival1 = createMockRival('r1', { roster: [] });
    const rival2 = createMockRival('r2', { roster: [] });
    const { result } = renderHook(() => useStableComparison([rival1, rival2]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r2');
    });

    expect(result.current.maxWins).toBe(1);
    expect(result.current.maxKills).toBe(1);
    expect(result.current.maxFame).toBe(1);
    expect(result.current.maxRoster).toBe(1);
  });

  it('handles same rival selected for both A and B', () => {
    const rival1 = createMockRival('r1', {
      roster: [createMockWarrior('w1', { career: { wins: 3, losses: 1, kills: 0 }, fame: 20 })],
      owner: {
        id: 'r1' as StableId,
        name: 'O1',
        stableName: 'S1',
        fame: 0,
        renown: 0,
        titles: 0,
        personality: 'Aggressive',
      },
    });
    const { result } = renderHook(() => useStableComparison([rival1]));

    act(() => {
      result.current.setIdA('r1');
      result.current.setIdB('r1');
    });

    expect(result.current.rivalA).toBe(rival1);
    expect(result.current.rivalB).toBe(rival1);
    expect(result.current.statsA).toEqual(result.current.statsB);
    expect(result.current.grudge).toBeNull();
    expect(result.current.clashes).toBe(false);
    expect(result.current.maxWins).toBe(3);
    expect(result.current.maxKills).toBe(1);
    expect(result.current.maxFame).toBe(20);
    expect(result.current.maxRoster).toBe(1);
  });
});
