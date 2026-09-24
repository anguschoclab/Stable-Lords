import * as Comlink from 'comlink';
import { advanceWeek } from './pipeline/services/weekPipelineService';
import { createFreshState } from './factories/gameStateFactory';
import { TournamentSelectionService } from './matchmaking/tournamentSelection';
import { TickOrchestrator } from './pipeline/tick/TickOrchestrator';
import { runAutosim } from './autosim';
import { loadCombatNarrative } from '@/data/narrative';
import { createJobQueue } from './jobQueue';
import { configureEnginePool, shutdownEnginePool } from './pool/enginePool';
import type { GameState } from '@/types/state.types';
import type { WeekAdvanceOptions } from './pipeline/services/weekPipelineService';
import type { AutosimOptions } from './autosim';

// Fire-and-forget: start loading combat data when worker initializes
loadCombatNarrative();

/**
 * Stable Lords — Engine Worker
 * Offloads heavy simulation and logic processing to a background thread.
 *
 * All exposed methods run through a single FIFO job queue. Comlink dispatches
 * each message immediately, so without serialization two overlapping calls
 * (e.g. advanceWeek + autosim) would interleave at internal `await` points
 * inside this worker.
 */
const jobs = createJobQueue();

// States arrive via postMessage → structuredClone, so this worker exclusively
// owns them: mutableInput lets the pipeline skip its boundary clone.
const engine = {
  advanceWeek: (state: GameState, opts?: WeekAdvanceOptions) =>
    jobs.enqueue(advanceWeek, state, { ...opts, mutableInput: true }),
  advanceDay: (state: GameState, opts?: WeekAdvanceOptions) =>
    jobs.enqueue(TickOrchestrator.advanceDay, state, { ...opts, mutableInput: true }),
  skipToWeekEnd: (...args: Parameters<typeof TickOrchestrator.skipToWeekEnd>) =>
    jobs.enqueue(TickOrchestrator.skipToWeekEnd, ...args),
  resolveTournamentRound: (...args: Parameters<typeof TournamentSelectionService.resolveRound>) =>
    jobs.enqueue(
      TournamentSelectionService.resolveRound.bind(TournamentSelectionService),
      ...args
    ),
  createFreshState: (...args: Parameters<typeof createFreshState>) =>
    jobs.enqueue(createFreshState, ...args),
  advanceQuarter: (state: GameState, opts?: Parameters<typeof TickOrchestrator.advanceQuarter>[1]) =>
    jobs.enqueue(TickOrchestrator.advanceQuarter, state, { ...opts, mutableInput: true }),
  advanceYear: (state: GameState, opts?: Parameters<typeof TickOrchestrator.advanceYear>[1]) =>
    jobs.enqueue(TickOrchestrator.advanceYear, state, { ...opts, mutableInput: true }),
  skipToQuarterEnd: (
    state: GameState,
    opts?: Parameters<typeof TickOrchestrator.skipToQuarterEnd>[1]
  ) => jobs.enqueue(TickOrchestrator.skipToQuarterEnd, state, { ...opts, mutableInput: true }),
  skipToYearEnd: (state: GameState, opts?: Parameters<typeof TickOrchestrator.skipToYearEnd>[1]) =>
    jobs.enqueue(TickOrchestrator.skipToYearEnd, state, { ...opts, mutableInput: true }),
  // onProgress arrives as a top-level arg (Comlink proxies only work at the
  // top level) and is folded back into options for the in-process engine call.
  runAutosim: (
    state: GameState,
    options: Omit<Parameters<typeof runAutosim>[1], 'onProgress'>,
    onProgress?: AutosimOptions['onProgress']
  ) => jobs.enqueue(runAutosim, state, { ...options, onProgress }),
  /**
   * Configure the shard pool INSIDE this worker (pools are per-context and
   * can't cross postMessage). size <= 1 keeps the sequential in-line path.
   */
  configureEnginePool: (size: number) =>
    jobs.enqueue(() => {
      if (size <= 1) shutdownEnginePool();
      configureEnginePool(size);
      return size;
    }),
};

/**
 * Engine worker type.
 */
export type EngineWorker = typeof engine;

Comlink.expose(engine);
