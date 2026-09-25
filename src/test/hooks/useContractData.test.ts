// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useContractData } from '@/components/ledger/ContractManager/hooks/useContractData';
import type { Trainer } from '@/types/game';
import '@/test/_setup/setup';

import { useGameStore } from '@/state/useGameStore';

// Inject fake state into the real store — vi.mock's importOriginal arg does
// not exist under bun:test. Call instead of assigning a store override.
const applyStore = (override: Record<string, unknown> = {}) =>
  useGameStore.setState({ trainers: [], ...override } as never);

function mkTrainer(id: string, overrides?: Partial<Trainer>): Trainer {
  return {
    id,
    name: `Trainer ${id}`,
    tier: 'Journeyman',
    contractWeeksLeft: 10,
    ...overrides,
  } as Trainer;
}

describe('useContractData (V7 characterization — PR #986 extraction)', () => {
  it('returns empty aggregates for no trainers', () => {
    applyStore({ trainers: [] });
    const { result } = renderHook(() => useContractData());
    expect(result.current.activeTrainers).toEqual([]);
    expect(result.current.totalWeeklyExpense).toBe(0);
    expect(result.current.expiringSoonCount).toBe(0);
  });

  it('filters expired contracts and sums salary + expiry counts', () => {
    applyStore({
      trainers: [
        mkTrainer('t1', { contractWeeksLeft: 10 }),
        mkTrainer('t2', { contractWeeksLeft: 0 }),
        mkTrainer('t3', { contractWeeksLeft: 2 }),
      ],
    });
    const { result } = renderHook(() => useContractData());
    expect(result.current.activeTrainers.map((t) => t.id)).toEqual(['t1', 't3']);
    expect(result.current.expiringSoonCount).toBe(1);
    expect(result.current.totalWeeklyExpense).toBeGreaterThan(0);
  });

  it('memoizes the result object across unrelated re-renders', () => {
    applyStore({ trainers: [mkTrainer('t1')] });
    const { result, rerender } = renderHook(() => useContractData());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
