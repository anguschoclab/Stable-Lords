/**
 * Style Identity - Narrative flags for each fighting style
 */
import { FightingStyle } from '@/types/shared.types';
import type { StyleIdentity } from './types';

/**
 * Style_identity.
 */
export const STYLE_IDENTITY: Record<FightingStyle, StyleIdentity> = {
  [FightingStyle.AimedBlow]: {
    voice: 'Surgical',
    attackFreq: 'Sparing',
    killBias: 'Methodical',
    fatigueBurn: 'Low',
    tagline: 'patient surgeon of the arena',
  },
  [FightingStyle.BashingAttack]: {
    voice: 'Brutal',
    attackFreq: 'Relentless',
    killBias: 'Savage',
    fatigueBurn: 'Moderate',
    tagline: 'wall-breaker with the weight of a storm',
  },
  [FightingStyle.LungingAttack]: {
    voice: 'Explosive',
    attackFreq: 'Measured',
    killBias: 'Opportunistic',
    fatigueBurn: 'High',
    tagline: 'sudden-strike specialist',
  },
  [FightingStyle.ParryLunge]: {
    voice: 'Cunning',
    attackFreq: 'Measured',
    killBias: 'Opportunistic',
    fatigueBurn: 'Moderate',
    tagline: 'counter-strike technician',
  },
  [FightingStyle.ParryRiposte]: {
    voice: 'Fortified',
    attackFreq: 'Sparing',
    killBias: 'Methodical',
    fatigueBurn: 'Low',
    tagline: 'iron bulwark, waiting for the error',
  },
  [FightingStyle.ParryStrike]: {
    voice: 'Cunning',
    attackFreq: 'Measured',
    killBias: 'Methodical',
    fatigueBurn: 'Moderate',
    tagline: 'coiled counter-striker',
  },
  [FightingStyle.StrikingAttack]: {
    voice: 'Flowing',
    attackFreq: 'Measured',
    killBias: 'Methodical',
    fatigueBurn: 'Moderate',
    tagline: 'rhythmic striker, reading the tempo',
  },
  [FightingStyle.SlashingAttack]: {
    voice: 'Flowing',
    attackFreq: 'Relentless',
    killBias: 'Savage',
    fatigueBurn: 'Moderate',
    tagline: 'whirl of razored arcs',
  },
  [FightingStyle.WallOfSteel]: {
    voice: 'Fortified',
    attackFreq: 'Sparing',
    killBias: 'Methodical',
    fatigueBurn: 'High',
    tagline: 'unmoving bastion of blade and brace',
  },
  [FightingStyle.TotalParry]: {
    voice: 'Fortified',
    attackFreq: 'Sparing',
    killBias: 'Opportunistic',
    fatigueBurn: 'Low',
    tagline: 'immovable defender, drawing mistakes from the foe',
  },
};

/**
 * Retrieves the narrative identity (voice, tone, tagline) for a fighting style.
 */
export function getStyleIdentity(style: FightingStyle): StyleIdentity {
  return STYLE_IDENTITY[style];
}
