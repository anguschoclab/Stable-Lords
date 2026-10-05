import { GameState, RivalStableData, BoutOffer } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';
import { processAIRosterManagement } from '@/engine/owner/roster/management';
import { SeededRNG } from '@/utils/random';
import { StateImpact } from '@/engine/impacts';

interface RunRosterManagementArgs {
  state: GameState;
  currentRivals: RivalStableData[];
  nextWeek: number;
  boutOffersWithWorld: Record<BoutOfferId, BoutOffer>;
  globalGazetteItems: string[];
  impacts: StateImpact[];
}

/**
 * AI Roster Management — culling/retirement first, then flag `needsRecruit`
 * so the unified draft can fill same-tick (G9). Returns the managed rivals;
 * appends gazette items and routes culled warriors into `state.retired` —
 * without the retired impact they vanish from the world entirely (and the
 * vacancy phase can only guess 'retired').
 */
export function runRosterManagement(args: RunRosterManagementArgs): RivalStableData[] {
  const { state, currentRivals, nextWeek, boutOffersWithWorld, globalGazetteItems } = args;
  const { impacts } = args;
  const rosterRng = new SeededRNG(state.absoluteWeek * 13 + 7);
  const { updatedRivals, gazetteItems, retiredWarriors, legacyFounders } =
    processAIRosterManagement(
      {
        ...state,
        week: nextWeek,
        rivals: currentRivals,
        boutOffers: boutOffersWithWorld,
      },
      rosterRng
    );
  globalGazetteItems.push(...gazetteItems);
  if (retiredWarriors.length > 0) impacts.push({ retired: retiredWarriors });
  if (legacyFounders.length > 0) {
    // Append-delta: the queue's wholesale write belongs to the system pass's
    // churn in this same stage — a same-snapshot replace would clobber it.
    impacts.push({ legacyFounderEnqueue: legacyFounders });
  }
  return updatedRivals;
}
