/**
 * Builds the pendingResolutionData payload the resolution reveal reads.
 * Extracted from createStore.commitWorkerResult so the shape is unit-testable.
 */
import type { GameState } from '@/types/state.types';
import type { NewsletterItem, PendingResolutionData } from '@/types/combat.types';

/**
 * Assemble the deferred resolution payload from the week-pipeline's stashed
 * bout display data. Casualty lists are warrior refs — UUID is the identity.
 */
export function buildResolutionPayload(
  display: GameState['lastWeekBoutDisplay'] | undefined,
  newsletter: NewsletterItem[],
  currentWeek: number
): PendingResolutionData {
  return {
    bouts: display?.results ?? [],
    deaths: display?.deaths ?? [],
    injuries: display?.injuries ?? [],
    promotions: [],
    gazette: newsletter.filter((n) => n.week === currentWeek),
  };
}
