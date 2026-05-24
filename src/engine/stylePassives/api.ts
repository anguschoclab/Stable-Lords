/**
 * Style Passives API - Public API functions for style-specific combat behaviors
 */
import { FightingStyle } from '@/types/shared.types';
import type { Phase, StylePassiveContext, KillContext, StylePassiveResult, KillMechanic } from './types';
import { STYLES } from './strategies';
import { getMastery } from './mastery';

/**
 * Gets the phase-specific initiative/tempo bonus for a fighting style.
 */
export function getTempoBonus(style: FightingStyle, phase: Phase): number {
  const t = STYLES[style]?.tempo;
  if (!t) return 0;
  return phase === 'OPENING' ? t.opening : phase === 'MID' ? t.mid : t.late;
}

/**
 * Gets the endurance consumption multiplier for a fighting style.
 */
export function getEnduranceMult(style: FightingStyle): number {
  return STYLES[style]?.tempo.enduranceMult ?? 1.0;
}

/**
 * Computes active combat passive modifiers for a style based on exchange context.
 */
export function getStylePassive(
  style: FightingStyle,
  context: StylePassiveContext & { totalFights?: number }
): StylePassiveResult {
  const m = getMastery(context.totalFights ?? 0);
  const strategy = STYLES[style];
  if (!strategy) return { attBonus: 0, parBonus: 0, defBonus: 0, ripBonus: 0, dmgBonus: 0, critChance: 0, iniBonus: 0, mastery: m.tier };
  return strategy.getPassive(context, m);
}

/**
 * Computes kill-threshold modifiers and narrative for a style.
 */
export function getKillMechanic(attackerStyle: FightingStyle, context: KillContext): KillMechanic {
  const strategy = STYLES[attackerStyle];
  if (!strategy)
    return {
      killBonus: 0,
      decBonus: 0,
      extendedKillWindow: false,
      killWindowHpMult: 0.3,
      killNarrative: 'strikes home!',
    };
  return strategy.getKillMechanic(context);
}

/**
 * Calculates anti-synergy penalties for choosing incompatible tactics for a style.
 */
export function getStyleAntiSynergy(
  style: FightingStyle,
  offTactic?: string,
  defTactic?: string
): { offMult: number; defMult: number; warning?: string } {
  const strategy = STYLES[style];
  if (!strategy) return { offMult: 1.0, defMult: 1.0 };
  return strategy.getAntiSynergy(offTactic, defTactic);
}
