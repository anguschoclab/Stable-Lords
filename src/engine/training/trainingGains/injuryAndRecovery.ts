import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { generateId } from '@/utils/idUtils';
import type { WeatherType, InjuryId } from '@/types/shared.types';
import {
  BASE_TRAINING_INJURY_CHANCE,
  INJURY_CHANCE_MIN,
  INJURY_CHANCE_MAX,
  TRAINING_INJURIES,
} from './constants';
import type { TrainingResult } from './types';

export function rollForTrainingInjury(
  warrior: Warrior,
  healingBonus: number,
  rng: IRNGService,
  weather: WeatherType = 'Clear'
): { injury: InjuryData | null; result: TrainingResult | null } {
  const age = warrior.age ?? 18;
  const agePenalty = age > 30 ? (age - 30) * 0.005 : 0;
  const healReduce = healingBonus * 0.01;

  // Weather Modifiers
  let weatherMod = 0;
  if (weather === 'Rainy') weatherMod = 0.02;
  if (weather === 'Gale') weatherMod = 0.03;
  if (weather === 'Sandstorm') weatherMod = 0.01;
  if (weather === 'Breezy') weatherMod = -0.01;

  const injuryChance = Math.max(
    INJURY_CHANCE_MIN,
    Math.min(INJURY_CHANCE_MAX, BASE_TRAINING_INJURY_CHANCE + agePenalty - healReduce + weatherMod)
  );

  if (rng.next() < injuryChance) {
    const template = rng.pick(TRAINING_INJURIES);
    const [minW, maxW] = template.weeksRange;
    const weeks = rng.roll(minW || 1, (maxW ?? (minW || 1)) + 1);
    const injury: InjuryData = {
      id: generateId() as InjuryId,
      name: template.name,
      description: template.description,
      severity: 'Minor',
      weeksRemaining: Math.max(1, weeks - healingBonus),
      penalties: template.penalties,
    };

    return {
      injury,
      result: {
        type: 'injury',
        warriorId: warrior.id,
        message: `${warrior.name} suffered a ${template.name} during training! (${injury.weeksRemaining} week recovery)`,
      },
    };
  }

  return { injury: null, result: null };
}

export function processRecovery(
  warrior: Warrior,
  healingBonus: number
): { updatedInjuries: InjuryData[]; message: string } {
  if ((warrior.injuries || []).length === 0) {
    return {
      updatedInjuries: warrior.injuries as InjuryData[],
      message: `${warrior.name} rested but has no injuries to heal.`,
    };
  }

  // Heal 1 + healingBonus weeks of recovery per actual week
  const healAmount = 1 + healingBonus;
  const updatedInjuries = warrior.injuries
    .map((i) => {
      if (typeof i === 'string') return i;
      return { ...i, weeksRemaining: Math.max(0, i.weeksRemaining - healAmount) };
    })
    .filter((i): i is InjuryData => {
      if (typeof i === 'string') return false; // Clean up legacy string injuries if any
      return i.weeksRemaining > 0;
    });

  return {
    updatedInjuries,
    message: `${warrior.name} underwent active recovery (${healAmount} weeks of healing).`,
  };
}
