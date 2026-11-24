/**
 * Warrior Filtering Utilities
 * Helper functions to classify warriors by characteristics for promoter matching.
 */
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { InjuryData } from '@/types/warrior.types';

/** Check if warrior is a "high-kill" type (for Sadistic promoter) */
export function isHighKillWarrior(w: Warrior): boolean {
  return w.career.kills > 3 || w.style === FightingStyle.BashingAttack;
}

const RISK_SEVERITIES = new Set(['Moderate', 'Severe', 'Critical']);

/** Check if warrior has injury-prone characteristics */
export function hasInjuryRisk(w: Warrior): boolean {
  // Single pass ≡ hasInjuryOfSeverity × the three risk severities — a
  // string-typed history entry reads severity → undefined → Set miss, same
  // as the per-severity scans.
  return (w.injuries ?? []).some((i) => RISK_SEVERITIES.has((i as InjuryData).severity as string));
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
