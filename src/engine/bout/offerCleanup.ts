import type { BoutOffer, GameState } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';
import { boutOfferAbsoluteWeek, boutOfferExpirationAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { deadIdSet } from '@/engine/warrior/warriorStatus';

/**
 * Stable Lords — Bout Offer Cleanup
 *
 * Single source of truth for pruning `state.boutOffers`. Shared by:
 *  - `finalizeState` (end-of-week pipeline cleanup)
 *  - `RivalStrategyPass` (pre-bidding purge so stale offers don't block bids)
 *
 * An offer is dropped when:
 *  - its bout week is at/before `justFinishedAbsoluteWeek` (the bout already
 *    resolved or its window passed), or
 *  - it is still unsigned AND its expiration week is at/before
 *    `justFinishedAbsoluteWeek` — signed contracts survive expiry since the
 *    bout is already committed.
 */
export function pruneBoutOffers(
  offers: Record<BoutOfferId, BoutOffer>,
  justFinishedAbsoluteWeek: number
): Record<BoutOfferId, BoutOffer> {
  const cleaned: Record<BoutOfferId, BoutOffer> = {} as Record<BoutOfferId, BoutOffer>;
  for (const offer of Object.values(offers)) {
    if (boutOfferAbsoluteWeek(offer) <= justFinishedAbsoluteWeek) continue;
    if (
      offer.status !== 'Signed' &&
      offer.expirationWeek != null &&
      boutOfferExpirationAbsoluteWeek(offer) <= justFinishedAbsoluteWeek
    ) {
      continue;
    }
    cleaned[offer.id] = offer;
  }
  return cleaned;
}

/**
 * Void signed contracts that can never resolve — a combatant died, retired,
 * or left every store between signing and the bout week. Runs at week
 * finalize (after bout resolution and aging) so contracts are cancelled the
 * same week their combatant became ineligible rather than sitting as Signed
 * ghosts until their scheduled week. Returns the voided offers so callers
 * can surface a newsletter notice.
 */
export function voidUnresolvableSignedOffers(state: GameState): BoutOffer[] {
  const offers = state.boutOffers;
  if (!offers) return [];

  const deadIds = deadIdSet(state);
  const retiredIds = new Set<string>((state.retired ?? []).map((w) => w.id as string));
  const liveIds = new Set<string>();
  for (const w of state.roster ?? []) liveIds.add(w.id as string);
  for (const r of state.rivals ?? []) for (const w of r.roster ?? []) liveIds.add(w.id as string);
  for (const w of state.freeAgents ?? []) liveIds.add(w.id as string);
  for (const w of state.recruitPool ?? []) liveIds.add(w.id as string);
  // Tournament-only warriors (emergency freelancers) live in participants.
  for (const t of state.tournaments ?? [])
    for (const p of t.participants ?? []) if (!deadIds.has(p.id)) liveIds.add(p.id as string);

  const voided: BoutOffer[] = [];
  for (const offer of Object.values(offers)) {
    if (offer.status !== 'Signed') continue;
    const unresolvable = (offer.warriorIds ?? []).some(
      (wId) =>
        wId && (deadIds.has(wId) || retiredIds.has(wId as string) || !liveIds.has(wId as string))
    );
    if (!unresolvable) continue;
    offers[offer.id] = { ...offer, status: 'Canceled' };
    voided.push(offer);
  }
  return voided;
}
