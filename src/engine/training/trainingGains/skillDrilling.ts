import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { type BaseSkills } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  SKILL_DRILL_CAP,
  SKILL_DRILL_BASE_CHANCE,
  SKILL_DRILL_GAIN_MIN,
  SKILL_DRILL_GAIN_MAX,
  SKILL_TRAINER_FOCUS,
} from './constants';
import type { TrainingResult } from './types';

/**
 *
 */
export function computeSkillDrillChance(
  warrior: Warrior,
  skill: keyof BaseSkills,
  trainers: GameState['trainers']
): number {
  const focus = SKILL_TRAINER_FOCUS[skill];
  // Lean on trainer focus/affinity: a matching-focus trainer gives a modest boost.
  let trainerBonus = 0;
  for (const t of trainers) {
    if (t.contractWeeksLeft <= 0) continue;
    if (t.focus === focus) {
      // TIER_BONUS lives in engine/trainers; fall back to 1 if unavailable to keep this module self-contained.
      trainerBonus += 1;
    }
    if (t.styleBonusStyle === warrior.style) trainerBonus += 0.5;
  }
  const wtBonus = ((warrior.attributes.WT ?? 10) - 10) * 0.01;
  const agePenalty = (warrior.age ?? 18) > 28 ? ((warrior.age ?? 18) - 28) * 0.02 : 0;
  const current = warrior.skillDrills?.[skill] ?? 0;
  // Diminishing returns: each point already drilled halves the marginal gain chance.
  const dr = Math.pow(0.6, current);
  const raw = (SKILL_DRILL_BASE_CHANCE + trainerBonus * 0.04 + wtBonus - agePenalty) * dr;
  return Math.max(SKILL_DRILL_GAIN_MIN, Math.min(SKILL_DRILL_GAIN_MAX, raw));
}

/**
 *
 */
export function processSkillDrillTraining(
  warrior: Warrior,
  skill: keyof BaseSkills,
  state: GameState,
  rng: IRNGService
): { updatedWarrior: Warrior | null; result: TrainingResult; hardCapped?: boolean } {
  const current = warrior.skillDrills?.[skill] ?? 0;
  if (current >= SKILL_DRILL_CAP) {
    return {
      updatedWarrior: null,
      result: {
        type: 'blocked',
        warriorId: warrior.id,
        message: `${warrior.name} has already mastered ${skill} drilling (cap ${SKILL_DRILL_CAP}).`,
      },
      hardCapped: true,
    };
  }

  const chance = computeSkillDrillChance(warrior, skill, state.trainers ?? []);
  if (rng.next() < chance) {
    const drills = { ...(warrior.skillDrills ?? {}), [skill]: current + 1 };
    return {
      updatedWarrior: { ...warrior, skillDrills: drills },
      result: {
        type: 'gain',
        warriorId: warrior.id,
        message: `${warrior.name} sharpened their ${skill} through focused drilling (+1, now +${current + 1}).`,
      },
    };
  }
  return {
    updatedWarrior: null,
    result: {
      type: 'blocked',
      warriorId: warrior.id,
      message: `${warrior.name} drilled ${skill} but made no measurable progress this week.`,
    },
  };
}
