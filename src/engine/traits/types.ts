import type { FightingStyle } from '@/types/shared.types';
import type { Archetype } from '@/data/names/archetypeNames';

/**
 *
 */
export type TraitTier = 'Common' | 'Notable' | 'Exceptional' | 'Signature' | 'Flaw';
/**
 *
 */
export type TraitSign = 'positive' | 'negative';
/**
 *
 */
export type TraitId = string;

/**
 * Defines the shape of trait effect.
 */
export interface TraitEffect {
  // Static skill mods (applied at fighterState build)
  attMod?: number;
  parMod?: number;
  defMod?: number;
  iniMod?: number;
  ripMod?: number;
  decMod?: number;
  dmgBonus?: number;
  enduranceMult?: number;

  // Conditional mods (evaluated each exchange against context)
  attModLowHp?: number; // attacker HP < 0.5
  defModLowHp?: number; // defender HP < 0.5
  parModHighHp?: number; // own HP > 0.75
  defModEarly?: number; // OPENING phase
  iniModEarly?: number; // OPENING phase
  attModEarly?: number; // OPENING phase
  defModLate?: number; // LATE phase
  attModLate?: number; // LATE phase
  parModLate?: number; // LATE phase
  iniModFresh?: number; // own endurance > 0.7
  killWindowBonus?: number; // adds directly to kill threshold

  // Special: kill-streak / hit-streak based
  attModConsecutiveHits?: number; // when consecutiveHits >= 2

  // Personality / Combat AI modifiers (from FTUE)
  fightPlanMod?: Partial<import('@/types/shared.types').FightPlan>;
  attrBonus?: Partial<import('@/types/shared.types').Attributes>;
}

/**
 * Defines the shape of trait def.
 */
export interface TraitDef {
  id: string;
  name: string;
  description: string;
  effect: TraitEffect;
  /** 0-1; lower = rarer. Weighted random pool. */
  weight: number;
  /** Archetypes this trait synergizes with (2× pick weight). */
  synergy?: Archetype[];
  /** Archetypes this trait clashes with (0.3× pick weight). */
  antiSynergy?: Archetype[];
  /** Power-budget tier, mirroring potential's RecruitTier ladder. 'Flaw' ⇒ negative. */
  tier: TraitTier;
  /** Whether the net effect helps or hurts. Flaws are always 'negative'. */
  sign: TraitSign;
  /** If present, the trait is class-restricted: only warriors of these styles
   *  can roll/train it, and it only appears in matching trainers' pools. */
  styles?: FightingStyle[];
}
