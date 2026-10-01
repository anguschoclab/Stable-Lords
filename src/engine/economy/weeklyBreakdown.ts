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
import { resolveRng } from '@/utils/random';
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
import { AI_PRESTIGE_FREE_TREASURY, AI_PRESTIGE_RATE, AI_PRESTIGE_CAP_RATE } from '@/constants/ai';
import { getArenaById } from '@/data/arenas';

/**
 * Represents the financial summary for a game week.
 */
export interface WeeklyBreakdown {
  /** Individual income items */
  income: { label: string; amount: number; category: LedgerEntry['category'] }[];
  /** Individual expense items */
  expenses: { label: string; amount: number; category: LedgerEntry['category'] }[];
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
  /**
   * Current treasury — used only for the AI prestige-upkeep sink. Rival
   * stables pass it so wealthy stables pay proportional facilities costs;
   * omitted for the player (the player pays prestige upkeep through their
   * own discretionary spending, not an automatic levy).
   */
  treasury?: number;
}

function arenaTier(arenaId?: string): 1 | 2 | 3 {
  if (!arenaId) return 1;
  try {
    return getArenaById(arenaId).tier;
  } catch {
    return 1; // unknown/legacy arena id → treat as tier 1
  }
}

interface PurseTotals {
  fightCount: number;
  winCount: number;
  scaledPurse: number;
  scaledWinBonus: number;
}

/**
 * ⚡ Bolt: Fast backward scan of this week's fight purses — O(week's bouts)
 * instead of an O(N) filter, breaking early because `arenaHistory` is
 * guaranteed chronological.
 */
function sumFightPurses(input: StableEconomyInput): PurseTotals {
  const week = input.week;
  const stableWarriorIds = new Set(input.roster.map((w) => w.id));

  let fightCount = 0;
  let winCount = 0;
  let scaledPurse = 0;
  let scaledWinBonus = 0;

  for (let i = input.arenaHistory.length - 1; i >= 0; i--) {
    const f = input.arenaHistory[i];
    if (!f) break;
    if (f.week !== week) break;

    // Player contract bouts are paid via processContractPayouts (treasuryDelta + ledger).
    // Skip them here to avoid double-counting income from the same fight.
    if (input.isPlayer && f.contractId) continue;

    const tier = arenaTier(f.arenaId);

    for (const side of ['A', 'D'] as const) {
      const warriorId = side === 'A' ? f.warriorIdA : f.warriorIdD;
      if (!stableWarriorIds.has(warriorId)) continue;
      fightCount++;
      const won = f.winner === side;
      if (won) winCount++;
      const { purse, winBonus } = computeFightEconomics({
        fame: (side === 'A' ? f.fameA : f.fameD) ?? 0,
        arenaTier: tier,
        won,
      });
      scaledPurse += purse;
      scaledWinBonus += winBonus;
    }
  }

  return { fightCount, winCount, scaledPurse, scaledWinBonus };
}

type BreakdownItem = { label: string; amount: number; category: LedgerEntry['category'] };

function buildIncome(input: StableEconomyInput, purses: PurseTotals): BreakdownItem[] {
  const income: BreakdownItem[] = [];
  if (purses.fightCount > 0)
    income.push({
      label: `Fight purses (${purses.fightCount})`,
      amount: purses.scaledPurse,
      category: 'fight',
    });
  if (purses.winCount > 0)
    income.push({
      label: `Win bonuses (${purses.winCount})`,
      amount: purses.scaledWinBonus,
      category: 'fight',
    });
  if (input.fame > 0)
    income.push({
      label: 'Fame dividends',
      amount: Math.round(input.fame * FAME_DIVIDEND),
      category: 'other',
    });

  if (input.applyStipend !== false && purses.fightCount === 0 && input.roster.length > 0) {
    income.push({ label: 'Idle Stipend', amount: IDLE_STIPEND, category: 'other' });
  }

  // 🌩️ Weather Impact: Mana Surge Gift
  if (input.weather === 'Mana Surge') {
    income.push({
      label: 'Celestial Gift (Mana Surge)',
      amount: WEATHER_ECONOMICS.MANA_SURGE_GIFT,
      category: 'other',
    });
  }

  // ⚡ Bolt: Single-pass loop for roster economy logic, avoiding multiple .reduce() allocations
  let patronageIncome = 0;
  for (let i = 0; i < input.roster.length; i++) {
    const w = input.roster[i];
    if (!w) continue;
    const wFame = w.fame || 0;

    // 🏛️ 1.0 Hardening: Noble Patronage (High-fame warriors attract wealthy sponsors)
    if (wFame > WEATHER_ECONOMICS.PATRONAGE_THRESHOLD) {
      patronageIncome +=
        Math.floor(
          (wFame - WEATHER_ECONOMICS.PATRONAGE_THRESHOLD) / WEATHER_ECONOMICS.PATRONAGE_DIVISOR
        ) * WEATHER_ECONOMICS.PATRONAGE_MULTIPLIER;
    }
  }

  if (patronageIncome > 0)
    income.push({
      label: 'Noble Patronage Contribution',
      amount: patronageIncome,
      category: 'other',
    });

  return income;
}

function buildExpenses(input: StableEconomyInput): BreakdownItem[] {
  const expenses: BreakdownItem[] = [];

  // ⚡ Bolt: Single-pass roster upkeep sum, same loop shape as patronage.
  let rosterUpkeep = 0;
  for (let i = 0; i < input.roster.length; i++) {
    const w = input.roster[i];
    if (!w) continue;
    // 🏛️ 1.0 Hardening: Elite Maintenance (Legendary warriors demand luxury overhead)
    const famePremium = Math.round((w.fame || 0) * FAME_UPKEEP_MULTIPLIER);
    rosterUpkeep += WARRIOR_UPKEEP_BASE + famePremium;
  }

  if (input.roster.length > 0) {
    expenses.push({
      label: `Warrior upkeep (${input.roster.length})`,
      amount: rosterUpkeep,
      category: 'upkeep',
    });

    // Weather-specific ledger labels for clarity
    if (input.weather === 'Sweltering') {
      expenses.push({
        label: 'Cooling & Ventilation Overhead',
        amount: input.roster.length * WEATHER_ECONOMICS.SWELTERING_PREMIUM,
        category: 'upkeep',
      });
    }
    if (input.weather === 'Blizzard') {
      expenses.push({
        label: 'Insulation & Fuel Overhead',
        amount: input.roster.length * WEATHER_ECONOMICS.BLIZZARD_PREMIUM,
        category: 'upkeep',
      });
    }
  }

  // ⚡ Bolt: Standard for-loop avoids intermediate object allocation during array reduction
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
    expenses.push({
      label: `Trainer salaries (${activeTrainerCount})`,
      amount: trainerCost,
      category: 'trainer',
    });
  }

  const trainingCount = (input.trainingAssignments ?? []).length;
  if (trainingCount > 0)
    expenses.push({
      label: `Training fees (${trainingCount})`,
      amount: trainingCount * TRAINING_COST,
      category: 'training',
    });

  const prestige = prestigeUpkeep(input);
  if (prestige > 0) {
    expenses.push({
      label: 'Stable prestige & facilities upkeep',
      amount: prestige,
      category: 'upkeep',
    });
  }

  return expenses;
}

/**
 * AI prestige upkeep: wealthy rival stables spend proportionally on
 * facilities, retainers, and patron feasts. This is the equilibrating sink
 * that keeps rival treasuries from growing linearly forever — net cost
 * rises with wealth and is hard-capped so it can never bankrupt a stable
 * in a single week.
 */
function prestigeUpkeep(input: StableEconomyInput): number {
  const treasury = input.treasury ?? 0;
  if (input.isPlayer || treasury <= AI_PRESTIGE_FREE_TREASURY) return 0;
  return Math.min(
    Math.floor((treasury - AI_PRESTIGE_FREE_TREASURY) * AI_PRESTIGE_RATE),
    Math.floor(treasury * AI_PRESTIGE_CAP_RATE)
  );
}

/**
 * Compute a projected breakdown for the current state (before advancing).
 *
 * @param input - The stable economy input (GameState or AI rival subset)
 * @returns A detailed breakdown of income and expenses
 */
export function computeWeeklyBreakdown(input: StableEconomyInput): WeeklyBreakdown {
  const purses = sumFightPurses(input);
  const income = buildIncome(input, purses);
  const expenses = buildExpenses(input);

  // ⚡ Bolt: Optimized calculation over constant size small arrays without .reduce() overhead.
  let totalIncome = 0;
  for (let i = 0; i < income.length; i++) {
    const item = income[i];
    if (item) totalIncome += item.amount;
  }

  let totalExpenses = 0;
  for (let i = 0; i < expenses.length; i++) {
    const item = expenses[i];
    if (item) totalExpenses += item.amount;
  }

  return { income, expenses, totalIncome, totalExpenses, net: totalIncome - totalExpenses };
}

/**
 * Compute the economic impact of the current week.
 *
 * @param input -
 * @param rng -
 * * @returns The state impact containing treasury delta and ledger entries
 */
export function computeEconomyImpact(input: StableEconomyInput, rng?: IRNGService): StateImpact {
  const breakdown = computeWeeklyBreakdown(input);
  const entries: LedgerEntry[] = [];

  const rngService = resolveRng(rng, input.week * 31);

  for (const i of breakdown.income) {
    entries.push({
      id: rngService.uuid() as LedgerEntryId,
      week: input.week,
      label: i.label,
      amount: i.amount,
      category: i.category,
    });
  }
  for (const e of breakdown.expenses) {
    entries.push({
      id: rngService.uuid() as LedgerEntryId,
      week: input.week,
      label: e.label,
      amount: -e.amount,
      category: e.category,
    });
  }

  return {
    treasuryDelta: breakdown.net,
    ledgerEntries: entries,
  };
}
