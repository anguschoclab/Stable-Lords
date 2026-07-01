import { describe, it, expect } from 'vitest';
import { computeWeeklyBreakdown } from '@/engine/economy';
import type { GameState } from '@/types/state.types';

// Minimal GameState builder
function makeState(over: Partial<GameState> = {}): GameState {
  return {
    week: 5,
    fame: 0,
    weather: 'Clear',
    roster: [{ id: 'p1', name: 'Hero', fame: 30 } as any],
    trainers: [],
    trainingAssignments: [],
    arenaHistory: [],
    ...over,
  } as unknown as GameState;
}

describe('computeWeeklyBreakdown income scaling', () => {
  it('pays more for a famous warrior in a high-tier arena than the flat base', () => {
    const state = makeState({
      arenaHistory: [
        {
          id: 'f1',
          week: 5,
          warriorIdA: 'p1',
          warriorIdD: 'enemy',
          winner: 'A',
          fameA: 30,
          arenaId: 'clifftop_arena', // tier 3 arena
        } as any,
      ],
    });
    const b = computeWeeklyBreakdown(state);
    const purseLine = b.income.find((i) => i.label.startsWith('Fight purses'));
    expect(purseLine).toBeDefined();
    // Flat would have been 90; scaled (fame 30, tier 3) must exceed it.
    expect(purseLine!.amount).toBeGreaterThan(90);
  });

  it('pays exactly the base for a fame-0 warrior in a tier-1 arena (no regression for rookies)', () => {
    const state = makeState({
      fame: 0,
      roster: [{ id: 'p1', name: 'Rookie', fame: 0 } as any],
      arenaHistory: [
        {
          id: 'f1',
          week: 5,
          warriorIdA: 'p1',
          warriorIdD: 'enemy',
          winner: 'A',
          fameA: 0,
          arenaId: 'standard_arena', // tier 1 arena
        } as any,
      ],
    });
    const b = computeWeeklyBreakdown(state);
    const purseLine = b.income.find((i) => i.label.startsWith('Fight purses'));
    const winLine = b.income.find((i) => i.label.startsWith('Win bonuses'));
    expect(purseLine!.amount).toBe(90);
    expect(winLine!.amount).toBe(35);
  });
});
