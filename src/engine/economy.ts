/**
 * Economy engine — weekly income/expenses processed at week advance.
 *
 * Income sources:
 *  - Fight purses: 50g per fight participated
 *  - Win bonus: +30g per win
 *  - Fame bonus: fame × 2 per week
 *
 * Expenses:
 *  - Warrior upkeep: 20g per warrior per week
 *  - Trainer salaries: 35g per active trainer per week
 *  - Training costs: 15g per warrior in training
 */
import type { GameState, LedgerEntry } from '@/types/state.types';
import type { StateImpact } from '@/engine/impacts';
import type { LedgerEntryId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import {
  FIGHT_PURSE,
  WIN_BONUS,
  FAME_DIVIDEND,
  WARRIOR_UPKEEP_BASE,
  TRAINING_COST,
  TRAINER_WEEKLY_SALARY,
} from '@/constants/economy';

/**
 * Represents the financial summary for a game week.
 */
export interface WeeklyBreakdown {
  /** Individual income items */
  income: { label: string; amount: number }[];
  /** Individual expense items */
  expenses: { label: string; amount: number }[];
  /** Sum of all income */
  totalIncome: number;
  /** Sum of all expenses */
  totalExpenses: number;
  /** Net profit or loss (income - expenses) */
  net: number;
}

/**
 * Compute a projected breakdown for the current state (before advancing).
 *
 * @param state - The current game state
 * @returns A detailed breakdown of income and expenses
 */
export function computeWeeklyBreakdown(state: GameState): WeeklyBreakdown {
  const week = state.week;
  const playerWarriorIds = new Set(state.roster.map((w) => w.id));

  let fightCount = 0;
  let winCount = 0;

  // ⚡ Bolt: Fast backward search in O(1) instead of an O(N) filter.
  // We can break early because `arenaHistory` is guaranteed chronological.
  for (let i = state.arenaHistory.length - 1; i >= 0; i--) {
    const f = state.arenaHistory[i];
    if (!f) break;
    if (f.week !== week) break;

    const aIsPlayer = playerWarriorIds.has(f.warriorIdA);
    const dIsPlayer = playerWarriorIds.has(f.warriorIdD);
    if (aIsPlayer) {
      fightCount++;
      if (f.winner === 'A') winCount++;
    }
    if (dIsPlayer) {
      fightCount++;
      if (f.winner === 'D') winCount++;
    }
  }

  const income: { label: string; amount: number }[] = [];
  if (fightCount > 0)
    income.push({ label: `Fight purses (${fightCount})`, amount: fightCount * FIGHT_PURSE });
  if (winCount > 0)
    income.push({ label: `Win bonuses (${winCount})`, amount: winCount * WIN_BONUS });
  if (state.fame > 0)
    income.push({ label: 'Fame dividends', amount: Math.round(state.fame * FAME_DIVIDEND) });

  // 🌩️ Weather Impact: Mana Surge Gift
  if (state.weather === 'Mana Surge') {
    income.push({ label: 'Celestial Gift (Mana Surge)', amount: 250 });
  }

  // 🏛️ 1.0 Hardening: Noble Patronage (High-fame warriors attract wealthy sponsors)
  const patronageIncome = state.roster.reduce((sum, w) => {
    if ((w.fame || 0) > 40) {
      return sum + Math.floor(((w.fame || 0) - 40) / 10) * 25;
    }
    return sum;
  }, 0);
  if (patronageIncome > 0)
    income.push({ label: 'Noble Patronage Contribution', amount: patronageIncome });

  const expenses: { label: string; amount: number }[] = [];
  if (state.roster.length > 0) {
    // 🏛️ 1.0 Hardening: Elite Maintenance (Legendary warriors demand luxury overhead)
    const rosterUpkeep = state.roster.reduce((sum, w) => {
      const famePremium = Math.floor((w.fame || 0) / 10) * 15; // Increased from 10 to 15 for 1.0 balance
      return sum + WARRIOR_UPKEEP_BASE + famePremium;
    }, 0);
    expenses.push({ label: `Warrior upkeep (${state.roster.length})`, amount: rosterUpkeep });

    // Weather-specific ledger labels for clarity
    if (state.weather === 'Sweltering') {
      expenses.push({ label: 'Cooling & Ventilation Overhead', amount: state.roster.length * 5 });
    }
    if (state.weather === 'Blizzard') {
      expenses.push({ label: 'Insulation & Fuel Overhead', amount: state.roster.length * 10 });
    }
  }

  const { activeTrainerCount, trainerCost } = state.trainers.reduce(
    (acc, t) => {
      if (t.contractWeeksLeft > 0) {
        acc.activeTrainerCount++;
        acc.trainerCost += TRAINER_WEEKLY_SALARY[t.tier] ?? 35;
      }
      return acc;
    },
    { activeTrainerCount: 0, trainerCost: 0 }
  );
  if (activeTrainerCount > 0) {
    expenses.push({ label: `Trainer salaries (${activeTrainerCount})`, amount: trainerCost });
  }

  const trainingCount = (state.trainingAssignments ?? []).length;
  if (trainingCount > 0)
    expenses.push({
      label: `Training fees (${trainingCount})`,
      amount: trainingCount * TRAINING_COST,
    });

  // ⚡ Bolt: Optimized calculation over constant size small arrays.
  const totalIncome = income.reduce((s, item) => s + item.amount, 0);
  const totalExpenses = expenses.reduce((s, item) => s + item.amount, 0);

  return { income, expenses, totalIncome, totalExpenses, net: totalIncome - totalExpenses };
}

/**
 * Compute the economic impact of the current week.
 *
 * @param state - The current game state
 * @param rng - RNG service for generating transaction IDs (optional)
 * @returns The state impact containing treasury delta and ledger entries
 */
export function computeEconomyImpact(state: GameState, rng?: IRNGService): StateImpact {
  const breakdown = computeWeeklyBreakdown(state);
  const entries: LedgerEntry[] = [];

  const rngService = rng || new SeededRNGService(state.week * 31);

  for (const i of breakdown.income) {
    entries.push({
      id: rngService.uuid() as LedgerEntryId,
      week: state.week,
      label: i.label,
      amount: i.amount,
      category: 'fight',
    });
  }
  for (const e of breakdown.expenses) {
    entries.push({
      id: rngService.uuid() as LedgerEntryId,
      week: state.week,
      label: e.label,
      amount: -e.amount,
      category: 'upkeep',
    });
  }

  return {
    treasuryDelta: breakdown.net,
    ledgerEntries: entries,
  };
}
