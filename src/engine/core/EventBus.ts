/**
 * A lightweight Event Bus to decouple the engine from reporting and narrative side-effects.
 */

import type { GameState } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';

/**
 * Engine event type.
 */
export type EngineEvent =
  | { type: 'WEEK_ADVANCED'; payload: { week: number; state: GameState } }
  | { type: 'BOUT_COMPLETED'; payload: { summary: FightSummary; transcript?: string[] } }
  | { type: 'WARRIOR_DEATH'; payload: { warriorId: string; name: string } }
  | { type: 'WARRIOR_TRAINED'; payload: { warriorId: string; message: string; isGain: boolean } }
  | { type: 'RIVALRY_ESCALATED'; payload: { stableA: string; stableB: string; reason: string } }
  | { type: 'SEASON_CHANGED'; payload: { prevSeason: string; newSeason: string; year: number } };

type Handler = (event: EngineEvent) => void;

class EventBus {
  private handlers: Set<Handler> = new Set();
  private captureStack: EngineEvent[][] = [];

  /**
   * Subscribe to engine events.
   * @param handler - Function to execute on event emit
   * @returns Unsubscribe function
   */
  subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Redirect subsequent emissions into `buffer` instead of dispatching to
   * subscribers, until the returned release function is called. Supports
   * nesting — used by shard workers whose emissions can't cross the worker
   * boundary and must be ferried back in the shard result.
   */
  capture(buffer: EngineEvent[]): () => void {
    this.captureStack.push(buffer);
    return () => {
      const i = this.captureStack.lastIndexOf(buffer);
      if (i >= 0) this.captureStack.splice(i, 1);
    };
  }

  /**
   * Emit an event to all subscribers (or the innermost capture buffer).
   */
  emit(event: EngineEvent): void {
    const capture = this.captureStack[this.captureStack.length - 1];
    if (capture) {
      capture.push(event);
      return;
    }
    this.handlers.forEach((handler) => handler(event));
  }

  /**
   * Clear all subscribers (useful for tests or hot-reloading).
   */
  clear(): void {
    this.handlers.clear();
  }
}

/**
 * Engine event bus.
 */
export const engineEventBus = new EventBus();
