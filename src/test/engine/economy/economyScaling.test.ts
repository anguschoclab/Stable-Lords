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

describe('computeWeeklyBreakdown — Full Integration', () => {
  it('should scale patronage linearly with fame above threshold', () => {
    const state = makeState({
      roster: [
        { id: 'w1', name: 'A', fame: 50 } as any,
        { id: 'w2', name: 'B', fame: 60 } as any,
        { id: 'w3', name: 'C', fame: 70 } as any,
      ],
    });
    const b = computeWeeklyBreakdown(state);
    const patronage = b.income.find((i) => i.label === 'Noble Patronage Contribution');
    expect(patronage).toBeDefined();
    // 25 + 50 + 75 = 150
    expect(patronage!.amount).toBe(150);
  });

  it('should combine all income sources in totalIncome', () => {
    const state = makeState({
      fame: 10,
      weather: 'Mana Surge',
      roster: [{ id: 'p1', name: 'Hero', fame: 50 } as any],
      arenaHistory: [
        {
          id: 'f1',
          week: 5,
          warriorIdA: 'p1',
          warriorIdD: 'enemy',
          winner: 'A',
          fameA: 50,
          arenaId: 'standard_arena',
        } as any,
      ],
    });
    const b = computeWeeklyBreakdown(state);
    // Verify each income line exists
    expect(b.income.some((i) => i.label === 'Fight purses (1)')).toBe(true);
    expect(b.income.some((i) => i.label === 'Win bonuses (1)')).toBe(true);
    expect(b.income.some((i) => i.label === 'Fame dividends')).toBe(true);
    expect(b.income.some((i) => i.label === 'Celestial Gift (Mana Surge)')).toBe(true);
    expect(b.income.some((i) => i.label === 'Noble Patronage Contribution')).toBe(true);
    // Verify totalIncome = sum of all income items
    const sum = b.income.reduce((s, i) => s + i.amount, 0);
    expect(b.totalIncome).toBe(sum);
  });

  it('should combine all expense sources in totalExpenses', () => {
    const state = makeState({
      weather: 'Blizzard',
      roster: [{ id: 'w1', name: 'A', fame: 0 } as any, { id: 'w2', name: 'B', fame: 20 } as any],
      trainers: [
        {
          id: 't1',
          name: 'T',
          tier: 'Novice',
          focus: 'Aggression',
          fame: 1,
          age: 40,
          contractWeeksLeft: 5,
        } as any,
      ],
      trainingAssignments: [{ warriorId: 'w1' as any, type: 'attribute', attribute: 'ST' }],
    });
    const b = computeWeeklyBreakdown(state);
    // Verify each expense line exists
    expect(b.expenses.some((e) => e.label.startsWith('Warrior upkeep'))).toBe(true);
    expect(b.expenses.some((e) => e.label === 'Insulation & Fuel Overhead')).toBe(true);
    expect(b.expenses.some((e) => e.label.startsWith('Trainer salaries'))).toBe(true);
    expect(b.expenses.some((e) => e.label.startsWith('Training fees'))).toBe(true);
    // upkeep: 45 + 75 = 120, blizzard: 2*10 = 20, trainer: 10, training: 20 → total 170
    expect(b.totalExpenses).toBe(170);
    expect(b.net).toBe(b.totalIncome - b.totalExpenses);
  });
});
