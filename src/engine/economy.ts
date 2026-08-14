/**
 * Economy engine — weekly income/expenses processed at week advance.
 *
 * Income sources:
 *  - Fight purses: base FIGHT_PURSE scaled by the warrior's fame and arena tier
 *    (see computeFightEconomics in constants/economy).
 *  - Win bonus: base WIN_BONUS, scaled the same way, on wins only.
 *  - Fame dividend: fame × FAME_DIVIDEND per week.
 *  - Noble patronage: high-fame warriors attract sponsors.
 *
 * Expenses:
 *  - Warrior upkeep: WARRIOR_UPKEEP_BASE + fame premium per warrior per week.
 *  - Trainer salaries: by tier.
 *  - Training costs: TRAINING_COST per warrior in training.
 */
import type { LedgerEntry, TrainingAssignment } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';
import type { Trainer, WeatherType } from '@/types/shared.types';
import type { StateImpact } from '@/engine/impacts';
import type { LedgerEntryId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import {
  FAME_DIVIDEND,
  WARRIOR_UPKEEP_BASE,
  FAME_UPKEEP_MULTIPLIER,
  TRAINING_COST,
  TRAINER_WEEKLY_SALARY,
  TRAINER_SALARY_FALLBACK,
  IDLE_STIPEND,
  WEATHER_ECONOMICS,
  computeFightEconomics,
} from '@/constants/economy';
import { getArenaById } from '@/data/arenas';

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
 * Minimal subset of GameState that computeWeeklyBreakdown actually reads.
 * Allows both the player (full GameState) and AI stables (rival-shaped
 * objects) to use the same weekly economy math.
 */
export interface StableEconomyInput {
  week: number;
  roster: Warrior[];
  fame: number;
  weather: WeatherType;
  arenaHistory: FightSummary[];
  trainers: Trainer[];
  trainingAssignments: TrainingAssignment[];
  applyStipend?: boolean;
  isPlayer?: boolean;
}

/**
 * Compute a projected breakdown for the current state (before advancing).
 *
 * @param input - The stable economy input (GameState or AI rival subset)
 * @returns A detailed breakdown of income and expenses
 */
export function computeWeeklyBreakdown(input: StableEconomyInput): WeeklyBreakdown {
  const week = input.week;
  const stableWarriorIds = new Set(input.roster.map((w) => w.id));

  let fightCount = 0;
  let winCount = 0;
  let scaledPurse = 0;
  let scaledWinBonus = 0;

  const arenaTier = (arenaId?: string): 1 | 2 | 3 => {
    if (!arenaId) return 1;
    try {
      return getArenaById(arenaId).tier;
    } catch {
      return 1; // unknown/legacy arena id → treat as tier 1
    }
  };

  // ⚡ Bolt: Fast backward search in O(1) instead of an O(N) filter.
  // We can break early because `arenaHistory` is guaranteed chronological.
  for (let i = input.arenaHistory.length - 1; i >= 0; i--) {
    const f = input.arenaHistory[i];
    if (!f) break;
    if (f.week !== week) break;

    // Player contract bouts are paid via processContractPayouts (treasuryDelta + ledger).
    // Skip them here to avoid double-counting income from the same fight.
    if (input.isPlayer && f.contractId) continue;

    const aIsStable = stableWarriorIds.has(f.warriorIdA);
    const dIsStable = stableWarriorIds.has(f.warriorIdD);
    const tier = arenaTier(f.arenaId);

    if (aIsStable) {
      fightCount++;
      const won = f.winner === 'A';
      if (won) winCount++;
      const { purse, winBonus } = computeFightEconomics({
        fame: f.fameA ?? 0,
        arenaTier: tier,
        won,
      });
      scaledPurse += purse;
      scaledWinBonus += winBonus;
    }
    if (dIsStable) {
      fightCount++;
      const won = f.winner === 'D';
      if (won) winCount++;
      const { purse, winBonus } = computeFightEconomics({
        fame: f.fameD ?? 0,
        arenaTier: tier,
        won,
      });
      scaledPurse += purse;
      scaledWinBonus += winBonus;
    }
  }

  const income: { label: string; amount: number }[] = [];
  if (fightCount > 0) income.push({ label: `Fight purses (${fightCount})`, amount: scaledPurse });
  if (winCount > 0) income.push({ label: `Win bonuses (${winCount})`, amount: scaledWinBonus });
  if (input.fame > 0)
    income.push({ label: 'Fame dividends', amount: Math.round(input.fame * FAME_DIVIDEND) });

  if (input.applyStipend !== false && fightCount === 0 && input.roster.length > 0) {
    income.push({ label: 'Idle Stipend', amount: IDLE_STIPEND });
  }

  // 🌩️ Weather Impact: Mana Surge Gift
  if (input.weather === 'Mana Surge') {
    income.push({ label: 'Celestial Gift (Mana Surge)', amount: WEATHER_ECONOMICS.MANA_SURGE_GIFT });
  }

  // ⚡ Bolt: Replaced multiple O(N) array traversals with a single-pass loop
  // to avoid redundant iterations and intermediate object allocations.
  let patronageIncome = 0;
  let rosterUpkeep = 0;

  for (let i = 0; i < input.roster.length; i++) {
    const w = input.roster[i];
    if (!w) continue;
    const fame = w.fame || 0;

    // 🏛️ 1.0 Hardening: Noble Patronage (High-fame warriors attract wealthy sponsors)
    if (fame > WEATHER_ECONOMICS.PATRONAGE_THRESHOLD) {
      patronageIncome += Math.floor((fame - WEATHER_ECONOMICS.PATRONAGE_THRESHOLD) / WEATHER_ECONOMICS.PATRONAGE_DIVISOR) * WEATHER_ECONOMICS.PATRONAGE_MULTIPLIER;
    }

    // 🏛️ 1.0 Hardening: Elite Maintenance (Legendary warriors demand luxury overhead)
    rosterUpkeep += WARRIOR_UPKEEP_BASE + Math.round(fame * FAME_UPKEEP_MULTIPLIER);
  }

  if (patronageIncome > 0) {
    income.push({ label: 'Noble Patronage Contribution', amount: patronageIncome });
  }

  const expenses: { label: string; amount: number }[] = [];
  if (input.roster.length > 0) {
    expenses.push({ label: `Warrior upkeep (${input.roster.length})`, amount: rosterUpkeep });

    // Weather-specific ledger labels for clarity
    if (input.weather === 'Sweltering') {
      expenses.push({ label: 'Cooling & Ventilation Overhead', amount: input.roster.length * WEATHER_ECONOMICS.SWELTERING_PREMIUM });
    }
    if (input.weather === 'Blizzard') {
      expenses.push({ label: 'Insulation & Fuel Overhead', amount: input.roster.length * WEATHER_ECONOMICS.BLIZZARD_PREMIUM });
    }
  }

  // ⚡ Bolt: Use scalar variables in a for loop instead of allocating an accumulator object in reduce().
  let activeTrainerCount = 0;
  let trainerCost = 0;
  for (let i = 0; i < input.trainers.length; i++) {
    const t = input.trainers[i];
    if (t && t.contractWeeksLeft > 0) {
      activeTrainerCount++;
      trainerCost += TRAINER_WEEKLY_SALARY[t.tier] ?? TRAINER_SALARY_FALLBACK;
    }
  }
  if (activeTrainerCount > 0) {
    expenses.push({ label: `Trainer salaries (${activeTrainerCount})`, amount: trainerCost });
  }

  const trainingCount = (input.trainingAssignments ?? []).length;
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
export function computeEconomyImpact(input: StableEconomyInput, rng?: IRNGService): StateImpact {
  const breakdown = computeWeeklyBreakdown(input);
  const entries: LedgerEntry[] = [];

  const rngService = rng || new SeededRNGService(input.week * 31);

  for (const i of breakdown.income) {
    entries.push({
      id: rngService.uuid() as LedgerEntryId,
      week: input.week,
      label: i.label,
      amount: i.amount,
      category: 'fight',
    });
  }
  for (const e of breakdown.expenses) {
    entries.push({
      id: rngService.uuid() as LedgerEntryId,
      week: input.week,
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
