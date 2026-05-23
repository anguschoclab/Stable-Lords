/**
 * Warrior Filtering Utilities
 * Helper functions to classify warriors by characteristics for promoter matching.
 */
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

/** Check if warrior is a "high-kill" type (for Sadistic promoter) */
export function isHighKillWarrior(w: Warrior): boolean {
  return w.career.kills > 3 || w.style === FightingStyle.BashingAttack;
}

/** Check if warrior has injury-prone characteristics */
export function hasInjuryRisk(w: Warrior): boolean {
  return (w.injuries || []).some(
    (i) => i.severity === 'Moderate' || i.severity === 'Severe' || i.severity === 'Critical'
  );
}

/** Check if warrior is "showy" (for Flashy promoter) */
export function isShowyWarrior(w: Warrior): boolean {
  const showyStyles = [
    FightingStyle.LungingAttack,
    FightingStyle.AimedBlow,
    FightingStyle.ParryLunge,
  ];
  return showyStyles.includes(w.style) || w.fame > 75;
}
