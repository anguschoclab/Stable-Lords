/**
 * Trainer tier type.
 */
export type TrainerTier = 'Novice' | 'Seasoned' | 'Master';

/**
 * Trainer focus type.
 */
export type TrainerFocus = 'Aggression' | 'Defense' | 'Endurance' | 'Mind' | 'Healing';

/**
 * Trainer specialty type.
 */
export type TrainerSpecialty =
  | 'KillerInstinct' // Aggression: kill-window bonus when enemy HP < 40%
  | 'IronConditioning' // Endurance: stamina drain −10% in LATE phase
  | 'CounterFighter' // Defense: riposte damage +15% after successful parry
  | 'Footwork' // Defense: initiative +3 in MID/LATE phase
  | 'IronGuard' // Defense: damage taken −10% while endurance > 60%
  | 'Finisher' // Aggression: ATT +10% when momentum >= 2
  | 'RopeADope';
