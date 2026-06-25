// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActiveRoster } from '@/hooks/useActiveRoster';
import type { Warrior } from '@/types/game';
import { FightingStyle } from '@/types/game';
import '@/test/_setup/setup';

let storeOverride: any = {};

const defaultStoreState = {
  roster: [] as Warrior[],
};

vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useGameStore: (selector?: (state: any) => any) => {
    const state = { ...defaultStoreState, ...storeOverride };
    return selector ? selector(state) : state;
    },
});

function createMockWarrior(id: string, overrides?: Partial<Warrior>): Warrior {
  return {
    id,
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
    potential: undefined,
    traits: [],
    ...overrides,
  } as Warrior;
}

describe('useActiveRoster', () => {
  it('returns an empty array when roster is empty', () => {
    storeOverride = { roster: [] };
    const { result } = renderHook(() => useActiveRoster());
    expect(result.current).toEqual([]);
  });

  it('filters out Dead and Retired warriors', () => {
    storeOverride = {
      roster: [
        createMockWarrior('w1', { status: 'Active', fame: 100 }),
        createMockWarrior('w2', { status: 'Dead', fame: 200 }),
        createMockWarrior('w3', { status: 'Retired', fame: 300 }),
      ],
    };
    const { result } = renderHook(() => useActiveRoster());
    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.id).toBe('w1');
  });

  it('sorts by fame descending', () => {
    storeOverride = {
      roster: [
        createMockWarrior('w1', { fame: 50 }),
        createMockWarrior('w2', { fame: 200 }),
        createMockWarrior('w3', { fame: 100 }),
      ],
    };
    const { result } = renderHook(() => useActiveRoster());
    expect(result.current.map((w) => w.id)).toEqual(['w2', 'w3', 'w1']);
  });

  it('returns correct field subset', () => {
    storeOverride = {
      roster: [
        createMockWarrior('w1', {
          name: 'Test',
          fame: 42,
          style: FightingStyle.BashingAttack,
          champion: true,
          career: { wins: 5, losses: 2, kills: 1 },
        }),
      ],
    };
    const { result } = renderHook(() => useActiveRoster());
    const item = result.current[0]!;
    expect(item.id).toBe('w1');
    expect(item.name).toBe('Test');
    expect(item.fame).toBe(42);
    expect(item.style).toBe(FightingStyle.BashingAttack);
    expect(item.champion).toBe(true);
    expect(item.career).toEqual({ wins: 5, losses: 2, kills: 1 });
    expect(item.attributes).toEqual({ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 });
  });

  it('returns referentially stable result across re-renders with same roster', () => {
    storeOverride = {
      roster: [createMockWarrior('w1', { fame: 100 }), createMockWarrior('w2', { fame: 50 })],
    };
    const { result, rerender } = renderHook(() => useActiveRoster());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
