import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { type Attributes, ATTRIBUTE_KEYS, ATTRIBUTE_MAX } from '@/types/shared.types';
import type { SeasonalGrowth } from '@/types/state.types';
import { canGrow, diminishingReturnsFactor } from '@/engine/warrior/potential';
import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { computeTrainerBonus } from '../coachLogic';
import { getSeasonalGains, updateSeasonalGains } from '../facilityUpkeep';
import {
  BASE_GAIN_CHANCE,
  GAIN_CHANCE_MIN,
  GAIN_CHANCE_MAX,
  SEASONAL_CAP_PER_ATTR,
  TOTAL_CAP,
} from './constants';
import type { TrainingResult } from './types';
import { clamp } from '@/utils/math';
import { AGING_PENALTY_START } from '@/constants/combat/combat';
import { warriorDisplayName } from '@/utils/warriorDisplay';

/**
 *
 */
export function computeGainChance(
  warrior: Warrior,
  attribute: keyof Attributes,
  trainers: GameState['trainers']
): number {
  const trainerBonus = computeTrainerBonus(attribute, trainers, warrior.style);
  const wtBonus = ((warrior.attributes.WT ?? 10) - 10) * 0.01;
  const agePenalty = (warrior.age ?? 18) > AGING_PENALTY_START ? ((warrior.age ?? 18) - AGING_PENALTY_START) * 0.02 : 0;
  const hasInjury = warrior.injuries.length > 0;
  const injuryPenalty = hasInjury ? 0.1 : 0;

  const potentialVal = warrior.potential?.[attribute];
  const drFactor = diminishingReturnsFactor(warrior.attributes[attribute], potentialVal);

  const raw = (BASE_GAIN_CHANCE + trainerBonus + wtBonus - agePenalty - injuryPenalty) * drFactor;
  return clamp(raw, GAIN_CHANCE_MIN, GAIN_CHANCE_MAX);
}

type AttributeTrainingOutcome = {
  updatedWarrior: Warrior | null;
  updatedSeasonalGrowth: SeasonalGrowth[] | null;
  result: TrainingResult;
  hardCapped?: boolean;
};

function blockedResult(warrior: Warrior, message = '', hardCapped = false): AttributeTrainingOutcome {
  return {
    updatedWarrior: null,
    updatedSeasonalGrowth: null,
    result: { type: 'blocked', warriorId: warrior.id, message },
    ...(hardCapped ? { hardCapped: true } : {}),
  };
}

/** Successful +1 gain: bump attribute, recompute stats, reveal ceiling if near. */
function applyAttributeGain(
  warrior: Warrior,
  attr: keyof Attributes,
  currentVal: number,
  state: GameState,
  seasonalGrowth: SeasonalGrowth[]
): AttributeTrainingOutcome {
  const potentialVal = warrior.potential?.[attr];
  const newAttrs = { ...warrior.attributes, [attr]: currentVal + 1 };
  const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, warrior.style);

  const newRevealed = { ...(warrior.potentialRevealed || {}) };
  let newlyRevealed = false;

  const nearCeiling = potentialVal !== undefined && currentVal + 1 >= potentialVal;
  if (nearCeiling && !newRevealed[attr]) {
    newRevealed[attr] = true;
    newlyRevealed = true;
  }

  const ceilingNote = nearCeiling ? ' (reached potential ceiling)' : '';

  return {
    updatedWarrior: {
      ...warrior,
      attributes: newAttrs,
      baseSkills,
      derivedStats,
      potentialRevealed: newRevealed,
    },
    updatedSeasonalGrowth: updateSeasonalGains(
      seasonalGrowth,
      warrior.id,
      state.season,
      attr
    ),
    result: {
      type: 'gain',
      warriorId: warrior.id,
      attr,
      gain: 1,
      message: `${warriorDisplayName(warrior)} improved ${attr} to ${currentVal + 1} through training.${ceilingNote}${newlyRevealed ? ` Their true potential in ${attr} is now fully revealed!` : ''}`,
    },
  };
}

/** Failed roll — 20% chance the effort still reveals the attribute's potential. */
function maybeRevealFromEffort(
  warrior: Warrior,
  attr: keyof Attributes,
  rng: IRNGService
): AttributeTrainingOutcome {
  const isRevealed = warrior.potentialRevealed?.[attr];
  if (!isRevealed && rng.next() < 0.2) {
    const newRevealed = { ...(warrior.potentialRevealed || {}), [attr]: true };
    return {
      updatedWarrior: { ...warrior, potentialRevealed: newRevealed },
      updatedSeasonalGrowth: null,
      result: {
        type: 'gain',
        warriorId: warrior.id,
        message: `${warriorDisplayName(warrior)} didn't improve their ${attr} this week, but their true potential in it was revealed from their efforts!`,
      },
    };
  }
  return blockedResult(warrior);
}

/**
 *
 */
export function processAttributeTraining(
  warrior: Warrior,
  attr: keyof Attributes,
  state: GameState,
  seasonalGrowth: SeasonalGrowth[],
  rng: IRNGService
): AttributeTrainingOutcome {
  // SZ cannot be trained
  if (attr === 'SZ') {
    return blockedResult(
      warrior,
      `${warriorDisplayName(warrior)} cannot train Size — it is fixed at creation.`
    );
  }

  const currentVal = warrior.attributes[attr];
  const potentialVal = warrior.potential?.[attr];
  const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0);

  // Hard caps
  if (currentVal >= ATTRIBUTE_MAX || total >= TOTAL_CAP) return blockedResult(warrior, '', true);
  if (!canGrow(currentVal, potentialVal)) return blockedResult(warrior, '', true);

  // Seasonal growth cap
  const seasonGains = getSeasonalGains(seasonalGrowth, warrior.id, state.season);
  if ((seasonGains[attr] ?? 0) >= SEASONAL_CAP_PER_ATTR) {
    return blockedResult(
      warrior,
      `${warriorDisplayName(warrior)} has reached the seasonal cap for ${attr} (${SEASONAL_CAP_PER_ATTR} gains this season).`
    );
  }

  // Compute gain chance with all modifiers
  const gainChance = computeGainChance(warrior, attr, state.trainers ?? []);

  // Roll for gain
  if (rng.next() < gainChance) {
    return applyAttributeGain(warrior, attr, currentVal, state, seasonalGrowth);
  }

  // Failed to gain, but might still reveal potential from hard work!
  return maybeRevealFromEffort(warrior, attr, rng);
}
