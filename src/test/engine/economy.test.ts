import { describe, it, expect } from "vitest";
import { computeWeeklyBreakdown, processEconomy } from "@/engine/economy";
import type { GameState, FightSummary, Warrior, TrainerData, TrainingAssignment } from "@/types/game";

// Minimal mock generator for GameState
function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    week: 1,
    fame: 0,
    gold: 100,
    roster: [],
    trainers: [],
    trainingAssignments: [],
    arenaHistory: [],
    ledger: [],
    // ... add required base props to satisfy type if needed, but we only strictly need the ones economy.ts accesses
    ...overrides,
  } as unknown as GameState; // Cast as GameState since economy.ts only accesses a subset of properties
}

function createMockWarrior(name: string): Warrior {
  return { name } as Warrior;
}

function createMockFight(a: string, d: string, winner: "A" | "D", week: number): FightSummary {
  return { a, d, winner, week } as FightSummary;
}

describe("computeWeeklyBreakdown", () => {
  it("calculates zero income and expenses for an empty state", () => {
    const state = createMockState();
    const result = computeWeeklyBreakdown(state);

    expect(result.income).toEqual([]);
    expect(result.expenses).toEqual([]);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.net).toBe(0);
  });

  it("calculates fame dividends correctly", () => {
    const state = createMockState({ fame: 10 });
    const result = computeWeeklyBreakdown(state);

    expect(result.totalIncome).toBe(20); // 10 fame * 2 FAME_MULTIPLIER
    expect(result.income).toContainEqual({ label: "Fame dividends", amount: 20 });
  });

  it("calculates warrior upkeep correctly", () => {
    const state = createMockState({
      roster: [createMockWarrior("W1"), createMockWarrior("W2")],
    });
    const result = computeWeeklyBreakdown(state);

    expect(result.totalExpenses).toBe(40); // 2 warriors * 20 WARRIOR_UPKEEP
    expect(result.expenses).toContainEqual({ label: "Warrior upkeep (2)", amount: 40 });
  });

  it("calculates trainer salaries correctly", () => {
    const state = createMockState({
      trainers: [{} as TrainerData, {} as TrainerData, {} as TrainerData],
    });
    const result = computeWeeklyBreakdown(state);

    expect(result.totalExpenses).toBe(105); // 3 trainers * 35 TRAINER_SALARY
    expect(result.expenses).toContainEqual({ label: "Trainer salaries (3)", amount: 105 });
  });

  it("calculates training costs correctly", () => {
    const state = createMockState({
      trainingAssignments: [{} as TrainingAssignment, {} as TrainingAssignment],
    });
    const result = computeWeeklyBreakdown(state);

    expect(result.totalExpenses).toBe(30); // 2 assignments * 15 TRAINING_COST
    expect(result.expenses).toContainEqual({ label: "Training fees (2)", amount: 30 });
  });

  it("calculates fight purses and win bonuses correctly for player warriors", () => {
    const state = createMockState({
      week: 5,
      roster: [createMockWarrior("Player1"), createMockWarrior("Player2")],
      arenaHistory: [
        // Player1 wins as Attacker
        createMockFight("Player1", "Enemy1", "A", 5),
        // Player2 loses as Defender
        createMockFight("Enemy2", "Player2", "A", 5),
        // Fight from a previous week (should be ignored)
        createMockFight("Player1", "Enemy3", "A", 4),
        // Fight with no player warriors
        createMockFight("Enemy4", "Enemy5", "D", 5),
      ],
    });

    const result = computeWeeklyBreakdown(state);

    // 2 fights this week = 2 * 50 = 100
    // 1 win this week = 1 * 30 = 30
    // Total income = 130

    expect(result.totalIncome).toBe(130);
    expect(result.income).toContainEqual({ label: "Fight purses (2)", amount: 100 });
    expect(result.income).toContainEqual({ label: "Win bonuses (1)", amount: 30 });
  });

  it("calculates correctly when two player warriors fight each other", () => {
      const state = createMockState({
        week: 1,
        roster: [createMockWarrior("P1"), createMockWarrior("P2")],
        arenaHistory: [
          createMockFight("P1", "P2", "A", 1), // P1 wins, P2 loses
        ],
      });

      const result = computeWeeklyBreakdown(state);

      // Both P1 and P2 fight = 2 fight count = 100g
      // P1 wins = 1 win count = 30g
      // Total = 130g

      expect(result.totalIncome).toBe(130);
      expect(result.income).toContainEqual({ label: "Fight purses (2)", amount: 100 });
      expect(result.income).toContainEqual({ label: "Win bonuses (1)", amount: 30 });
  });

  it("calculates combined net economy correctly", () => {
    const state = createMockState({
      week: 2,
      fame: 5, // Income: 10
      roster: [createMockWarrior("Hero")], // Expenses: 20
      trainers: [{} as TrainerData], // Expenses: 35
      trainingAssignments: [{} as TrainingAssignment], // Expenses: 15
      arenaHistory: [
        createMockFight("Hero", "Villain", "A", 2) // Income: 50 (fight) + 30 (win) = 80
      ]
    });

    const result = computeWeeklyBreakdown(state);

    expect(result.totalIncome).toBe(90); // 10 + 80
    expect(result.totalExpenses).toBe(70); // 20 + 35 + 15
    expect(result.net).toBe(20); // 90 - 70
  });
});

describe("processEconomy", () => {
  it("updates gold and adds ledger entries correctly", () => {
    const initialState = createMockState({
      week: 10,
      gold: 500,
      fame: 10, // Income: 20
      roster: [createMockWarrior("W1")], // Expense: 20
      ledger: [{ week: 9, label: "Old Entry", amount: 100, category: "other" }]
    });

    const newState = processEconomy(initialState);

    // Net is 0, so gold remains 500
    expect(newState.gold).toBe(500);

    // Ledger should have original entry + new income + new expense
    expect(newState.ledger).toHaveLength(3);
    expect(newState.ledger).toContainEqual({
      week: 10,
      label: "Fame dividends",
      amount: 20,
      category: "fight"
    });
    expect(newState.ledger).toContainEqual({
      week: 10,
      label: "Warrior upkeep (1)",
      amount: -20, // Expenses are negated in ledger
      category: "upkeep"
    });
  });

  it("handles empty initial gold and ledger gracefully", () => {
     const initialState = createMockState({
       week: 1,
       fame: 5,
       gold: undefined,
       ledger: undefined
     });

     const newState = processEconomy(initialState);

     expect(newState.gold).toBe(10);
     expect(newState.ledger).toHaveLength(1);
     expect(newState.ledger[0]).toEqual({
       week: 1,
       label: "Fame dividends",
       amount: 10,
       category: "fight"
     });
  });
});
