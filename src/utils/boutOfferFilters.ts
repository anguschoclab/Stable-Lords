import type { Warrior, BoutOffer } from '@/types/state.types';
import type { Promoter } from '@/types/state.types';

export interface FilteredOffersResult {
  thisWeekOffers: BoutOffer[];
  upcomingOffers: BoutOffer[];
  idleWarriors: Warrior[];
  highestPurse: number;
}

/**
 * Selects the best offer per promoter based on purse * hype score.
 */
function bestByPromoter(offers: BoutOffer[]): BoutOffer[] {
  const map = new Map<string, BoutOffer>();
  offers.forEach((o) => {
    const score = o.purse * o.hype;
    const existing = map.get(o.promoterId);
    if (!existing || score > existing.purse * existing.hype) {
      map.set(o.promoterId, o);
    }
  });
  return Array.from(map.values());
}

/**
 * Filters and sorts bout offers for the booking office.
 * Returns this week's offers, upcoming offers, idle warriors, and highest purse.
 */
export function filterAndSortOffers(
  boutOffers: Record<string, BoutOffer>,
  roster: Warrior[],
  week: number,
  promoters: Record<string, Promoter>,
  signedOfferIds: Set<string>,
  selectedWarriorId: string | null
): FilteredOffersResult {
  // Filter offers that involve player warriors
  const playerOffers = Object.values(boutOffers).filter(
    (offer: BoutOffer) =>
      offer.warriorIds.some((wId: string) =>
        roster.some((playerW: Warrior) => playerW.id === wId)
      ) &&
      (offer.status === 'Proposed' || signedOfferIds.has(offer.id))
  );

  // Filter by selected warrior if any
  const filtered = selectedWarriorId
    ? playerOffers.filter((o) => o.warriorIds.includes(selectedWarriorId as any))
    : playerOffers;

  // Split into this week and upcoming
  const { thisWeek: thisWeekRaw, upcoming: upcomingRaw } = filtered.reduce(
    (acc, o) => {
      if (o.boutWeek === week + 2) acc.thisWeek.push(o);
      if (o.boutWeek > week + 2) acc.upcoming.push(o);
      return acc;
    },
    { thisWeek: [] as BoutOffer[], upcoming: [] as BoutOffer[] }
  );

  // Get best offer per promoter
  const thisWeek = bestByPromoter(thisWeekRaw);
  const upcoming = bestByPromoter(upcomingRaw);

  // Sort this week by promoter tier
  thisWeek.sort((a, b) =>
    (promoters[b.promoterId]?.tier ?? '') > (promoters[a.promoterId]?.tier ?? '') ? 1 : -1
  );

  // Sort upcoming by bout week
  upcoming.sort((a, b) => a.boutWeek - b.boutWeek);

  // Find idle warriors (active but no offers)
  const warriorsWithOffers = new Set(playerOffers.flatMap((o) => o.warriorIds));
  const idle = roster.filter((w) => w.status === 'Active' && !warriorsWithOffers.has(w.id));

  // Find highest purse
  const maxPurse = playerOffers.length > 0 ? Math.max(...playerOffers.map((o) => o.purse)) : 0;

  return {
    thisWeekOffers: thisWeek,
    upcomingOffers: upcoming,
    idleWarriors: idle,
    highestPurse: maxPurse,
  };
}
