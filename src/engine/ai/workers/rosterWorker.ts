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
import { logAgentAction } from '../agentCore';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import { getHealingTrainerBonus } from '@/engine/training/coachLogic';
import { processRecovery } from '@/engine/training/trainingGains';
import { isActive } from '@/engine/warriorStatus';
import { FightingStyle } from '@/types/shared.types';
import {
  performAITraining,
  performAISkillDrill,
  processTraitDevelopment,
} from './rosterWorkerTraining';
import { applyGearUpgrade } from './rosterWorkerEquipment';

// Re-export public symbols for backward compatibility
export { selectTrainingFocus, FLAW_EXPOSURE_CHANCE, QUALIFIED_DEV_APPETITE } from './rosterWorkerTraining';

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
  const rngService = rng || new SeededRNGService(seed ?? currentWeek * 7919 + 101);
  let updatedRival = { ...rival };
  let seasonalGrowth: SeasonalGrowth[] = updatedRival.seasonalGrowth ?? [];
  const activeRoster = updatedRival.roster.filter((w) => isActive(w));
  const intent = updatedRival.strategy?.intent ?? 'CONSOLIDATION';

  // 0. Recovery — tick injuries for all active wounded warriors, applying any
  // healing trainer bonus exactly as the player path does in training.ts.
  const healingBonus = getHealingTrainerBonus(updatedRival.trainers ?? []);
  for (const wounded of activeRoster) {
    if ((wounded.injuries ?? []).length === 0) continue;
    const { updatedInjuries } = processRecovery(wounded, healingBonus);
    updatedRival.roster = updateEntityInList(updatedRival.roster, wounded.id, (w) => ({
      ...w,
      injuries: updatedInjuries,
    }));
  }

  // ⚡ Bolt Optimization: Using updateEntityInList instead of .map()
  // 💡 What: Replaced .map() traversal with a targeted index update.
  // 🎯 Why: Avoids O(N) allocations and redundant iterations when modifying a single element.
  // 📊 Impact: Significantly reduces GC pressure during hot loops updating game state arrays.

  // 1. Training (Low Risk)
  // ⚡ TSA: Prioritize Champion or high-fame units for training.
  // Injured warriors are excluded — they are already in the recovery path above
  // and training them would stack the injury penalty from trainingGains.ts.
  const trainingLimit = updatedRival.treasury > 500 ? 3 : 1;
  const { champions, nonChampions } = updatedRival.roster.reduce(
    (acc, w) => {
      if (w.status !== 'Active' || (w.injuries ?? []).length > 0) return acc;
      if (w.champion || w.isStarInvestment) acc.champions.push(w);
      else acc.nonChampions.push(w);
      return acc;
    },
    {
      champions: [] as typeof updatedRival.roster,
      nonChampions: [] as typeof updatedRival.roster,
    }
  );
  nonChampions.sort((a, b) => (b.fame || 0) - (a.fame || 0));
  const trainees = [...champions, ...nonChampions].slice(0, trainingLimit);

  for (const trainee of trainees) {
    const budgetReport = checkBudget(updatedRival, TRAINING_COST, 'ROSTER');

    if (budgetReport.isAffordable) {
      // With the `skillDrilling` feature flag on, roughly 1-in-4 AI training
      // weeks spend on skill drilling instead of attribute training — same
      // option surface the player has in the TrainingAssignment UI. Below the
      // cap a drill is comparatively cheap and the attribute pipeline handles
      // the rest of the time.
      const doDrill = rngService.next() < 0.25;
      if (doDrill) {
        updatedRival.roster = updateEntityInList(updatedRival.roster, trainee.id, (w) =>
          performAISkillDrill(w, updatedRival, rngService)
        );
        updatedRival.trainingAssignments = [
          ...(updatedRival.trainingAssignments || []),
          { warriorId: trainee.id, type: 'skillDrill' } as TrainingAssignment,
        ];
      } else {
        const {
          warrior,
          seasonalGrowth: nextGrowth,
          chosen,
        } = performAITraining(
          trainee,
          updatedRival,
          season,
          seasonalGrowth,
          rngService,
          healingBonus
        );
        seasonalGrowth = nextGrowth;
        updatedRival.roster = updateEntityInList(updatedRival.roster, warrior.id, () => warrior);
        if (chosen) {
          updatedRival.trainingAssignments = [
            ...(updatedRival.trainingAssignments || []),
            { warriorId: trainee.id, type: 'attribute', attribute: chosen } as TrainingAssignment,
          ];
        }
      }
    }
  }
  updatedRival.seasonalGrowth = seasonalGrowth;

  // 1b. Trait Development — delegates to processTraitDevelopment in rosterWorkerTraining.
  updatedRival.roster = processTraitDevelopment(
    updatedRival.roster,
    updatedRival.treasury ?? 0,
    updatedRival.owner.personality,
    rngService
  );

  // 2. Equipment (High Risk)
  // Champions always get gear consideration regardless of intent (treasury gate only).
  // activeForGear is derived fresh (post-training) so gear candidates reflect current state.
  const activeForGear = updatedRival.roster.filter((w) => isActive(w));
  const champWarrior = activeForGear.find((w) => w.champion);
  if (champWarrior && updatedRival.treasury > 800) {
    const gearCost = 150;
    const budgetReport = checkBudget(updatedRival, gearCost, 'ROSTER');
    if (budgetReport.isAffordable) {
      updatedRival.treasury -= gearCost;
      updatedRival.roster = updateEntityInList(updatedRival.roster, champWarrior.id, (w) =>
        applyGearUpgrade(w, rngService)
      );
      updatedRival = logAgentAction(
        updatedRival,
        'ROSTER',
        `Invested 150g in gear for champion ${champWarrior.name}.`,
        budgetReport.riskTier,
        currentWeek
      );
    }
  }
  if (intent === 'EXPANSION' || (intent === 'VENDETTA' && updatedRival.treasury > 1000)) {
    const gearCost = 150;
    const budgetReport = checkBudget(updatedRival, gearCost, 'ROSTER');

    if (budgetReport.isAffordable && activeForGear.length > 0) {
      // ⚡ TSA: Role-Based Gearing (Prioritize Champion or the 'Muddy' Basher for rain insurance)
      const gearCandidate =
        champWarrior ??
        activeForGear.find((w) => w.style === FightingStyle.BashingAttack) ??
        rngService.pick(activeForGear);

      if (gearCandidate) {
        updatedRival.treasury -= gearCost;
        updatedRival.roster = updateEntityInList(updatedRival.roster, gearCandidate.id, (w) =>
          applyGearUpgrade(w, rngService)
        );
        updatedRival = logAgentAction(
          updatedRival,
          'ROSTER',
          `Invested 150g in gear for ${gearCandidate.name}.`,
          budgetReport.riskTier,
          currentWeek
        );
      }
    }
  }

  return updatedRival;
}

