import type { GameState } from '@/types/state.types';
import { isFightReady } from '@/engine/warrior/warriorStatus';
import type { SoftStopCondition } from './types';

/**
 *
 */
export function evaluateStopConditions(
  state: GameState,
  conditions: SoftStopCondition[]
): { shouldStop: boolean; reason?: string } {
  for (const condition of conditions) {
    switch (condition.type) {
      case 'rosterEmpty':
        if (state.roster.length === 0) {
          return { shouldStop: true, reason: 'roster_empty' };
        }
        break;
      case 'playerDeath':
        if (state.unacknowledgedDeaths && state.unacknowledgedDeaths.length > 0) {
          return { shouldStop: true, reason: 'player_death' };
        }
        break;
      case 'noPairings': {
        // Threshold check: stop counting at 2. Called weekly inside every
        // autosim/span loop — the old flattened-array allocation + full
        // filter scanned hundreds of warriors per evaluation for a boolean.
        let eligible = 0;
        for (const w of state.roster) {
          if (isFightReady(w, state.isTournamentWeek) && ++eligible >= 2) break;
        }
        if (eligible < 2) {
          for (const rival of state.rivals ?? []) {
            for (const w of rival.roster) {
              if (isFightReady(w, state.isTournamentWeek) && ++eligible >= 2) break;
            }
            if (eligible >= 2) break;
          }
        }
        if (eligible < 2) {
          return { shouldStop: true, reason: 'no_pairings' };
        }
        break;
      }
      case 'custom':
        if (condition.check(state)) {
          return { shouldStop: true, reason: 'custom_condition' };
        }
        break;
    }
  }
  return { shouldStop: false };
}
