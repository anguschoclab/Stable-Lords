import { vi } from 'vitest';
import type { Warrior } from '@/types/state.types';

/**
 * Shared stub for @/engine/simulate — every tournament bout resolves 'A' by
 * Stoppage and every plan defaults to killDesire 5. Specs override per-test
 * via vi.mocked(simulateFight) mockReturnValue/mockClear calls.
 */
export const simulateFight = vi.fn(() => ({
  winner: 'A',
  by: 'Stoppage',
  minutes: 1,
  log: [],
  exchangeLog: [],
  post: { tags: [] },
}));

export const defaultPlanForWarrior = vi.fn((w: Warrior) => ({
  killDesire: 5,
  weapon: 'Broadsword',
  planStyle: w.style,
}));
