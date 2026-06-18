/**
 * Narrative Module - Re-exports from split narrative modules
 */

// Re-export from split modules
export {
  interpolateTemplate,
  getStrikeSeverity,
  getFromArchive,
  richHitLocation,
  type CombatContext,
} from './narrativePBPUtils';
export { generateWarriorIntro, battleOpener, type WarriorIntroData } from './narrativeIntro';
export {
  narrateAttack,
  narratePassive,
  narrateParry,
  narrateDodge,
  narrateCounterstrike,
  narrateHit,
  narrateParryBreak,
  narrateInitiative,
} from './narrativeCombat';
export {
  damageSeverityLine,
  stateChangeLine,
  fatigueLine,
  crowdReaction,
  minuteStatusLine,
} from './narrativeStatus';
export {
  narrateBoutEnd,
  popularityLine,
  skillLearnLine,
  tradingBlowsLine,
  stalemateLine,
  tauntLine,
  conservingLine,
} from './narrativePostBout';
export {
  RANGE_NAMES,
  narrateRangeShift,
  narrateFeint,
  narrateZoneShift,
  arenaIntroLine,
  tacticStreakLine,
  pressingLine,
  narrateInsightHint,
} from './narrativePositioning';
