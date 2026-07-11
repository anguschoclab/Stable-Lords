import { describe, it, expect } from 'vitest';
import { processAIStable } from '@/engine/ai/stableManager';
import { getFightsForWeek } from '@/engine/core/historyUtils';
import { computeWeeklyBreakdown } from '@/engine/economy';
import type { RivalStableData, FightSummary } from '@/types/state.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { FIGHT_PURSE, WIN_BONUS } from '@/constants/economy';

function makeRival(over: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1' as any,
    owner: {
      id: 'rival-1' as any,
      name: 'Test Owner',
      stableName: 'Test Stable',
      fame: 0,
      renown: 0,
      titles: 0,
    },
    fame: 0,
    roster: [],
    treasury: 1000,
    ledger: [],
    trainingAssignments: [],
    ...over,
  };
}

function makeFight(
  week: number,
  rivalId: string,
  opts: {
    winner?: 'A' | 'D';
    fameA?: number;
    fameD?: number;
    arenaId?: string;
    side?: 'A' | 'D';
  } = {}
): FightSummary {
  const side = opts.side ?? 'A';
  return {
    id: 'fight-1' as any,
    week,
    title: 'A vs B',
    warriorIdA: 'warA' as any,
    warriorIdD: 'warB' as any,
    stableIdA: side === 'A' ? rivalId : 'other-stable',
    stableIdD: side === 'D' ? rivalId : 'other-stable',
    winner: opts.winner ?? 'A',
    by: 'KO',
    styleA: 'STRIKING_ATTACK',
    styleD: 'BASHING_ATTACK',
    fameA: opts.fameA ?? 0,
    fameD: opts.fameD ?? 0,
    arenaId: opts.arenaId ?? 'standard_arena',
    createdAt: new Date().toISOString(),
  } as FightSummary;
}

describe('AI Economy Parity', () => {
  it('AI base income matches player base income for fame-0 tier-1 fight', () => {
    const state = createFreshState('test');
    state.week = 5;
    const rival = makeRival({
      roster: [
        {
          id: 'warA' as any,
          name: 'Warrior',
          style: 'StrikingAttack',
          fame: 0,
          status: 'Active',
          attributes: { WT: 15, WL: 15, STR: 10, AGI: 10, END: 10, SPD: 10, DF: 10 },
        } as any,
      ],
    });
    state.arenaHistory = [makeFight(5, 'rival-1', { winner: 'A' })];

    const result = processAIStable(rival, state);

    // Player path: fame=0, tier-1 → FIGHT_PURSE + WIN_BONUS - WARRIOR_UPKEEP_BASE
    const expectedDelta = FIGHT_PURSE + WIN_BONUS - 45;
    expect(result.updatedRival.treasury).toBe(1000 + expectedDelta);
  });

  it('AI scaled income exceeds base for fame-30 tier-3 fight', () => {
    const state = createFreshState('test');
    state.week = 5;
    const rival = makeRival({
      roster: [
        {
          id: 'warA' as any,
          name: 'Warrior',
          style: 'StrikingAttack',
          fame: 30,
          status: 'Active',
          attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
          career: { wins: 0, losses: 0, kills: 0 },
        } as any,
      ],
    });
    state.arenaHistory = [
      makeFight(5, 'rival-1', {
        winner: 'A',
        fameA: 30,
        arenaId: 'clifftop_arena',
      }),
    ];

    const result = processAIStable(rival, state);

    // Scaled purse for fame 30, tier 3 must exceed flat 90
    expect(result.updatedRival.treasury).toBeGreaterThan(1000 + 90 + 35);
  });

  it('AI upkeep formula matches player (*15 fame premium)', () => {
    const state = createFreshState('test');
    state.week = 5;
    const rival = makeRival({
      roster: [
        {
          id: 'w1' as any,
          name: 'Warrior',
          style: 'StrikingAttack',
          fame: 30,
          status: 'Active',
          attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
          career: { wins: 0, losses: 0, kills: 0 },
        } as any,
      ],
    });

    const result = processAIStable(rival, state);

    // Upkeep = 45 base + Math.floor(30/10)*15 = 45 + 45 = 90
    // No fights → idle stipend +25. Net = 25 - 90 = -65
    expect(result.updatedRival.treasury).toBe(1000 - 65);
  });

  it('AI gets Mana Surge income', () => {
    const state = createFreshState('test');
    state.week = 5;
    state.weather = 'Mana Surge';
    const rival = makeRival();

    const result = processAIStable(rival, state);

    // No fights, but Mana Surge gives +250. No roster → no stipend.
    expect(result.updatedRival.treasury).toBe(1000 + 250);
  });

  it('AI gets weather expenses (Sweltering)', () => {
    const state = createFreshState('test');
    state.week = 5;
    state.weather = 'Sweltering';
    const rival = makeRival({
      roster: [
        {
          id: 'w1' as any,
          name: 'Warrior',
          style: 'StrikingAttack',
          fame: 0,
          status: 'Active',
          attributes: { WT: 15, WL: 15, STR: 10, AGI: 10, END: 10, SPD: 10, DF: 10 },
        } as any,
      ],
    });

    const result = processAIStable(rival, state);

    // Upkeep 45 + weather 5 = 50. No fights → stipend +25. Net = 25 - 50 = -25
    expect(result.updatedRival.treasury).toBe(1000 - 25);
  });

  it('AI gets weather expenses (Blizzard)', () => {
    const state = createFreshState('test');
    state.week = 5;
    state.weather = 'Blizzard';
    const rival = makeRival({
      roster: [
        {
          id: 'w1' as any,
          name: 'Warrior',
          style: 'StrikingAttack',
          fame: 0,
          status: 'Active',
          attributes: { WT: 15, WL: 15, STR: 10, AGI: 10, END: 10, SPD: 10, DF: 10 },
        } as any,
      ],
    });

    const result = processAIStable(rival, state);

    // Upkeep 45 + weather 10 = 55. No fights → stipend +25. Net = 25 - 55 = -30
    expect(result.updatedRival.treasury).toBe(1000 - 30);
  });

  it('AI gets Noble Patronage for famous warriors', () => {
    const state = createFreshState('test');
    state.week = 5;
    const rival = makeRival({
      roster: [
        {
          id: 'w1' as any,
          name: 'Warrior',
          style: 'StrikingAttack',
          fame: 50,
          status: 'Active',
          attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
          career: { wins: 0, losses: 0, kills: 0 },
        } as any,
      ],
    });

    const result = processAIStable(rival, state);

    // Patronage = Math.floor((50-40)/10)*25 = 25
    // Upkeep = 45 + Math.floor(50/10)*15 = 45 + 75 = 120
    // No fights → stipend +25. Net = 25 + 25 - 120 = -70
    expect(result.updatedRival.treasury).toBe(1000 - 70);
  });

  it('AI only pays trainers with active contracts', () => {
    const state = createFreshState('test');
    state.week = 5;
    const rival = makeRival({
      trainers: [
        {
          id: 't1',
          name: 'Trainer A',
          tier: 'Novice',
          focus: 'Aggression',
          fame: 1,
          age: 40,
          contractWeeksLeft: 0,
        },
        {
          id: 't2',
          name: 'Trainer B',
          tier: 'Master',
          focus: 'Defense',
          fame: 5,
          age: 50,
          contractWeeksLeft: 5,
        },
      ],
    });

    const result = processAIStable(rival, state);

    // Only Trainer B paid: Master salary = 75
    // No roster → no upkeep, no stipend
    expect(result.updatedRival.treasury).toBe(1000 - 75);
  });

  it('AI generates ledger entries after economy tick', () => {
    const state = createFreshState('test');
    state.week = 5;
    const rival = makeRival({
      roster: [
        {
          id: 'warA' as any,
          name: 'Warrior',
          style: 'StrikingAttack',
          fame: 0,
          status: 'Active',
          attributes: { WT: 15, WL: 15, STR: 10, AGI: 10, END: 10, SPD: 10, DF: 10 },
        } as any,
      ],
    });
    state.arenaHistory = [makeFight(5, 'rival-1', { winner: 'A' })];

    const result = processAIStable(rival, state);

    expect(result.updatedRival.ledger.length).toBeGreaterThan(0);
    const incomeEntry = result.updatedRival.ledger.find((e) => e.amount > 0);
    expect(incomeEntry).toBeDefined();
  });

  it('AI training cost uses TRAINING_COST (20g) not old 35g', () => {
    const state = createFreshState('test');
    state.week = 5;
    const rival = makeRival({
      roster: [
        {
          id: 'w1' as any,
          name: 'Warrior',
          style: 'StrikingAttack',
          fame: 0,
          status: 'Active',
          attributes: { WT: 15, WL: 15, STR: 10, AGI: 10, END: 10, SPD: 10, DF: 10 },
        } as any,
      ],
      trainingAssignments: [{ warriorId: 'w1' as any, type: 'attribute', attribute: 'ST' }],
    });

    const result = processAIStable(rival, state);

    // Upkeep 45 + training 20 = 65. No fights → stipend +25. Net = 25 - 65 = -40
    expect(result.updatedRival.treasury).toBe(1000 - 40);
  });

  it('AI and player produce identical breakdowns for the same input', () => {
    const state = createFreshState('test');
    state.week = 5;
    state.weather = 'Clear';
    state.roster = [
      {
        id: 'w1' as any,
        name: 'Warrior',
        style: 'StrikingAttack',
        fame: 0,
        status: 'Active',
      } as any,
    ];
    state.trainers = [];
    state.trainingAssignments = [];
    state.arenaHistory = [
      {
        id: 'f1' as any,
        week: 5,
        warriorIdA: 'w1' as any,
        warriorIdD: 'e1' as any,
        winner: 'A',
        fameA: 0,
        arenaId: 'standard_arena',
      } as any,
    ];

    const playerBreakdown = computeWeeklyBreakdown(state);

    const rival = makeRival({
      roster: state.roster,
      fame: state.fame,
      trainers: state.trainers,
      trainingAssignments: state.trainingAssignments,
    });

    const aiInput = {
      week: state.week,
      roster: rival.roster,
      fame: rival.fame,
      weather: state.weather,
      arenaHistory: getFightsForWeek(state.arenaHistory, state.week),
      trainers: rival.trainers ?? [],
      trainingAssignments: rival.trainingAssignments,
    };

    const aiBreakdown = computeWeeklyBreakdown(aiInput);

    expect(aiBreakdown.totalIncome).toBe(playerBreakdown.totalIncome);
    expect(aiBreakdown.totalExpenses).toBe(playerBreakdown.totalExpenses);
    expect(aiBreakdown.net).toBe(playerBreakdown.net);
  });
});
