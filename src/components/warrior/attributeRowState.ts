import { computeGainChance } from '@/engine/training';
import { canGrow } from '@/engine/potential';
import {
  ATTRIBUTE_TRAINING,
  ATTRIBUTE_TOTAL_CAP,
  SEASONAL_GAINS,
  ATTRIBUTE_NEAR_CEILING_BUFFER,
} from '@/constants/training';
import type { Warrior, Attributes, TrainingAssignment } from '@/types/game';
import type { Trainer } from '@/types/shared.types';

/**
 * Defines the shape of attribute row input.
 */
export interface AttributeRowInput {
  warrior: Warrior;
  key: keyof Attributes;
  assignment?: TrainingAssignment;
  seasonalGains: Partial<Record<keyof Attributes, number>>;
  trainers: Trainer[];
  atCap: boolean;
}

/**
 * Defines the shape of attribute row state.
 */
export interface AttributeRowState {
  val: number;
  isSZ: boolean;
  maxed: boolean;
  seasonCapped: boolean;
  isRevealed: boolean;
  potVal: number;
  ceilingHit: boolean;
  nearCeiling: boolean;
  isSelected: boolean;
  disabled: boolean;
  lockReason: string | null;
  chance: number;
}

/**
 * Derives a row's trainability state from the warrior and assignment context.
 */
export function getAttributeRowState({
  warrior,
  key,
  assignment,
  seasonalGains,
  trainers,
  atCap,
}: AttributeRowInput): AttributeRowState {
  const val = warrior.attributes[key];
  const isSelected = assignment?.type === 'attribute' && assignment?.attribute === key;
  const maxed = val >= ATTRIBUTE_TRAINING.MAX_VALUE;
  const isSZ = key === 'SZ';
  const seasonCapped = (seasonalGains[key] ?? 0) >= SEASONAL_GAINS.CAP;
  const isRevealed = !!warrior.potentialRevealed?.[key];
  const potVal = warrior.potential?.[key] ?? ATTRIBUTE_TRAINING.MAX_VALUE;
  const ceilingHit = !canGrow(val, warrior.potential?.[key]);
  const nearCeiling = isRevealed && val >= potVal - ATTRIBUTE_NEAR_CEILING_BUFFER;
  const disabled = !!assignment || maxed || atCap || isSZ || seasonCapped || ceilingHit;

  const lockReason = isSZ
    ? 'Size is fixed'
    : maxed
      ? `Attribute max (${ATTRIBUTE_TRAINING.MAX_VALUE})`
      : ceilingHit
        ? 'At potential ceiling'
        : atCap
          ? `Total stat cap (${ATTRIBUTE_TOTAL_CAP}) reached`
          : seasonCapped
            ? `Seasonal cap (${SEASONAL_GAINS.CAP}/${SEASONAL_GAINS.CAP} this season)`
            : null;

  const chance =
    !isSZ && !maxed && !atCap && !seasonCapped && !ceilingHit
      ? Math.round(computeGainChance(warrior, key, trainers) * 100)
      : 0;

  return {
    val,
    isSZ,
    maxed,
    seasonCapped,
    isRevealed,
    potVal,
    ceilingHit,
    nearCeiling,
    isSelected,
    disabled,
    lockReason,
    chance,
  };
}
