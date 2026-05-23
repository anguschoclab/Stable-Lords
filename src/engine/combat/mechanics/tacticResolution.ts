import { FightingStyle, type OffensiveTactic, type DefensiveTactic } from '@/types/shared.types';
import type { FightPlan } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';
import {
  suitabilityMultiplier,
  getOffensiveSuitability,
  getDefensiveSuitability,
} from '../../tacticSuitability';
import { OE_ATT_SCALING, OE_DEF_SCALING, AL_INI_SCALING } from './combatConstants';

/**
 * Stable Lords — Tactic & Attr Scaling Resolution
 */

/**
 * Compute OE attack modifier.
 * @param oe - Offensive eagerness value.
 * @param style - Optional fighting style.
 * @returns Attack modifier.
 */
export function oeAttMod(oe: number, style?: FightingStyle): number {
  const isAggressive =
    style === FightingStyle.BashingAttack ||
    style === FightingStyle.SlashingAttack ||
    style === FightingStyle.StrikingAttack;
  const base = Math.floor((oe - 5) * OE_ATT_SCALING);
  return isAggressive ? base + 1 : base;
}

/**
 * Compute OE defense modifier.
 * @param oe - Offensive eagerness value.
 * @returns Defense modifier.
 */
export function oeDefMod(oe: number): number {
  // Canonical: OE 5 = neutral. Low OE = conservative (slight defense bonus).
  // High OE = opens up defenses (escalating penalty). Centered at 5, not 6.
  if (oe <= 5) return Math.floor((5 - oe) * OE_DEF_SCALING);
  return -Math.floor((oe - 5) * OE_DEF_SCALING);
}

/**
 * Compute AL initiative modifier.
 * @param al - Aggressiveness level value.
 * @returns Initiative modifier.
 */
export function alIniMod(al: number): number {
  return Math.floor((al - 5) * AL_INI_SCALING);
}

/** Shape returned by offensive tactic resolution. */
export type OffensiveMods = {
  attBonus: number;
  dmgBonus: number;
  defPenalty: number;
  endCost: number;
  decBonus: number;
  parryBypass: number;
};

const ZERO_OFF: OffensiveMods = {
  attBonus: 0,
  dmgBonus: 0,
  defPenalty: 0,
  endCost: 0,
  decBonus: 0,
  parryBypass: 0,
};

/**
 * Strategy map: each offensive tactic (excluding 'none') maps to a function
 * that accepts the suitability multiplier and returns the resolved mods.
 */
const OFFENSIVE_TACTIC_MAP: Record<Exclude<OffensiveTactic, 'none'>, (mult: number) => OffensiveMods> = {
  Lunge: (mult) => ({
    attBonus: Math.round(2 * mult),
    dmgBonus: 0,
    defPenalty: Math.round(1 * mult),
    endCost: 2,
    decBonus: 0,
    parryBypass: 0,
  }),
  Slash: (mult) => ({
    attBonus: 0,
    dmgBonus: Math.round(2 * mult),
    defPenalty: 0,
    endCost: 1,
    decBonus: 0,
    parryBypass: Math.round(2 * mult),
  }),
  Bash: (mult) => ({
    attBonus: Math.round(1 * mult),
    dmgBonus: Math.round(1 * mult),
    defPenalty: Math.round(2 * mult),
    endCost: 2,
    decBonus: 0,
    parryBypass: Math.round(4 * mult),
  }),
  Decisiveness: (mult) => ({
    attBonus: 0,
    dmgBonus: 0,
    defPenalty: 0,
    endCost: 1,
    decBonus: Math.round(3 * mult),
    parryBypass: 0,
  }),
};

/**
 * Resolve offensive tactic modifiers.
 * @param tactic - Offensive tactic.
 * @param style - Fighting style.
 * @returns Resolved offensive modifiers.
 */
export function getOffensiveTacticMods(tactic: OffensiveTactic | undefined, style: FightingStyle): OffensiveMods {
  if (!tactic || tactic === 'none') return ZERO_OFF;
  const mult = suitabilityMultiplier(getOffensiveSuitability(style, tactic));
  return (OFFENSIVE_TACTIC_MAP[tactic] ?? (() => ZERO_OFF))(mult);
}

/** Shape returned by defensive tactic resolution. */
export type DefensiveMods = {
  parBonus: number;
  defBonus: number;
  ripBonus: number;
  iniBonus: number;
};

const ZERO_DEF: DefensiveMods = { parBonus: 0, defBonus: 0, ripBonus: 0, iniBonus: 0 };

/**
 * Strategy map: each defensive tactic (excluding 'none') maps to a function
 * that accepts the suitability multiplier and returns the resolved mods.
 */
const DEFENSIVE_TACTIC_MAP: Record<Exclude<DefensiveTactic, 'none'>, (mult: number) => DefensiveMods> = {
  Parry: (mult) => ({
    parBonus: Math.round(3 * mult),
    defBonus: 0,
    ripBonus: -Math.round(1 * mult),
    iniBonus: 0,
  }),
  Dodge: (mult) => ({
    parBonus: -Math.round(1 * mult),
    defBonus: Math.round(3 * mult),
    ripBonus: 0,
    iniBonus: 0,
  }),
  Riposte: (mult) => ({
    parBonus: Math.round(1 * mult),
    defBonus: 0,
    ripBonus: Math.round(3 * mult),
    iniBonus: 0,
  }),
  Responsiveness: (mult) => ({ parBonus: 0, defBonus: 0, ripBonus: 0, iniBonus: Math.round(2 * mult) }),
};

/**
 * Resolve defensive tactic modifiers.
 * @param tactic - Defensive tactic.
 * @param style - Fighting style.
 * @returns Resolved defensive modifiers.
 */
export function getDefensiveTacticMods(tactic: DefensiveTactic | undefined, style: FightingStyle): DefensiveMods {
  if (!tactic || tactic === 'none') return ZERO_DEF;
  const mult = suitabilityMultiplier(getDefensiveSuitability(style, tactic));
  return (DEFENSIVE_TACTIC_MAP[tactic] ?? (() => ZERO_DEF))(mult);
}/**
 * Calculate final oeal.
 * @param effOE - Eff oe.
 * @param effAL - Eff al.
 * @param plan - Plan.
 * @param hp - Hp.
 * @param maxHp - Max hp.
 * @param end - End.
 * @param maxEnd - Max end.
 * @param exchange - Exchange.
 * @returns The result.
 */


/**
 * Calculate final oeal.
 * @param effOE - Eff oe.
 * @param effAL - Eff al.
 * @param plan - Plan.
 * @param hp - Hp.
 * @param maxHp - Max hp.
 * @param end - End.
 * @param maxEnd - Max end.
 * @param exchange - Exchange.
 * @returns The result.
 */
export function calculateFinalOEAL(
  effOE: number,
  effAL: number,
  plan: FightPlan,
  hp: number,
  maxHp: number,
  end: number,
  maxEnd: number,
  exchange: number
): [number, number] {
  let openOE = 0,
    openAL = 0;
  if (exchange < 3) {
    if (plan.openingMove === 'Aggressive') {
      openOE = 1;
      openAL = 1;
    } else if (plan.openingMove === 'Safe') {
      openOE = -1;
      openAL = -1;
    }
  }

  let fallOE = 0,
    fallAL = 0;
  if (plan.fallbackCondition === 'FLEE' && hp < maxHp * 0.3) {
    fallOE = -3;
    fallAL = -3;
  } else if (plan.fallbackCondition === 'TURTLE' && end < maxEnd * 0.3) {
    fallOE = -4;
    fallAL = 2;
  } else if (plan.fallbackCondition === 'BERZERK' && hp < maxHp * 0.3) {
    fallOE = 4;
    fallAL = -2;
  }

  const finalOE = Math.max(1, Math.min(10, effOE + openOE + fallOE));
  const finalAL = Math.max(1, Math.min(10, effAL + openAL + fallAL));
  return [finalOE, finalAL];
}
