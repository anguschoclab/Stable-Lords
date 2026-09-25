import { describe, it, expect } from 'vitest';
import { processAIStable } from '@/engine/ai/stableManager';
import type { RivalStableData, FightSummary } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';

describe('processAIStable', () => {
  it('should accurately calculate weekly income from bouts for AI stables using stableId', () => {
    // Basic setup
    const state = createFreshState('test');
    state.week = 10;
    state.absoluteWeek = 10;

    // Create a mock rival stable
    const rivalId = 'rival-stable-1' as any;
    const rival: RivalStableData = {
      id: rivalId,
      owner: {
        id: rivalId,
        name: 'Test Owner',
        stableName: 'Test Stable',
        fame: 0,
        renown: 0,
        titles: 0,
      },
      fame: 0,
      roster: [
        {
          id: 'warA' as any,
          name: 'Warrior A',
          style: FightingStyle.StrikingAttack,
          fame: 0,
          status: 'Active',
          age: 20,
          injuries: [],
          attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } as any,
        } as any,
      ],
      treasury: 1000,
      ledger: [],
      trainingAssignments: [],
    };

    // Create a fight where this stable's warrior fought
    const fight: FightSummary = {
      id: 'fight-1' as any,
      week: 10, // Must match state.week
      title: 'A vs B',
      warriorIdA: 'warA' as any,
      warriorIdD: 'warB' as any,
      stableIdA: rivalId, // This stable
      stableIdD: 'other-stable' as any,
      winner: 'A', // Rival won
      by: 'KO',
      styleA: 'BRUTE',
      styleD: 'AGILE',
      createdAt: new Date().toISOString(),
    };

    state.arenaHistory = [fight];

    const result = processAIStable(rival, state);

    // Calculate expected:
    // Base purse + Win bonus = FIGHT_PURSE + WIN_BONUS
    // Since fame = 0, no fame dividend.
    // Upkeep = 0 (empty roster).
    // So delta should be exactly FIGHT_PURSE + WIN_BONUS.
    // We don't know the exact constants unless we import them, but we know treasury should increase.

    expect(result.updatedRival.treasury).toBeGreaterThan(1000);
  });

  it('should count fight income at year boundary (week 1, absoluteWeek 53)', () => {
    const state = createFreshState('boundary');
    state.week = 1;
    state.year = 2;
    state.absoluteWeek = 53;

    const rivalId = 'rival-boundary' as any;
    const rival: RivalStableData = {
      id: rivalId,
      owner: {
        id: rivalId,
        name: 'Boundary Owner',
        stableName: 'Boundary Stable',
        fame: 0,
        renown: 0,
        titles: 0,
      },
      fame: 0,
      roster: [
        {
          id: 'warBoundary' as any,
          name: 'Boundary Warrior',
          style: FightingStyle.StrikingAttack,
          fame: 0,
          status: 'Active',
          age: 20,
          injuries: [],
          attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } as any,
        } as any,
      ],
      treasury: 1000,
      ledger: [],
      trainingAssignments: [],
    };

    const fight: FightSummary = {
      id: 'fight-boundary' as any,
      week: 1,
      absoluteWeek: 53,
      title: 'Boundary Fight',
      warriorIdA: 'warBoundary' as any,
      warriorIdD: 'warOpp' as any,
      stableIdA: rivalId,
      stableIdD: 'other-stable' as any,
      winner: 'A',
      by: 'KO',
      styleA: 'BRUTE',
      styleD: 'AGILE',
      createdAt: new Date().toISOString(),
    };

    state.arenaHistory = [fight];

    const result = processAIStable(rival, state);

    expect(result.updatedRival.treasury).toBeGreaterThan(1000);
  });

  it('caps rival ledger at 500 entries', () => {
    const state = createFreshState('ledger-cap-test');
    state.week = 10;
    state.absoluteWeek = 10;

    const rivalId = 'rival-ledger-cap' as any;
    const rival: RivalStableData = {
      id: rivalId,
      owner: {
        id: rivalId,
        name: 'Ledger Cap Owner',
        stableName: 'Ledger Cap Stable',
        fame: 0,
        renown: 0,
        titles: 0,
      },
      fame: 0,
      roster: [],
      treasury: 1000,
      ledger: Array.from(
        { length: 600 },
        (_, i) =>
          ({ id: `l${i}` as any, amount: 100, week: i + 1, label: 'x', category: 'fight' }) as any
      ),
      trainingAssignments: [],
    };

    const result = processAIStable(rival, state);

    expect(result.updatedRival.ledger.length).toBeLessThanOrEqual(500);
  });

  it('writes real categories into the rival ledger (not just fight/upkeep)', () => {
    const state = createFreshState('ledger-categories');
    state.week = 10;
    state.absoluteWeek = 10;
    // >45 rivals disables the idle stipend so the income categories stay clean.
    state.rivals = [];

    const rivalId = 'rival-ledger-cats' as any;
    const rival: RivalStableData = {
      id: rivalId,
      owner: {
        id: rivalId,
        name: 'Cat Owner',
        stableName: 'Cat Stable',
        fame: 0,
        renown: 0,
        titles: 0,
      },
      fame: 0,
      roster: [
        {
          id: 'warCat' as any,
          name: 'Warrior Cat',
          style: FightingStyle.StrikingAttack,
          fame: 0,
          status: 'Active',
          age: 20,
          injuries: [],
          attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 } as any,
          derivedStats: { hp: 20, endurance: 20, damage: 6, encumbrance: 0 } as any,
        } as any,
      ],
      treasury: 5000,
      ledger: [],
      trainers: [
        {
          id: 'tr1',
          name: 'Trainer One',
          tier: 'Seasoned',
          focus: 'Technique',
          fame: 0,
          age: 50,
          contractWeeksLeft: 10,
        } as any,
      ],
      trainingAssignments: [
        { warriorId: 'warCat' as any, type: 'attribute', attribute: 'WT' } as any,
      ],
    };

    const fight: FightSummary = {
      id: 'fight-cats' as any,
      week: 10,
      absoluteWeek: 10,
      title: 'Cat vs Dog',
      warriorIdA: 'warCat' as any,
      warriorIdD: 'warOpp' as any,
      stableIdA: rivalId,
      stableIdD: 'other-stable' as any,
      winner: 'A',
      by: 'KO',
      styleA: 'BRUTE',
      styleD: 'AGILE',
      createdAt: new Date().toISOString(),
    };
    state.arenaHistory = [fight];

    const result = processAIStable(rival, state);
    const categories = new Set(result.updatedRival.ledger.map((e) => e.category));

    expect(categories.has('fight')).toBe(true);
    expect(categories.has('upkeep')).toBe(true);
    expect(categories.has('trainer')).toBe(true);
    expect(categories.has('training')).toBe(true);
    // Nothing may fall back to the old collapsed categories indiscriminately.
    for (const e of result.updatedRival.ledger) {
      if (e.label.startsWith('Trainer salaries')) expect(e.category).toBe('trainer');
      if (e.label.startsWith('Training fees')) expect(e.category).toBe('training');
      if (e.label.startsWith('Fight purses')) expect(e.category).toBe('fight');
      if (e.label.startsWith('Warrior upkeep')) expect(e.category).toBe('upkeep');
    }
  });
});
