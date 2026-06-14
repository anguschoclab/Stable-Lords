/**
 * State Impact System
 * Re-exports from the impacts subdirectory.
 */

// Types
export type { StateImpact, ImpactHandler, GameState } from './types';

// Domain handlers
export { economyHandlers } from './economy';
export { warriorsHandlers } from './warriors';
export { worldHandlers } from './world';
export { promotersHandlers } from './promoters';
export { tournamentsHandlers } from './tournaments';
export { trainingHandlers } from './training';
export { arenaHandlers } from './arena';
export { narrativeHandlers } from './narrative';
export { rivalsHandlers } from './rivals';
export { socialHandlers } from './social';
export { awardsHandlers } from './awards';

// Main functions
export { resolveImpacts, mergeImpacts } from './impactSystem';
