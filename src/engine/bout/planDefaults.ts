import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';
import { defaultStylePreset } from './stylePresets';

/**
 * Returns a sane default plan for a warrior based on their fighting style.
 * Uses the per-style preset (first preset for each style) as the base,
 * then applies per-warrior derivations (feintTendency from WT).
 */
export function defaultPlanForWarrior(warrior: Warrior): FightPlan {
  const style = warrior.style;
  const presetPlan = defaultStylePreset(style).plan;

  const feintTendency =
    warrior.attributes.WT >= 15 ? Math.min(10, Math.floor((warrior.attributes.WT - 14) * 1.5)) : 0;

  return {
    ...presetPlan,
    feintTendency,
  };
}
