import * as Comlink from 'comlink';
import { advanceWeek } from './pipeline/services/weekPipelineService';
import { advanceDay } from './dayPipeline';
import { createFreshState } from './factories/gameStateFactory';
import { TournamentSelectionService } from './matchmaking/tournamentSelection';

/**
 * Stable Lords — Engine Worker
 * Offloads heavy simulation and logic processing to a background thread.
 */
const engine = {
  advanceWeek,
  advanceDay,
  resolveTournamentRound: TournamentSelectionService.resolveRound.bind(TournamentSelectionService),
  createFreshState,
};/**
 * Engine worker type.
 */


/**
 * Engine worker type.
 */
export type EngineWorker = typeof engine;

Comlink.expose(engine);
