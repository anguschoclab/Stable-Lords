/**
 * Style-Specific Combat Passives, Tempo, Kill Mechanics & Anti-Synergy
 *
 * This module uses a Strategy Pattern to define style-specific behaviors,
 * eliminating massive switch statements and improving extensibility.
 */

// Re-export from split modules
export type {
  Phase,
  StylePassiveResult,
  KillMechanic,
  StyleStrategy,
  StylePassiveContext,
  KillContext,
} from './stylePassives/types';
export type {
  StyleVoice,
  AttackFreq,
  KillBias,
  FatigueBurn,
  StyleIdentity,
} from './stylePassives/types';
export type { MasteryTier, MasteryInfo } from './stylePassives/types';
export { STYLE_IDENTITY, getStyleIdentity } from './stylePassives/identity';
export { getMastery } from './stylePassives/mastery';
export {
  getTempoBonus,
  getEnduranceMult,
  getStylePassive,
  getKillMechanic,
  getStyleAntiSynergy,
} from './stylePassives/api';
