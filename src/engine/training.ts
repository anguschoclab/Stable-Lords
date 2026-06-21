import type { GameState, SeasonalGrowth, TrainingAssignment } from '@/types/state.types';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { type StateImpact } from './impacts';
import {
  computeGainChance,
  processRecovery,
  processAttributeTraining,
  processSkillDrillTraining,
  rollForTrainingInjury,
  type TrainingResult,
} from './training/trainingGains';
import { getHealingTrainerBonus } from './training/coachLogic';
import { rollTraitTraining } from './training/trainingGains/traitTraining';
import { TRAITS } from '@/engine/traits';

// ─── Exports for backward compatibility ───
export { computeGainChance };

/**
 * Defines the shape of training impact.
 */
export interface TrainingImpact {
  updatedRoster: Warrior[];
  updatedSeasonalGrowth: SeasonalGrowth[];
  results: TrainingResult[];
}

/**
 * Helper to process the recovery training assignment.
 */
function processRecoveryAssignment(
  warrior: Warrior,
  healingBonus: number,
  currentRoster: Map<WarriorId, Warrior>,
  results: TrainingResult[]
): Map<WarriorId, Warrior> {
  const { updatedInjuries, message } = processRecovery(warrior, healingBonus);
  results.push({ type: 'recovery', warriorId: warrior.id, message });
  currentRoster.set(warrior.id, {
    ...(currentRoster.get(warrior.id) ?? warrior),
    injuries: updatedInjuries as InjuryData[],
  });
  return currentRoster;
}

/**
 * Helper to process the skill drilling training assignment.
 */
function processSkillDrillAssignment(
  assignment: TrainingAssignment,
  warrior: Warrior,
  healingBonus: number,
  currentRoster: Map<WarriorId, Warrior>,
  results: TrainingResult[],
  state: GameState,
  rng: IRNGService,
  weather: import('@/types/shared.types').WeatherType
): Map<WarriorId, Warrior> {
  if (!assignment.skill) return currentRoster;
  const { updatedWarrior, result, hardCapped } = processSkillDrillTraining(
    warrior,
    assignment.skill,
    state,
    rng
  );
  if (result.message !== '') {
    results.push(result);
  }
  if (updatedWarrior) {
    currentRoster.set(warrior.id, updatedWarrior);
  }
  if (hardCapped) return currentRoster;
  // Skill drilling still carries injury risk, though slightly lower than attribute training
  const { injury, result: injuryResult } = rollForTrainingInjury(
    updatedWarrior || warrior,
    healingBonus + 1,
    rng,
    weather
  );
  if (injury && injuryResult) {
    const w = currentRoster.get(warrior.id) ?? warrior;
    currentRoster.set(warrior.id, { ...w, injuries: [...w.injuries, injury] as InjuryData[] });
    results.push(injuryResult);
  }
  return currentRoster;
}

/**
 * Helper to process the attribute training assignment.
 */
function processAttributeAssignment(
  assignment: TrainingAssignment,
  warrior: Warrior,
  healingBonus: number,
  currentRoster: Map<WarriorId, Warrior>,
  results: TrainingResult[],
  state: GameState,
  seasonalGrowth: SeasonalGrowth[],
  rng: IRNGService,
  weather: import('@/types/shared.types').WeatherType
): { currentRoster: Map<WarriorId, Warrior>; seasonalGrowth: SeasonalGrowth[] } {
  const attr = assignment.attribute;
  if (!attr) return { currentRoster, seasonalGrowth };

  const { updatedWarrior, updatedSeasonalGrowth, result, hardCapped } = processAttributeTraining(
    warrior,
    attr,
    state,
    seasonalGrowth,
    rng
  );

  if (result.message !== '') {
    results.push(result);
  }

  if (updatedWarrior) {
    currentRoster.set(warrior.id, updatedWarrior);
  }

  let growth = seasonalGrowth;
  if (updatedSeasonalGrowth) {
    growth = updatedSeasonalGrowth;
  }

  // Skip injury rolls if training was blocked/capped
  if (hardCapped || (result.type === 'blocked' && result.message !== '')) {
    return { currentRoster, seasonalGrowth: growth };
  }

  // ── Training Injury Roll ──
  const { injury, result: injuryResult } = rollForTrainingInjury(
    updatedWarrior || warrior,
    healingBonus,
    rng,
    weather
  );
  if (injury && injuryResult) {
    const w = currentRoster.get(warrior.id) ?? warrior;
    currentRoster.set(warrior.id, { ...w, injuries: [...w.injuries, injury] as InjuryData[] });
    results.push(injuryResult);
  }

  return { currentRoster, seasonalGrowth: growth };
}

/**
 * Compute the impact of training assignments for the current week.
 * Returns a pure impact object without modifying game state directly.
 *
 * @param state - The current game state
 * @param rng - RNG service
 * @param weather - Current weather conditions (affects injury risk)
 * @returns A TrainingImpact object containing roster and growth updates
 */
export function computeTrainingImpact(
  state: GameState,
  rng: IRNGService,
  weather: import('@/types/shared.types').WeatherType = 'Clear'
): TrainingImpact {
  if (!state.trainingAssignments || state.trainingAssignments.length === 0) {
    return {
      updatedRoster: state.roster,
      updatedSeasonalGrowth: state.seasonalGrowth ? [...state.seasonalGrowth] : [],
      results: [],
    };
  }

  const results: TrainingResult[] = [];
  let currentRoster = new Map<WarriorId, Warrior>(state.roster.map((w) => [w.id, w]));
  let seasonalGrowth = [...(state.seasonalGrowth ?? [])];
  const healingBonus = getHealingTrainerBonus(state.trainers ?? []);

  for (const assignment of state.trainingAssignments) {
    const warrior = currentRoster.get(assignment.warriorId);
    if (!warrior) continue;

    // ── Recovery Mode ──
    if (assignment.type === 'recovery') {
      currentRoster = processRecoveryAssignment(warrior, healingBonus, currentRoster, results);
      continue;
    }

    // ── Skill Drilling ──
    if (assignment.type === 'skillDrill') {
      currentRoster = processSkillDrillAssignment(
        assignment,
        warrior,
        healingBonus,
        currentRoster,
        results,
        state,
        rng,
        weather
      );
      continue;
    }

    // ── Trait Training (multi-week) ──
    if (assignment.type === 'trait') {
      const remaining = (assignment.weeksRemaining ?? 1) - 1;
      if (remaining > 0) continue; // still training; survives finalizeState
      const trainer = (state.trainers ?? []).find((t) => t.id === assignment.trainerId);
      if (!trainer) continue;
      const roll = rollTraitTraining(warrior, trainer, rng);
      if (roll.outcome !== 'none' && roll.traitId) {
        const updated = { ...warrior, traits: [...(warrior.traits ?? []), roll.traitId] };
        currentRoster.set(warrior.id, updated);
        results.push({
          warriorId: warrior.id,
          type: 'gain',
          message:
            roll.outcome === 'success'
              ? `${warrior.name} learned a new trait: ${TRAITS[roll.traitId]?.name}.`
              : `${warrior.name}'s training went wrong — gained a flaw: ${TRAITS[roll.traitId]?.name}.`,
        });
      } else {
        results.push({
          warriorId: warrior.id,
          type: 'gain',
          message: `${warrior.name}'s trait training yielded nothing.`,
        });
      }
      continue;
    }

    // ── Attribute Training ──
    const outcome = processAttributeAssignment(
      assignment,
      warrior,
      healingBonus,
      currentRoster,
      results,
      state,
      seasonalGrowth,
      rng,
      weather
    );
    currentRoster = outcome.currentRoster;
    seasonalGrowth = outcome.seasonalGrowth;
  }

  return {
    updatedRoster: Array.from(currentRoster.values()),
    updatedSeasonalGrowth: seasonalGrowth,
    results,
  };
}

/**
 * Convert a TrainingImpact to a generic StateImpact for the simulation pipeline.
 *
 * @param state - The current game state
 * @param impact - The training impact to convert
 * @param rng - RNG service for ID generation
 * @returns StateImpact and seasonal growth results
 */
export function trainingImpactToStateImpact(
  state: GameState,
  impact: TrainingImpact,
  rng: IRNGService
): { impact: StateImpact; seasonalGrowth: SeasonalGrowth[]; results: TrainingResult[] } {
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const seasonalGrowth = impact.updatedSeasonalGrowth ? [...impact.updatedSeasonalGrowth] : [];

  const originalById = new Map<WarriorId, Warrior>(state.roster.map((r) => [r.id, r]));
  impact.updatedRoster.forEach((w) => {
    const original = originalById.get(w.id);
    if (original && original !== w) {
      // 🛠️ 1.0 Hardening: Return ONLY changed fields to avoid overwriting Aging/Health passes
      const delta: Partial<Warrior> = {
        attributes: w.attributes,
        baseSkills: w.baseSkills,
        derivedStats: w.derivedStats,
        fatigue: w.fatigue ?? 0,
        injuries: w.injuries,
        traits: w.traits,
      };

      rosterUpdates.set(w.id, delta);
    }
  });

  const newsItems = impact.results.reduce<string[]>((acc, r) => {
    if (r.type !== 'blocked') acc.push(r.message);
    return acc;
  }, []);

  return {
    impact: {
      rosterUpdates,
      newsletterItems:
        newsItems.length > 0
          ? [
              {
                id: rng.uuid('newsletter'), // 🆔 Schema compliance: add ID
                week: state.week,
                title: 'Training Report',
                items: newsItems,
              },
            ]
          : [],
      trainingAssignments: (state.trainingAssignments ?? []).filter((a) => a.type === 'trait'),
    },
    seasonalGrowth,
    results: impact.results,
  };
}
