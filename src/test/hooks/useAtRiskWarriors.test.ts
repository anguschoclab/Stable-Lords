// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAtRiskWarriors } from '@/hooks/useAtRiskWarriors';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import '@/test/_setup/setup';

const mockStore = vi.hoisted(() => ({ roster: [] as Warrior[] }));

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (state: any) => any) =>
    selector ? selector(mockStore) : mockStore,
}));


function createMockWarrior(id: string, overrides?: Partial<Warrior>): Warrior {
  return {
    id: id as Warrior['id'],
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
    traits: [],
    fatigue: 0,
    ...overrides,
  } as Warrior;
}

describe('useAtRiskWarriors', () => {
  beforeEach(() => {
    mockStore.roster = [];
  });

  it('returns empty array when roster is empty', () => {
    mockStore.roster = [];
    const { result } = renderHook(() => useAtRiskWarriors());
    expect(result.current).toEqual([]);
  });

  it('returns warriors with fatigue > 60', () => {
    mockStore.roster = [
      createMockWarrior('w1', { fatigue: 75, injuries: [] }),
      createMockWarrior('w2', { fatigue: 60, injuries: [] }),
    ];
    const { result } = renderHook(() => useAtRiskWarriors());
    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.id).toBe('w1');
    expect(result.current[0]!.fatigue).toBe(75);
  });

  it('returns warriors with injuries', () => {
    mockStore.roster = [
      createMockWarrior('w1', { fatigue: 10, injuries: [{ name: 'Broken Arm' } as any] }),
      createMockWarrior('w2', { fatigue: 10, injuries: [] }),
    ];
    const { result } = renderHook(() => useAtRiskWarriors());
    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.id).toBe('w1');
  });

  it('does not return active warriors with fatigue <= 60 and no injuries', () => {
    mockStore.roster = [
      createMockWarrior('w1', { fatigue: 60, injuries: [] }),
      createMockWarrior('w2', { fatigue: 30, injuries: [] }),
    ];
    const { result } = renderHook(() => useAtRiskWarriors());
    expect(result.current).toEqual([]);
  });

  it('does not return inactive warriors even if fatigued or injured', () => {
    mockStore.roster = [
      createMockWarrior('w1', { status: 'Dead', fatigue: 80, injuries: [{ name: 'Wound' } as any] }),
      createMockWarrior('w2', { status: 'Retired', fatigue: 80, injuries: [] }),
      createMockWarrior('w3', { status: 'Active', fatigue: 80, injuries: [] }),
    ];
    const { result } = renderHook(() => useAtRiskWarriors());
    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.id).toBe('w3');
  });

  it('sorts by fatigue descending', () => {
    mockStore.roster = [
      createMockWarrior('w1', { fatigue: 61, injuries: [] }),
      createMockWarrior('w2', { fatigue: 90, injuries: [] }),
      createMockWarrior('w3', { fatigue: 75, injuries: [] }),
    ];
    const { result } = renderHook(() => useAtRiskWarriors());
    expect(result.current.map((w) => w.id)).toEqual(['w2', 'w3', 'w1']);
  });

  it('returns empty array when all warriors are healthy active', () => {
    mockStore.roster = [
      createMockWarrior('w1', { fatigue: 0, injuries: [] }),
      createMockWarrior('w2', { fatigue: 30, injuries: [] }),
      createMockWarrior('w3', { fatigue: 60, injuries: [] }),
    ];
    const { result } = renderHook(() => useAtRiskWarriors());
    expect(result.current).toEqual([]);
  });

  it('handles mixed roster with all edge cases', () => {
    mockStore.roster = [
      createMockWarrior('healthy1', { fatigue: 20, injuries: [] }),
      createMockWarrior('exhausted', { fatigue: 80, injuries: [] }),
      createMockWarrior('injured', { fatigue: 20, injuries: [{ name: 'Cut' } as any] }),
      createMockWarrior('dead', { status: 'Dead', fatigue: 80, injuries: [] }),
      createMockWarrior('retired', { status: 'Retired', fatigue: 20, injuries: [{ name: 'Scar' } as any] }),
    ];
    const { result } = renderHook(() => useAtRiskWarriors());
    expect(result.current).toHaveLength(2);
    expect(result.current.map((w) => w.id)).toEqual(['exhausted', 'injured']);
  });

  it('returns referentially stable result when roster is unchanged', () => {
    mockStore.roster = [createMockWarrior('w1', { fatigue: 80, injuries: [] })];
    const { result, rerender } = renderHook(() => useAtRiskWarriors());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
