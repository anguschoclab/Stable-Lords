import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { TickOrchestrator } from './TickOrchestrator';

/**
 * Stable Lords — Daily Progression
 * Delegates to the Unified Tick Orchestrator.
 */
export async function advanceDay(state: GameState, _rng?: IRNGService): Promise<GameState> {
  return TickOrchestrator.advanceDay(state);
}
