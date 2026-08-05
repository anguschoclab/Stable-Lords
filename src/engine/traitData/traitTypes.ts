import type { Archetype } from '@/data/names/archetypeNames';
import type { FightingStyle } from '@/types/shared.types';

export type TraitTier = 'Common' | 'Notable' | 'Exceptional' | 'Signature' | 'Flaw';
export type TraitSign = 'positive' | 'negative';

export interface TraitEffect {
  attMod?: number;
  parMod?: number;
  defMod?: number;
  iniMod?: number;
  ripMod?: number;
  decMod?: number;
  dmgBonus?: number;
  enduranceMult?: number;
  attModLowHp?: number;
  defModLowHp?: number;
  parModHighHp?: number;
  defModEarly?: number;
  iniModEarly?: number;
  attModEarly?: number;
  defModLate?: number;
  attModLate?: number;
  parModLate?: number;
  iniModFresh?: number;
  killWindowBonus?: number;
  attModConsecutiveHits?: number;
  fightPlanMod?: Partial<import('@/types/shared.types').FightPlan>;
  attrBonus?: Partial<import('@/types/shared.types').Attributes>;
}

export interface TraitDef {
  id: string;
  name: string;
  description: string;
  effect: TraitEffect;
  weight: number;
  synergy?: Archetype[];
  antiSynergy?: Archetype[];
  tier: TraitTier;
  sign: TraitSign;
  styles?: FightingStyle[];
}
