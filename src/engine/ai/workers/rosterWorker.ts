/**
 * RosterWorker: Handles training and equipment for AI stables.
 * Orchestrates training (rosterWorkerTraining) and equipment (rosterWorkerEquipment).
 * Re-exports public symbols for backward compatibility.
 */
import { updateEntityInList } from '@/utils/stateUtils';
import type { RivalStableData, SeasonalGrowth, TrainingAssignment } from '@/types/state.types';
import { TRAINING_COST } from '@/constants/economy';
import type { Season } from '@/types/shared.types';
import { checkBudget } from './budgetWorker';
import { logAgentAction, logFinanceEvent } from '../agentCore';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { getHealingTrainerBonus } from '@/engine/training/coachLogic';
import { processRecovery } from '@/engine/training/trainingGains';
import { isActive } from '@/engine/warrior/warriorStatus';
import { FightingStyle } from '@/types/shared.types';
import {
  performAITraining,
  performAISkillDrill,
  processTraitDevelopment,
  aiTrainingLimit,
} from './rosterWorkerTraining';
import { applyGearUpgrade } from './rosterWorkerEquipment';
import { warriorDisplayName } from '@/utils/warriorDisplay';

// Re-export public symbols for backward compatibility
export {
  selectTrainingFocus,
  FLAW_EXPOSURE_CHANCE,
  QUALIFIED_DEV_APPETITE,
} from './rosterWorkerTraining';

/**
 * RosterWorker: Handles training and equipment.
 * Implements "Risk-Tiered Execution" for gear.
 */
/**
 * Tick injuries for all active wounded warriors, applying any healing trainer
 * bonus exactly as the player path does in training.ts.
 */
function tickRecoveries(rival: RivalStableData, healingBonus: number): void {
  for (const wounded of rival.roster) {
    if (!isActive(wounded)) continue;
    if ((wounded.injuries ?? []).length === 0) continue;
    const { updatedInjuries } = processRecovery(wounded, healingBonus);
    rival.roster = updateEntityInList(rival.roster, wounded.id, (w) => ({
      ...w,
      injuries: updatedInjuries,
    }));
  }
}

/**
 * AI training pass — ⚡ TSA: prioritize champion/high-fame units.
 * Injured warriors are excluded (they're in the recovery path) and warriors on
 * a 'recovery' assignment (tournament prep, crown posture) rest — no drills
 * means no training-injury roll before a booked engagement.
 */
function runAITraining(
  rival: RivalStableData,
  season: Season | undefined,
  healingBonus: number,
  rngService: IRNGService
): void {
  let seasonalGrowth: SeasonalGrowth[] = rival.seasonalGrowth ?? [];

  const restingIds = new Set(
    (rival.trainingAssignments ?? [])
      .filter((a) => a.type === 'recovery')
      .map((a) => a.warriorId)
  );
  const trainingLimit = aiTrainingLimit(rival.treasury);
  const { champions, nonChampions } = rival.roster.reduce(
    (acc, w) => {
      if (!isActive(w) || (w.injuries ?? []).length > 0) return acc;
      if (restingIds.has(w.id)) return acc;
      if (w.champion || w.isStarInvestment) acc.champions.push(w);
      else acc.nonChampions.push(w);
      return acc;
    },
    {
      champions: [] as typeof rival.roster,
      nonChampions: [] as typeof rival.roster,
    }
  );
  nonChampions.sort((a, b) => (b.fame || 0) - (a.fame || 0));
  const trainees = [...champions, ...nonChampions].slice(0, trainingLimit);

  for (const trainee of trainees) {
    const budgetReport = checkBudget(rival, TRAINING_COST, 'ROSTER');

    if (budgetReport.isAffordable) {
      // With the `skillDrilling` feature flag on, roughly 1-in-4 AI training
      // weeks spend on skill drilling instead of attribute training — same
      // option surface the player has in the TrainingAssignment UI. Below the
      // cap a drill is comparatively cheap and the attribute pipeline handles
      // the rest of the time.
      const doDrill = rngService.next() < 0.25;
      if (doDrill) {
        rival.roster = updateEntityInList(rival.roster, trainee.id, (w) =>
          performAISkillDrill(w, rival, rngService)
        );
        rival.trainingAssignments = [
          ...(rival.trainingAssignments || []),
          { warriorId: trainee.id, type: 'skillDrill' } as TrainingAssignment,
        ];
      } else {
        const {
          warrior,
          seasonalGrowth: nextGrowth,
          chosen,
        } = performAITraining(
          trainee,
          rival,
          season,
          seasonalGrowth,
          rngService,
          healingBonus
        );
        seasonalGrowth = nextGrowth;
        rival.roster = updateEntityInList(rival.roster, warrior.id, () => warrior);
        if (chosen) {
          rival.trainingAssignments = [
            ...(rival.trainingAssignments || []),
            { warriorId: trainee.id, type: 'attribute', attribute: chosen } as TrainingAssignment,
          ];
        }
      }
    }
  }
  rival.seasonalGrowth = seasonalGrowth;
}

/** Purchase a gear upgrade for one warrior: deduct cost, apply, log both books. */
function buyGearUpgrade(
  rival: RivalStableData,
  warrior: RivalStableData['roster'][number],
  gearCost: number,
  currentWeek: number,
  rngService: IRNGService,
  isChampion: boolean
): RivalStableData {
  const budgetReport = checkBudget(rival, gearCost, 'ROSTER');
  if (!budgetReport.isAffordable) return rival;

  rival.treasury -= gearCost;
  rival.roster = updateEntityInList(rival.roster, warrior.id, (w) =>
    applyGearUpgrade(w, rngService)
  );
  let updated = logFinanceEvent(rival, {
    label: `Gear upgrade — ${warriorDisplayName(warrior)}`,
    amount: -gearCost,
    week: currentWeek,
    category: 'other',
    description: `Invested ${gearCost}g in gear for ${isChampion ? 'champion ' : ''}${warriorDisplayName(warrior)}.`,
    riskTier: budgetReport.riskTier,
  });
  updated = logAgentAction(
    updated,
    'ROSTER',
    `Invested ${gearCost}g in gear for ${isChampion ? 'champion ' : ''}${warriorDisplayName(warrior)}.`,
    budgetReport.riskTier,
    currentWeek
  );
  return updated;
}

/**
 * RosterWorker: Handles training and equipment.
 * Implements "Risk-Tiered Execution" for gear.
 */
export function processRoster(
  rival: RivalStableData,
  currentWeek: number,
  season?: Season,
  seed?: number,
  rng?: IRNGService
): RivalStableData {
  const rngService = resolveRng(rng, seed ?? currentWeek * 7919 + 101);
  let updatedRival = { ...rival };
  const intent = updatedRival.strategy?.intent ?? 'CONSOLIDATION';

  const healingBonus = getHealingTrainerBonus(updatedRival.trainers ?? []);
  tickRecoveries(updatedRival, healingBonus);

  // ⚡ Bolt Optimization: Using updateEntityInList instead of .map()
  // 💡 What: Replaced .map() traversal with a targeted index update.
  // 🎯 Why: Avoids O(N) allocations and redundant iterations when modifying a single element.
  // 📊 Impact: Significantly reduces GC pressure during hot loops updating game state arrays.

  runAITraining(updatedRival, season, healingBonus, rngService);

  updatedRival = applyTraitDevelopment(updatedRival, currentWeek, rngService);
  updatedRival = applyGearPolicy(updatedRival, intent, currentWeek, rngService);

  return updatedRival;
}

/**
 * Trait Development — delegates to processTraitDevelopment in
 * rosterWorkerTraining; coaching hours debit the treasury.
 */
function applyTraitDevelopment(
  rival: RivalStableData,
  currentWeek: number,
  rngService: IRNGService
): RivalStableData {
  const traitDev = processTraitDevelopment(
    rival.roster,
    rival.treasury ?? 0,
    rival.owner.personality,
    rngService
  );
  let updated = { ...rival, roster: traitDev.roster };
  if (traitDev.spent > 0) {
    updated.treasury -= traitDev.spent;
    updated = logFinanceEvent(updated, {
      label: 'Trait development program',
      amount: -traitDev.spent,
      week: currentWeek,
      category: 'training',
      description: `Paid ${traitDev.spent}g in coaching fees for trait development.`,
      riskTier: 'Low',
    });
  }
  return updated;
}

/**
 * Equipment (High Risk). Champions always get gear consideration regardless
 * of intent (treasury gate only); EXPANSION/VENDETTA intents gear one more
 * active warrior, preferring the champion or the 'Muddy' Basher.
 */
function applyGearPolicy(
  rival: RivalStableData,
  intent: string,
  currentWeek: number,
  rngService: IRNGService
): RivalStableData {
  const GEAR_COST = 150;
  let updated = rival;
  const activeForGear = updated.roster.filter((w) => isActive(w));
  const champWarrior = activeForGear.find((w) => w.champion);
  if (champWarrior && updated.treasury > 800) {
    updated = buyGearUpgrade(updated, champWarrior, GEAR_COST, currentWeek, rngService, true);
  }
  if (intent === 'EXPANSION' || (intent === 'VENDETTA' && updated.treasury > 1000)) {
    const gearCandidate =
      champWarrior ??
      activeForGear.find((w) => w.style === FightingStyle.BashingAttack) ??
      (activeForGear.length > 0 ? rngService.pick(activeForGear) : undefined);

    if (gearCandidate) {
      updated = buyGearUpgrade(updated, gearCandidate, GEAR_COST, currentWeek, rngService, false);
    }
  }
  return updated;
}
