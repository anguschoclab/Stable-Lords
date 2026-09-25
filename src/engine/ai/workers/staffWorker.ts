import type { RivalStableData, GameState, Trainer } from '@/types/state.types';
import type { FightingStyle, TrainerFocus } from '@/types/shared.types';
import { checkBudget } from './budgetWorker';
import { logAgentAction, logFinanceEvent, type AgentContext } from '../agentCore';

const HIRE_COST: Record<string, number> = { Novice: 50, Seasoned: 100, Master: 200 };

const OFFENSIVE_STYLES: ReadonlySet<FightingStyle> = new Set([
  'BASHING ATTACK',
  'STRIKING ATTACK',
  'LUNGING ATTACK',
  'AIMED BLOW',
  'SLASHING ATTACK',
] as FightingStyle[]);
const DEFENSIVE_STYLES: ReadonlySet<FightingStyle> = new Set([
  'PARRY-LUNGE',
  'PARRY-RIPOSTE',
  'PARRY-STRIKE',
  'TOTAL PARRY',
  'WALL OF STEEL',
] as FightingStyle[]);

/**
 * G21 — Dossier-driven trainer preference. Reads the stable's intel picture:
 * an opponent field dominated by offensive styles calls for a Defense camp;
 * a turtle-heavy field calls for Aggression. Returns null on weak intel —
 * callers fall back to the intent-based preference.
 */
export function preferredTrainerFocus(observedStyles: FightingStyle[]): TrainerFocus | null {
  if (observedStyles.length === 0) return null;
  let offensive = 0;
  let defensive = 0;
  for (const s of observedStyles) {
    if (OFFENSIVE_STYLES.has(s)) offensive++;
    else if (DEFENSIVE_STYLES.has(s)) defensive++;
  }
  const classified = offensive + defensive;
  if (classified === 0) return null;
  if (offensive / classified >= 0.6) return 'Defense';
  if (defensive / classified >= 0.6) return 'Aggression';
  return null;
}

/** Aggregate the observed opponent styles from the dossier book, weighted by threat. */
function dossierObservedStyles(rival: RivalStableData): FightingStyle[] {
  const styles: FightingStyle[] = [];
  const dossiers = rival.agentMemory?.opponentDossiers ?? {};
  for (const d of Object.values(dossiers)) {
    for (const s of d.knownStyles) {
      styles.push(s);
      // High-threat opponents count double — the stable hires for the
      // opponents it fears most.
      if (d.estimatedThreat > 0.6 || d.recordVs.l > 0) styles.push(s);
    }
  }
  return styles;
}

/**
 * StaffWorker: Handles hiring and firing of trainers.
 * Implements "Risk-Tiered Execution" for staffing.
 */
export function processStaff(
  rival: RivalStableData,
  state: GameState,
  hiringPool: Trainer[],
  _context?: AgentContext
): { updatedRival: RivalStableData; gazetteItems: string[]; updatedHiringPool: Trainer[] } {
  let updatedRival = { ...rival };
  const currentTrainers = [...(updatedRival.trainers || [])];
  let currentTreasury = updatedRival.treasury;
  let currentPool = [...hiringPool];
  const gazetteItems: string[] = [];

  const intent = updatedRival.strategy?.intent ?? 'CONSOLIDATION';
  const week = state.week;

  // 1. Hiring logic (Medium/High Risk)
  if (intent !== 'RECOVERY' && currentTrainers.length < 2 && currentPool.length > 0) {
    const affordable = currentPool.filter((t) => (HIRE_COST[t.tier] ?? 0) < currentTreasury - 300);
    if (affordable.length > 0) {
      // Specialty preference: the dossier's observed opponent field wins over
      // the intent default — the stable hires for the field it expects (G21).
      const intelFocus = preferredTrainerFocus(dossierObservedStyles(updatedRival));
      const preferredFocus =
        intelFocus ??
        (intent === 'VENDETTA' || intent === 'AGGRESSIVE_EXPANSION'
          ? 'Aggression'
          : intent === 'EXPANSION'
            ? 'Endurance'
            : null);

      const focusCandidates = preferredFocus
        ? affordable.filter((t) => t.focus === preferredFocus)
        : [];
      const pool = focusCandidates.length > 0 ? focusCandidates : affordable;

      const first = pool[0];
      if (!first) {
        throw new Error('Pool is unexpectedly empty');
      }
      // ⚡ Bolt Optimization: Replace .reduce() with a for loop to avoid iterator overhead in hot loop
      let best = first;
      for (let i = 1; i < pool.length; i++) {
        const current = pool[i];
        if (current && (HIRE_COST[current.tier] ?? 0) > (HIRE_COST[best.tier] ?? 0)) {
          best = current;
        }
      }
      const hireCost = HIRE_COST[best.tier] ?? 0;
      const budgetReport = checkBudget(updatedRival, hireCost, 'STAFF');

      if (budgetReport.isAffordable) {
        currentTreasury -= hireCost;
        currentTrainers.push(best);
        currentPool = currentPool.filter((t) => t.id !== best.id);

        updatedRival = { ...updatedRival, treasury: currentTreasury, trainers: currentTrainers };
        updatedRival = logFinanceEvent(updatedRival, {
          label: `Trainer hired — ${best.name}`,
          amount: -hireCost,
          week,
          category: 'trainer',
          description: `Paid ${hireCost}g to hire ${best.name} (${best.tier}).`,
          riskTier: budgetReport.riskTier,
        });
        updatedRival = logAgentAction(
          updatedRival,
          'STAFF',
          `Hired trainer ${best.name} (${best.tier}).`,
          budgetReport.riskTier,
          week
        );
        gazetteItems.push(
          `👔 STAFF: ${updatedRival.owner.stableName} hired ${best.name} (${best.tier}) to lead their training camp.`
        );
      }
    }
  }

  // 2. Firing logic (RECOVERY Tier + Regional Risk)
  const isSolemn = state.crowdMood === 'Solemn';
  const isRainy = state.weather === 'Rainy';
  const underPressure = currentTreasury < 500 && (isSolemn || isRainy);

  if (intent === 'RECOVERY' || currentTreasury < 100 || underPressure) {
    if (currentTrainers.length > 0) {
      const fired = currentTrainers.pop();
      if (fired) {
        updatedRival = { ...updatedRival, treasury: currentTreasury, trainers: currentTrainers };
        const riskReason = isSolemn
          ? 'solemn crowd dampening income'
          : isRainy
            ? 'stormy weather risks'
            : 'budget constraints';
        updatedRival = logAgentAction(
          updatedRival,
          'STAFF',
          `Released trainer ${fired.name} due to ${riskReason}.`,
          'Low',
          week
        );
        gazetteItems.push(
          `📉 DOWNSIZING: ${updatedRival.owner.stableName} has released trainer ${fired.name} due to ${riskReason}.`
        );
      }
    }
  }

  return { updatedRival, gazetteItems, updatedHiringPool: currentPool };
}
