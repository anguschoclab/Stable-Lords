// Re-exports from combatNarrators (per-action narrators)
export {
  narrateAttack,
  narratePassive,
  narrateParry,
  narrateDodge,
  narrateCounterstrike,
  narrateHit,
  narrateParryBreak,
  narrateInitiative,
  narrateKnockdown,
  narrateRecovery,
  getEpithet,
  narrateContextLine,
  narrateCrowdReaction,
  narrateTaunt,
  narrateInsightHint,
} from './combatNarrators';

// Re-exports from eventNarrators (per-event-type narrators)
export type { WarriorIntroData } from './eventNarrators';
export { generateWarriorIntro, battleOpener, narrateBoutEnd } from './eventNarrators';

// Backward compatibility object
import {
  narrateAttack,
  narratePassive,
  narrateParry,
  narrateDodge,
  narrateCounterstrike,
  narrateHit,
  narrateParryBreak,
  narrateInitiative,
  narrateKnockdown,
  narrateRecovery,
  getEpithet,
  narrateContextLine,
  narrateCrowdReaction,
  narrateTaunt,
  narrateInsightHint,
} from './combatNarrators';
import { generateWarriorIntro, battleOpener, narrateBoutEnd } from './eventNarrators';

export const CombatNarrator = {
  generateWarriorIntro,
  battleOpener,
  narrateAttack,
  narratePassive,
  narrateParry,
  narrateDodge,
  narrateCounterstrike,
  narrateHit,
  narrateParryBreak,
  narrateInitiative,
  narrateBoutEnd,
  narrateKnockdown,
  narrateRecovery,
  getEpithet,
  narrateContextLine,
  narrateCrowdReaction,
  narrateTaunt,
  narrateInsightHint,
} as const;
