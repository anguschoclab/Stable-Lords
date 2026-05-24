/**
 * Style Passives Types - Type definitions for style-specific combat behaviors
 */
import { FightingStyle } from '@/types/shared.types';

/**
 * Phase type.
 */
export type Phase = 'OPENING' | 'MID' | 'LATE';

/**
 * Defines the shape of style passive result.
 */
export interface StylePassiveResult {
  attBonus: number;
  parBonus: number;
  defBonus: number;
  ripBonus: number;
  dmgBonus: number;
  critChance: number;
  iniBonus: number;
  mastery: MasteryTier;
  hasPassiveNarrative?: boolean;
  narrative?: string;
}

/**
 * Defines the shape of kill mechanic.
 */
export interface KillMechanic {
  killBonus: number;
  decBonus: number;
  extendedKillWindow: boolean;
  killWindowHpMult: number;
  killNarrative: string;
}

/**
 * Defines the shape of style strategy.
 */
export interface StyleStrategy {
  tempo: {
    opening: number;
    mid: number;
    late: number;
    enduranceMult: number;
  };
  getPassive: (context: StylePassiveContext, mastery: MasteryInfo) => StylePassiveResult;
  getKillMechanic: (context: KillContext) => KillMechanic;
  getAntiSynergy: (
    offTactic?: string,
    defTactic?: string
  ) => { offMult: number; defMult: number; warning?: string };
}

/**
 * Defines the shape of style passive context.
 */
export interface StylePassiveContext {
  phase: Phase;
  exchange: number;
  hitsLanded: number;
  hitsTaken: number;
  ripostes: number;
  consecutiveHits: number;
  hpRatio: number;
  endRatio: number;
  opponentStyle: FightingStyle;
  targetedLocation?: string;
}

/**
 * Defines the shape of kill context.
 */
export interface KillContext {
  phase: Phase;
  hitsLanded: number;
  consecutiveHits: number;
  targetedLocation?: string;
  hitLocation: string;
}

/**
 * Style voice type.
 */
export type StyleVoice = 'Surgical' | 'Brutal' | 'Explosive' | 'Fortified' | 'Flowing' | 'Cunning';

/**
 * Attack freq type.
 */
export type AttackFreq = 'Sparing' | 'Measured' | 'Relentless';

/**
 * Kill bias type.
 */
export type KillBias = 'Opportunistic' | 'Methodical' | 'Savage';

/**
 * Fatigue burn type.
 */
export type FatigueBurn = 'Low' | 'Moderate' | 'High';

/**
 * Defines the shape of style identity.
 */
export interface StyleIdentity {
  voice: StyleVoice;
  attackFreq: AttackFreq;
  killBias: KillBias;
  fatigueBurn: FatigueBurn;
  /** Short narrative tagline, safe for use in kill-text assembly. */
  tagline: string;
}

/**
 * Mastery tier.
 */
export type MasteryTier = 'Novice' | 'Practiced' | 'Veteran' | 'Master' | 'Grandmaster';

/**
 * Mastery info.
 */
export interface MasteryInfo {
  tier: MasteryTier;
  fights: number;
  bonus: number;
  mult: number;
}
