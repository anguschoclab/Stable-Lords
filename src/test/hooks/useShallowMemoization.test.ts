/**
 * useShallow memoization — verifies hooks return referentially stable results
 * and components don't create new objects inside useShallow.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActiveRoster } from '@/hooks/useActiveRoster';
import { useAtRiskWarriors } from '@/hooks/useAtRiskWarriors';
import type { Warrior } from '@/types/game';
import { FightingStyle } from '@/types/game';
import '@/test/_setup/setup';

let storeOverride: any = {};

vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useGameStore: (selector?: (state: any) => any) => {
    const state = { ...defaultStoreState, ...storeOverride };
    return selector ? selector(state) : state;
    },
});

const defaultStoreState = {
  roster: [] as Warrior[],
  ownerGrudges: [],
};

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
    fatigue: 0,
    ...overrides,
  } as Warrior;
}

describe('useShallow memoization', () => {
  describe('useActiveRoster', () => {
    it('returns referentially stable result when roster is unchanged', () => {
      const roster = [
        createMockWarrior('w1', { fame: 100 }),
        createMockWarrior('w2', { fame: 50 }),
      ];
      storeOverride = { roster };

      const { result, rerender } = renderHook(() => useActiveRoster());
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });
  });

  describe('useAtRiskWarriors', () => {
    it('returns referentially stable result when roster is unchanged', () => {
      const roster = [createMockWarrior('w1', { fatigue: 80, injuries: [] })];
      storeOverride = { roster };

      const { result, rerender } = renderHook(() => useAtRiskWarriors());
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });
  });
});
