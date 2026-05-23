/**
 * State Impact System
 * Re-exports from the impacts subdirectory for backward compatibility.
 */

// Types
export type { StateImpact, ImpactHandler, GameState } from './impacts/types';

// Domain handlers
export { economyHandlers } from './impacts/economy';
export { warriorsHandlers } from './impacts/warriors';
export { worldHandlers } from './impacts/world';
export { promotersHandlers } from './impacts/promoters';
export { tournamentsHandlers } from './impacts/tournaments';
export { trainingHandlers } from './impacts/training';
export { arenaHandlers } from './impacts/arena';
export { narrativeHandlers } from './impacts/narrative';
export { rivalsHandlers } from './impacts/rivals';
export { socialHandlers } from './impacts/social';
export { awardsHandlers } from './impacts/awards';

// Main functions
export { resolveImpacts, mergeImpacts } from './impacts/impactSystem';
