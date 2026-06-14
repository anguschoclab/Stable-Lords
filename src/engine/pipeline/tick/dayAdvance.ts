import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { TickOrchestrator } from './TickOrchestrator';

/**
 * Stable Lords — Daily Progression
 * Delegates to the Unified Tick Orchestrator.
 */
export function advanceDay(state: GameState, _rng?: IRNGService): GameState {
  return TickOrchestrator.advanceDay(state);
}
