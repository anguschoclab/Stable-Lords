/**
 * Shared training-attempt executors — the single ruleset both the player's
 * weekly training assignments and the AI roster worker run through
 * (V30-W1.2/W1.3).
 *
 * Gating (same for every stable):
 *  - attribute attempts do NOT roll a training injury when the attempt is
 *    hard-capped or blocked with a message; a silent block still counts as an
 *    attempt (the effort happened)
 *  - skill drills only skip the injury roll on a hard cap — a no-progress
 *    drill still carries injury risk
 *  - drills roll with healingBonus + 1 (lower injury odds than attribute work)
 *  - ambient weather is always forwarded to the injury roll
 */
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { GameState, SeasonalGrowth } from '@/types/state.types';
import type { Attributes, BaseSkills, WeatherType } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  processAttributeTraining,
  processSkillDrillTraining,
  rollForTrainingInjury,
} from '@/engine/training/trainingGains';
import { computeWarriorStats } from '@/engine/warrior/skillCalc';

/**
 * Args for a weekly attribute-training attempt.
 */
export interface RunTrainingAttemptArgs {
  warrior: Warrior;
  attribute: keyof Attributes;
  /** Minimal state view — season + trainers are what the pipeline reads. */
  state: GameState;
  seasonalGrowth: SeasonalGrowth[];
  healingBonus: number;
  weather: WeatherType;
  rng: IRNGService;
}

/**
 * Result of a weekly attribute-training attempt.
 */
export interface TrainingAttemptOutcome {
  /** True when the week's effort counted — injury risk applies. */
  attempted: boolean;
  warrior: Warrior;
  injury: InjuryData | null;
  injuryResult: ReturnType<typeof rollForTrainingInjury>['result'];
  result: ReturnType<typeof processAttributeTraining>['result'];
  seasonalGrowth: SeasonalGrowth[];
}

/**
 * One weekly attribute attempt: progression + weather-aware injury roll,
 * with the player ruleset's injury gate.
 */
export function runTrainingAttempt(args: RunTrainingAttemptArgs): TrainingAttemptOutcome {
  const { warrior, attribute, state, seasonalGrowth, healingBonus, weather, rng } = args;
  const attempt = processAttributeTraining(warrior, attribute, state, seasonalGrowth, rng);

  // Skip the injury roll when the week never happened: hard cap, or a
  // blocked result carrying an explanation. A silent block (empty message)
  // still consumed the week's effort — the roll fires (player ruleset).
  const blockedWithMessage = attempt.result.type === 'blocked' && attempt.result.message !== '';
  const attempted = !attempt.hardCapped && !blockedWithMessage;

  let next = attempt.updatedWarrior ?? warrior;
  let injury: InjuryData | null = null;
  let injuryResult: TrainingAttemptOutcome['injuryResult'] = null;
  if (attempted) {
    const roll = rollForTrainingInjury(next, healingBonus, rng, weather);
    injury = roll.injury;
    injuryResult = roll.result;
    if (injury) next = { ...next, injuries: [...(next.injuries ?? []), injury] };
  }

  if (next !== warrior && attempt.updatedWarrior) {
    const { baseSkills, derivedStats } = computeWarriorStats(next.attributes, next.style);
    next = { ...next, baseSkills, derivedStats };
  }

  return {
    attempted,
    warrior: next,
    injury,
    injuryResult,
    result: attempt.result,
    seasonalGrowth: attempt.updatedSeasonalGrowth ?? seasonalGrowth,
  };
}

/**
 * Args for a weekly skill drill.
 */
export interface RunSkillDrillAttemptArgs {
  warrior: Warrior;
  skill: keyof BaseSkills;
  state: GameState;
  healingBonus: number;
  weather: WeatherType;
  rng: IRNGService;
}

/**
 * Result of a weekly skill drill.
 */
export interface SkillDrillAttemptOutcome {
  attempted: boolean;
  warrior: Warrior;
  injury: InjuryData | null;
  injuryResult: ReturnType<typeof rollForTrainingInjury>['result'];
  result: ReturnType<typeof processSkillDrillTraining>['result'];
}

/**
 * One weekly skill drill: progression + injury roll at healingBonus + 1;
 * only a hard cap gates the roll.
 */
export function runSkillDrillAttempt(args: RunSkillDrillAttemptArgs): SkillDrillAttemptOutcome {
  const { warrior, skill, state, healingBonus, weather, rng } = args;
  const attempt = processSkillDrillTraining(warrior, skill, state, rng);

  // Only a hard cap gates the roll — a no-progress week still carries risk.
  const attempted = !attempt.hardCapped;

  let next = attempt.updatedWarrior ?? warrior;
  let injury: InjuryData | null = null;
  let injuryResult: SkillDrillAttemptOutcome['injuryResult'] = null;
  if (attempted) {
    const roll = rollForTrainingInjury(next, healingBonus + 1, rng, weather);
    injury = roll.injury;
    injuryResult = roll.result;
    if (injury) next = { ...next, injuries: [...(next.injuries ?? []), injury] };
  }

  return {
    attempted,
    warrior: next,
    injury,
    injuryResult,
    result: attempt.result,
  };
}
