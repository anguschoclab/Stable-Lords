import { vi } from 'vitest';

/** Shared stub for @/hooks/useTournamentSchedule — empty schedule, all-static controls. */
export const useTournamentSchedule = (): {
  filter: string;
  setFilter: ReturnType<typeof vi.fn>;
  expandedRounds: Set<unknown>;
  totalRounds: number;
  stats: { totalBouts: number; completedBouts: number; pendingBouts: number };
  filteredRounds: unknown[];
  toggleRound: ReturnType<typeof vi.fn>;
  expandAll: ReturnType<typeof vi.fn>;
  collapseAll: ReturnType<typeof vi.fn>;
} => ({
  filter: 'all',
  setFilter: vi.fn(),
  expandedRounds: new Set(),
  totalRounds: 1,
  stats: { totalBouts: 0, completedBouts: 0, pendingBouts: 0 },
  filteredRounds: [],
  toggleRound: vi.fn(),
  expandAll: vi.fn(),
  collapseAll: vi.fn(),
});
