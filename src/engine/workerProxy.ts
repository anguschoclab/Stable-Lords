import * as Comlink from 'comlink';
import type { EngineWorker } from './worker';

type AsyncEngine = {
  [K in keyof EngineWorker]: (
    ...args: Parameters<EngineWorker[K]>
  ) => ReturnType<EngineWorker[K]> extends Promise<infer T>
    ? Promise<T>
    : Promise<ReturnType<EngineWorker[K]>>;
};

/**
 * Stable Lords — Engine Worker Proxy
 * In production: offloads simulation to a Web Worker via Comlink.
 * In development: runs engine functions directly on the main thread to avoid
 * the react-refresh/window crash injected by Vite's SWC plugin into workers.
 */
function buildProxy(): AsyncEngine {
  if (import.meta.env.DEV) {
    let cached: EngineWorker | null = null;
    const load = async (): Promise<EngineWorker> => {
      if (cached) return cached;
      const [
        { advanceWeek },
        { advanceDay },
        { createFreshState },
        { TournamentSelectionService },
        { TickOrchestrator },
        { runAutosim },
        { processWeekBouts },
      ] = await Promise.all([
        import('./pipeline/services/weekPipelineService'),
        import('./pipeline/tick/dayAdvance'),
        import('./factories/gameStateFactory'),
        import('./matchmaking/tournamentSelection'),
        import('./pipeline/tick/TickOrchestrator'),
        import('./autosim'),
        import('./bout/services/boutProcessorService'),
      ]);
      cached = {
        advanceWeek,
        advanceDay,
        skipToWeekEnd: TickOrchestrator.skipToWeekEnd,
        createFreshState,
        resolveTournamentRound: TournamentSelectionService.resolveRound.bind(
          TournamentSelectionService
        ),
        advanceQuarter: TickOrchestrator.advanceQuarter,
        advanceYear: TickOrchestrator.advanceYear,
        skipToQuarterEnd: TickOrchestrator.skipToQuarterEnd,
        skipToYearEnd: TickOrchestrator.skipToYearEnd,
        runAutosim,
        processWeekBouts,
      };
      return cached;
    };
    return {
      advanceWeek: async (...args) => (await load()).advanceWeek(...args),
      advanceDay: async (...args) => (await load()).advanceDay(...args),
      skipToWeekEnd: async (...args) => (await load()).skipToWeekEnd(...args),
      createFreshState: async (...args) => (await load()).createFreshState(...args),
      resolveTournamentRound: async (...args) => (await load()).resolveTournamentRound(...args),
      advanceQuarter: async (...args) => (await load()).advanceQuarter(...args),
      advanceYear: async (...args) => (await load()).advanceYear(...args),
      skipToQuarterEnd: async (...args) => (await load()).skipToQuarterEnd(...args),
      skipToYearEnd: async (...args) => (await load()).skipToYearEnd(...args),
      runAutosim: async (...args) => (await load()).runAutosim(...args),
      processWeekBouts: async (...args) => (await load()).processWeekBouts(...args),
    };
  }

  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  return Comlink.wrap<EngineWorker>(worker) as unknown as AsyncEngine;
} /**
 * Engine proxy.
 */

/**
 * Engine proxy.
 */
export const engineProxy = buildProxy();
