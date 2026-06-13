import { ATTRIBUTE_KEYS, type Attributes } from '@/types/shared.types';
import type { Warrior } from '@/types/state.types';
import type { Trainer } from '@/types/shared.types';
import { computeGainChance } from '@/engine/training';
import { ATTRIBUTE_TRAINING, ATTRIBUTE_NEAR_CEILING_BUFFER } from '@/constants/training';

export interface BurnWarning {
  attribute: keyof Attributes;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export function assessBurnRisks(warrior: Warrior, trainers: Trainer[]): BurnWarning[] {
  const warnings: BurnWarning[] = [];
  const age = warrior.age ?? 18;

  for (const key of ATTRIBUTE_KEYS) {
    if (key === 'SZ') continue;

    const val = warrior.attributes[key];
    const pot = warrior.potential?.[key];
    const chance = computeGainChance(warrior, key, trainers);

    if (pot !== undefined) {
      if (val >= pot) {
        warnings.push({
          attribute: key,
          reason: `At potential ceiling (${pot})`,
          severity: 'high',
        });
      } else if (val >= pot - ATTRIBUTE_NEAR_CEILING_BUFFER) {
        warnings.push({
          attribute: key,
          reason: `1 point from ceiling (${pot})`,
          severity: 'medium',
        });
      }
    }

    if (chance < 0.2 && val < ATTRIBUTE_TRAINING.MAX_VALUE) {
      warnings.push({
        attribute: key,
        reason: `Very low gain chance (${Math.round(chance * 100)}%)`,
        severity: 'medium',
      });
    }

    if (age > 30) {
      warnings.push({ attribute: key, reason: `Age penalty active (age ${age})`, severity: 'low' });
    }
  }

  return warnings;
}

export function computeTrainability(warrior: Warrior, trainers: Trainer[]): number {
  let totalChance = 0;
  let trainable = 0;
  for (const key of ATTRIBUTE_KEYS) {
    if (key === 'SZ') continue;
    const val = warrior.attributes[key];
    const pot = warrior.potential?.[key];
    if (val >= 25 || (pot !== undefined && val >= pot)) continue;
    totalChance += computeGainChance(warrior, key, trainers);
    trainable++;
  }
  return trainable > 0 ? Math.round((totalChance / trainable) * 100) : 0;
}
