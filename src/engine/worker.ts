import * as Comlink from 'comlink';
import { advanceWeek } from './pipeline/services/weekPipelineService';
import { advanceDay } from './pipeline/tick/dayAdvance';
import { createFreshState } from './factories/gameStateFactory';
import { TournamentSelectionService } from './matchmaking/tournamentSelection';
import { TickOrchestrator } from './pipeline/tick/TickOrchestrator';
import { runAutosim } from './autosim';

/**
 * Stable Lords — Engine Worker
 * Offloads heavy simulation and logic processing to a background thread.
 */
const engine = {
  advanceWeek,
  advanceDay,
  skipToWeekEnd: TickOrchestrator.skipToWeekEnd,
  resolveTournamentRound: TournamentSelectionService.resolveRound.bind(TournamentSelectionService),
  createFreshState,
  advanceQuarter: TickOrchestrator.advanceQuarter,
  advanceYear: TickOrchestrator.advanceYear,
  skipToQuarterEnd: TickOrchestrator.skipToQuarterEnd,
  skipToYearEnd: TickOrchestrator.skipToYearEnd,
  runAutosim,
};

/**
 * Engine worker type.
 */
export type EngineWorker = typeof engine;

Comlink.expose(engine);
