import type { Warrior, RivalStableData, BoutOffer, GameState } from '@/types/state.types';
import {
  COUNTERED_PURSE_CONDITION,
  COUNTERED_VENUE_CONDITION,
} from '@/engine/bout/mutations/contractMutations';
import { contenderRankAtArena } from '@/engine/championship/arenaChampionship';

/** Minimum venue bouts before a warrior's record there counts as evidence. */
const VENUE_SAMPLE_BOUTS = 3;
/** Losing-rate ceiling for "bad venue" aversion. */
const BAD_VENUE_WIN_RATE = 0.4;
/** Win-rate floor for the arena a warrior counters toward. */
const GOOD_VENUE_WIN_RATE = 0.6;

/**
 * The arena a warrior would counter a Proposed offer toward, or undefined.
 * Two motives, checked in order:
 *  - CROWN_BID ladder pull — the warrior campaigns for a crown and is ranked
 *    at the target arena, so off-ladder bouts get dragged onto the ladder.
 *  - Bad-venue aversion — a losing record at the offered arena (≥3 bouts,
 *    <40% wins) with a clearly better venue on the books.
 * Title offers and already-countered offers never yield a target.
 */
export function venueCounterTarget(
  offer: BoutOffer,
  warrior: Warrior,
  rival: RivalStableData,
  state?: GameState
): string | undefined {
  if (!offer.arenaId || offer.titleArenaId) return undefined;
  const conds = offer.conditions ?? [];
  if (conds.includes(COUNTERED_VENUE_CONDITION) || conds.includes(COUNTERED_PURSE_CONDITION)) {
    return undefined;
  }

  const ladder = warrior.campaignFocus === 'CROWN_BID' ? rival.strategy?.targetArenaId : undefined;
  if (
    ladder &&
    ladder !== offer.arenaId &&
    state &&
    contenderRankAtArena(state, ladder, warrior.id) != null
  ) {
    return ladder;
  }

  const here = warrior.career?.byArena?.[offer.arenaId];
  if (!here) return undefined;
  const hereBouts = here.wins + here.losses;
  if (hereBouts < VENUE_SAMPLE_BOUTS || here.wins / hereBouts >= BAD_VENUE_WIN_RATE) {
    return undefined;
  }
  let bestArena: string | undefined;
  let bestRate = 0;
  for (const [arenaId, rec] of Object.entries(warrior.career?.byArena ?? {})) {
    if (arenaId === offer.arenaId) continue;
    const bouts = rec.wins + rec.losses;
    if (bouts < VENUE_SAMPLE_BOUTS) continue;
    const rate = rec.wins / bouts;
    if (rate > bestRate) {
      bestRate = rate;
      bestArena = arenaId;
    }
  }
  return bestRate >= GOOD_VENUE_WIN_RATE ? bestArena : undefined;
}
