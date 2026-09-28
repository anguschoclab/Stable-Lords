/**
 * useShallow memoization — verifies hooks return referentially stable results
 * and components don't create new objects inside useShallow.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { makeWarrior } from '@/test/_fixtures/factories';
import { renderHook } from '@testing-library/react';
import { useActiveRoster } from '@/hooks/useActiveRoster';
import { useAtRiskWarriors } from '@/hooks/useAtRiskWarriors';
import type { Warrior } from '@/types/game';
import type { WarriorId } from '@/types/shared.types';
import '@/test/_setup/setup';

const defaultStoreState = {
  roster: [] as Warrior[],
  ownerGrudges: [],
};

const mockStore = vi.hoisted(() => ({}) as any);

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (state: any) => any) => {
    return selector ? selector(mockStore) : mockStore;
  },
}));

function createMockWarrior(id: string, overrides?: Partial<Warrior>): Warrior {
  return makeWarrior({ id: id as WarriorId, name: `Warrior ${id}`, potential: undefined, fatigue: 0, ...overrides });
}

describe('useShallow memoization', () => {
  describe('useActiveRoster', () => {
    it('returns referentially stable result when roster is unchanged', () => {
      const roster = [
        createMockWarrior('w1', { fame: 100 }),
        createMockWarrior('w2', { fame: 50 }),
      ];
      Object.assign(mockStore, defaultStoreState, { roster });

      const { result, rerender } = renderHook(() => useActiveRoster());
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });
  });

  describe('useAtRiskWarriors', () => {
    it('returns referentially stable result when roster is unchanged', () => {
      const roster = [createMockWarrior('w1', { fatigue: 80, injuries: [] })];
      Object.assign(mockStore, defaultStoreState, { roster });

      const { result, rerender } = renderHook(() => useAtRiskWarriors());
      const first = result.current;
      rerender();
      expect(result.current).toBe(first);
    });
  });
});
