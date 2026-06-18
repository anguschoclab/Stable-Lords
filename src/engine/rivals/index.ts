/**
 * Rivals Module - Re-exports from split rival modules
 */

// Re-export from split modules
export { getStableTemplates, generateRivalStables } from './rivalStableFactory';
export { biasedAttrs, createRivalWarrior } from './rivalWarriorFactory';
export { generateStableTrainers } from './rivalTrainerFactory';
export { pickRivalOpponent, generateRivalryNarrative, calculateRivalryScore } from './rivalUtils';
