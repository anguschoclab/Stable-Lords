import type { GameState } from '@/types/state.types';
import { isFightReady } from '@/engine/warriorStatus';
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
        const allWarriors = [...state.roster, ...(state.rivals || []).flatMap((r) => r.roster)];
        const eligibleCount = allWarriors.filter((w) =>
          isFightReady(w, state.isTournamentWeek)
        ).length;
        if (eligibleCount < 2) {
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
