import { describe, it, expect, vi } from 'vitest';
import { makeGameState as fixtureGameState } from '@/test/_fixtures/factories';

vi.mock('@/engine/bout/services/boutProcessorService', () => {
  const mockBoutResult = {
    a: { id: 'w1', name: 'Alice', style: 'Striking Attack', fame: 100 },
    d: { id: 'w2', name: 'Bob', style: 'Total Parry', fame: 50 },
    outcome: { winner: 'A', by: 'KO', minutes: 3, log: [{ text: 'Alice wins!' }] },
    isRivalry: false,
    contractId: 'test-contract',
  };
  return {
    processWeekBouts: vi.fn(() => ({
      impact: {},
      results: [mockBoutResult],
      summary: {
        bouts: 1,
        deaths: 0,
        injuries: 0,
        deathNames: [],
        injuryNames: [],
        hadPlayerDeath: false,
        hadRivalryEscalation: false,
      },
    })),
  };
});

import '@/test/_setup/setup';
import { runBoutSimulationPass } from '@/engine/pipeline/passes/BoutSimulationPass';
import { SeededRNGService } from '@/utils/random';
import type { GameState } from '@/types/state.types';

const makeState = (week: number, year: number): GameState =>
  fixtureGameState({
    fame: 50,
    week,
    year,
    absoluteWeek: (year - 1) * 52 + week,
    rivals: [],
    recruitPool: [],
    lastSimulationReport: undefined,
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
  } as any);

describe('NF7: BoutSimulationPass hardcoded 2024 timestamp', () => {
  const rng = new SeededRNGService(42);

  it('createdAt for game year 2, week 1 should be Jan 1, 2025 (not Jan 7)', () => {
    const state = makeState(1, 2);
    const { impact } = runBoutSimulationPass(state, rng, true);

    const report = impact.lastSimulationReport as any;
    expect(report).toBeDefined();
    expect(report.bouts).toHaveLength(1);

    const createdAt = report.bouts[0].createdAt as string;
    const date = new Date(createdAt);

    expect(date.getUTCFullYear(), 'year should be 2025').toBe(2025);
    expect(date.getUTCMonth(), 'month should be January (0)').toBe(0);
    expect(date.getUTCDate(), 'day should be 1, not 7 (absoluteWeek drift bug)').toBe(1);
  });

  it('createdAt for game year 1, week 1 should be Jan 1, 2024', () => {
    const state = makeState(1, 1);
    const { impact } = runBoutSimulationPass(state, rng, true);

    const report = impact.lastSimulationReport as any;
    const createdAt = report.bouts[0].createdAt as string;
    const date = new Date(createdAt);

    // Game year 1, week 1 should be Jan 1, 2024
    expect(date.getUTCFullYear(), 'year should be 2024').toBe(2024);
    expect(date.getUTCMonth(), 'month should be January (0)').toBe(0);
    expect(date.getUTCDate(), 'day should be 1, not 8 (off-by-one week bug)').toBe(1);
  });
});
