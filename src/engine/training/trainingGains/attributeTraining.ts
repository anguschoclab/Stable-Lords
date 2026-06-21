import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { type Attributes, ATTRIBUTE_KEYS, ATTRIBUTE_MAX } from '@/types/shared.types';
import type { SeasonalGrowth } from '@/types/state.types';
import { canGrow, diminishingReturnsFactor } from '@/engine/potential';
import { computeWarriorStats } from '@/engine/skillCalc';
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
  const agePenalty = (warrior.age ?? 18) > 25 ? ((warrior.age ?? 18) - 25) * 0.02 : 0;
  const hasInjury = warrior.injuries.length > 0;
  const injuryPenalty = hasInjury ? 0.1 : 0;

  const potentialVal = warrior.potential?.[attribute];
  const drFactor = diminishingReturnsFactor(warrior.attributes[attribute], potentialVal);

  const raw = (BASE_GAIN_CHANCE + trainerBonus + wtBonus - agePenalty - injuryPenalty) * drFactor;
  return Math.max(GAIN_CHANCE_MIN, Math.min(GAIN_CHANCE_MAX, raw));
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
): {
  updatedWarrior: Warrior | null;
  updatedSeasonalGrowth: SeasonalGrowth[] | null;
  result: TrainingResult;
  hardCapped?: boolean;
} {
  // SZ cannot be trained
  if (attr === 'SZ') {
    return {
      updatedWarrior: null,
      updatedSeasonalGrowth: null,
      result: {
        type: 'blocked',
        warriorId: warrior.id,
        message: `${warrior.name} cannot train Size — it is fixed at creation.`,
      },
    };
  }

  const currentVal = warrior.attributes[attr];
  const potentialVal = warrior.potential?.[attr];
  const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0);

  // Hard caps
  if (currentVal >= ATTRIBUTE_MAX || total >= TOTAL_CAP)
    return {
      updatedWarrior: null,
      updatedSeasonalGrowth: null,
      result: { type: 'blocked', warriorId: warrior.id, message: '' },
      hardCapped: true,
    };
  if (!canGrow(currentVal, potentialVal))
    return {
      updatedWarrior: null,
      updatedSeasonalGrowth: null,
      result: { type: 'blocked', warriorId: warrior.id, message: '' },
      hardCapped: true,
    };

  // Seasonal growth cap
  const seasonGains = getSeasonalGains(seasonalGrowth, warrior.id, state.season);
  if ((seasonGains[attr] ?? 0) >= SEASONAL_CAP_PER_ATTR) {
    return {
      updatedWarrior: null,
      updatedSeasonalGrowth: null,
      result: {
        type: 'blocked',
        warriorId: warrior.id,
        message: `${warrior.name} has reached the seasonal cap for ${attr} (${SEASONAL_CAP_PER_ATTR} gains this season).`,
      },
    };
  }

  // Compute gain chance with all modifiers
  const gainChance = computeGainChance(warrior, attr, state.trainers ?? []);

  // Roll for gain
  const roll = rng.next();
  if (roll < gainChance) {
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

    const updatedWarrior = {
      ...warrior,
      attributes: newAttrs,
      baseSkills,
      derivedStats,
      potentialRevealed: newRevealed,
    };
    const updatedSeasonalGrowth = updateSeasonalGains(
      seasonalGrowth,
      warrior.id,
      state.season,
      attr
    );

    return {
      updatedWarrior,
      updatedSeasonalGrowth,
      result: {
        type: 'gain',
        warriorId: warrior.id,
        attr,
        gain: 1,
        message: `${warrior.name} improved ${attr} to ${currentVal + 1} through training.${ceilingNote}${newlyRevealed ? ` Their true potential in ${attr} is now fully revealed!` : ''}`,
      },
    };
  } else {
    // Failed to gain, but might still reveal potential from hard work!
    const isRevealed = warrior.potentialRevealed?.[attr];
    if (!isRevealed && rng.next() < 0.2) {
      const newRevealed = { ...(warrior.potentialRevealed || {}), [attr]: true };
      return {
        updatedWarrior: { ...warrior, potentialRevealed: newRevealed },
        updatedSeasonalGrowth: null,
        result: {
          type: 'gain',
          warriorId: warrior.id,
          message: `${warrior.name} didn't improve their ${attr} this week, but their true potential in it was revealed from their efforts!`,
        },
      };
    }
  }

  return {
    updatedWarrior: null,
    updatedSeasonalGrowth: null,
    result: { type: 'blocked', warriorId: warrior.id, message: '' },
  };
}
