import { describe, it, expect } from 'vitest';
import { filterAndSortOffers } from '@/utils/boutOfferFilters';
import type { BoutOffer, Promoter, Warrior } from '@/types/state.types';
import type { WarriorId, PromoterId, BoutOfferId } from '@/types/shared.types';

function makeOffer(overrides: Partial<BoutOffer> = {}): BoutOffer {
  return {
    id: 'offer-default' as BoutOfferId,
    promoterId: 'promoter-default' as PromoterId,
    warriorIds: [] as WarriorId[],
    boutWeek: 10,
    expirationWeek: 11,
    purse: 100,
    hype: 50,
    status: 'Proposed',
    responses: {},
    ...overrides,
  } as BoutOffer;
}

function makePromoter(overrides: Partial<Promoter> = {}): Promoter {
  return {
    id: 'promoter-default' as PromoterId,
    name: 'Test Promoter',
    age: 45,
    personality: 'Corporate',
    tier: 'Local',
    capacity: 5,
    biases: [],
    history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
    ...overrides,
  } as Promoter;
}

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'warrior-default' as WarriorId,
    name: 'Test Warrior',
    style: 'StrikingAttack' as any,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    traits: [],
    ...overrides,
  } as Warrior;
}

describe('filterAndSortOffers', () => {
  it('returns empty arrays and zero highestPurse when given empty inputs', () => {
    const result = filterAndSortOffers({}, [], 1, {}, new Set(), null);
    expect(result.thisWeekOffers).toEqual([]);
    expect(result.upcomingOffers).toEqual([]);
    expect(result.idleWarriors).toEqual([]);
    expect(result.highestPurse).toBe(0);
  });

  it('includes offers involving player warriors', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const offer = makeOffer({
      id: 'o1' as BoutOfferId,
      warriorIds: ['w1' as WarriorId, 'w2' as WarriorId],
      status: 'Proposed',
      boutWeek: 3,
    });
    const result = filterAndSortOffers({ o1: offer }, [w1], 1, {}, new Set(), null);
    expect(result.thisWeekOffers).toHaveLength(1);
    expect(result.thisWeekOffers[0]!.id).toBe('o1');
  });

  it('excludes offers that only involve rival warriors', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const offer = makeOffer({
      id: 'o1' as BoutOfferId,
      warriorIds: ['w2' as WarriorId, 'w3' as WarriorId],
      status: 'Proposed',
      boutWeek: 3,
    });
    const result = filterAndSortOffers({ o1: offer }, [w1], 1, {}, new Set(), null);
    expect(result.thisWeekOffers).toHaveLength(0);
    expect(result.highestPurse).toBe(0);
  });

  it('includes Proposed and Signed offers, rejects others', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const roster = [w1];
    const offers: Record<string, BoutOffer> = {
      proposed: makeOffer({
        id: 'proposed' as BoutOfferId,
        promoterId: 'p1' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
      signed: makeOffer({
        id: 'signed' as BoutOfferId,
        promoterId: 'p2' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Signed',
      }),
      rejected: makeOffer({
        id: 'rejected' as BoutOfferId,
        promoterId: 'p3' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Rejected',
      }),
      expired: makeOffer({
        id: 'expired' as BoutOfferId,
        promoterId: 'p4' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Expired',
      }),
      canceled: makeOffer({
        id: 'canceled' as BoutOfferId,
        promoterId: 'p5' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Canceled',
      }),
    };
    const result = filterAndSortOffers(offers, roster, 1, {}, new Set(), null);
    const ids = result.thisWeekOffers.map((o) => o.id);
    expect(ids).toContain('proposed');
    expect(ids).toContain('signed');
    expect(ids).not.toContain('rejected');
    expect(ids).not.toContain('expired');
    expect(ids).not.toContain('canceled');
  });

  it('narrows results by selectedWarriorId', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const w2 = makeWarrior({ id: 'w2' as WarriorId });
    const roster = [w1, w2];
    const offers: Record<string, BoutOffer> = {
      o1: makeOffer({
        id: 'o1' as BoutOfferId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
      o2: makeOffer({
        id: 'o2' as BoutOfferId,
        warriorIds: ['w2' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
    };
    const result = filterAndSortOffers(offers, roster, 1, {}, new Set(), 'w1');
    expect(result.thisWeekOffers).toHaveLength(1);
    expect(result.thisWeekOffers[0]!.id).toBe('o1');
  });

  it('splits offers into thisWeek (week+2) and upcoming (>week+2)', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const roster = [w1];
    const offers: Record<string, BoutOffer> = {
      thisWeek: makeOffer({
        id: 'thisWeek' as BoutOfferId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 5,
        status: 'Proposed',
      }),
      upcoming: makeOffer({
        id: 'upcoming' as BoutOfferId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 7,
        status: 'Proposed',
      }),
      past: makeOffer({
        id: 'past' as BoutOfferId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 4,
        status: 'Proposed',
      }),
    };
    const result = filterAndSortOffers(offers, roster, 3, {}, new Set(), null);
    expect(result.thisWeekOffers.map((o) => o.id)).toContain('thisWeek');
    expect(result.upcomingOffers.map((o) => o.id)).toContain('upcoming');
    expect(result.thisWeekOffers.map((o) => o.id)).not.toContain('past');
    expect(result.upcomingOffers.map((o) => o.id)).not.toContain('past');
    expect(result.thisWeekOffers.map((o) => o.id)).not.toContain('upcoming');
  });

  it('keeps only the best offer per promoter (highest purse * hype)', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const roster = [w1];
    const pid = 'promoter1' as PromoterId;
    const offers: Record<string, BoutOffer> = {
      low: makeOffer({
        id: 'low' as BoutOfferId,
        promoterId: pid,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        purse: 100,
        hype: 10,
        status: 'Proposed',
      }),
      high: makeOffer({
        id: 'high' as BoutOfferId,
        promoterId: pid,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        purse: 200,
        hype: 20,
        status: 'Proposed',
      }),
    };
    const result = filterAndSortOffers(offers, roster, 1, {}, new Set(), null);
    expect(result.thisWeekOffers).toHaveLength(1);
    expect(result.thisWeekOffers[0]!.id).toBe('high');
  });

  it('sorts thisWeek by promoter tier descending (Legendary > National > Regional > Local)', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const roster = [w1];
    const promoters: Record<string, Promoter> = {
      pLocal: makePromoter({ id: 'pLocal' as PromoterId, tier: 'Local' }),
      pRegional: makePromoter({ id: 'pRegional' as PromoterId, tier: 'Regional' }),
      pNational: makePromoter({ id: 'pNational' as PromoterId, tier: 'National' }),
      pLegendary: makePromoter({ id: 'pLegendary' as PromoterId, tier: 'Legendary' }),
    };
    const offers: Record<string, BoutOffer> = {
      local: makeOffer({
        id: 'local' as BoutOfferId,
        promoterId: 'pLocal' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
      regional: makeOffer({
        id: 'regional' as BoutOfferId,
        promoterId: 'pRegional' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
      national: makeOffer({
        id: 'national' as BoutOfferId,
        promoterId: 'pNational' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
      legendary: makeOffer({
        id: 'legendary' as BoutOfferId,
        promoterId: 'pLegendary' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
    };
    const result = filterAndSortOffers(offers, roster, 1, promoters, new Set(), null);
    const tiers = result.thisWeekOffers.map((o) => promoters[o.promoterId]!.tier);
    expect(tiers).toEqual(['Legendary', 'National', 'Regional', 'Local']);
  });

  it('sorts upcoming offers ascending by boutWeek', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const roster = [w1];
    const offers: Record<string, BoutOffer> = {
      late: makeOffer({
        id: 'late' as BoutOfferId,
        promoterId: 'p1' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 10,
        status: 'Proposed',
      }),
      mid: makeOffer({
        id: 'mid' as BoutOfferId,
        promoterId: 'p2' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 8,
        status: 'Proposed',
      }),
      early: makeOffer({
        id: 'early' as BoutOfferId,
        promoterId: 'p3' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 6,
        status: 'Proposed',
      }),
    };
    const result = filterAndSortOffers(offers, roster, 1, {}, new Set(), null);
    const weeks = result.upcomingOffers.map((o) => o.boutWeek);
    expect(weeks).toEqual([6, 8, 10]);
  });

  it('identifies idle warriors as active warriors with no offers', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId, status: 'Active' });
    const w2 = makeWarrior({ id: 'w2' as WarriorId, status: 'Active' });
    const roster = [w1, w2];
    const offers: Record<string, BoutOffer> = {
      o1: makeOffer({
        id: 'o1' as BoutOfferId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
    };
    const result = filterAndSortOffers(offers, roster, 1, {}, new Set(), null);
    expect(result.idleWarriors).toHaveLength(1);
    expect(result.idleWarriors[0]!.id).toBe('w2');
  });

  it('excludes non-Active warriors from idle warriors', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId, status: 'Active' });
    const w2 = makeWarrior({ id: 'w2' as WarriorId, status: 'Dead' });
    const roster = [w1, w2];
    const result = filterAndSortOffers({}, roster, 1, {}, new Set(), null);
    expect(result.idleWarriors).toHaveLength(1);
    expect(result.idleWarriors[0]!.id).toBe('w1');
  });

  it('computes highestPurse from all player-relevant offers', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const roster = [w1];
    const offers: Record<string, BoutOffer> = {
      low: makeOffer({
        id: 'low' as BoutOfferId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        purse: 100,
        status: 'Proposed',
      }),
      high: makeOffer({
        id: 'high' as BoutOfferId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 5,
        purse: 500,
        status: 'Proposed',
      }),
    };
    const result = filterAndSortOffers(offers, roster, 1, {}, new Set(), null);
    expect(result.highestPurse).toBe(500);
  });

  it('handles offers referencing a missing promoter gracefully in tier sort', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const roster = [w1];
    const promoters: Record<string, Promoter> = {
      p1: makePromoter({ id: 'p1' as PromoterId, tier: 'Legendary' }),
    };
    const offers: Record<string, BoutOffer> = {
      known: makeOffer({
        id: 'known' as BoutOfferId,
        promoterId: 'p1' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
      unknown: makeOffer({
        id: 'unknown' as BoutOfferId,
        promoterId: 'ghost' as PromoterId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
    };
    const result = filterAndSortOffers(offers, roster, 1, promoters, new Set(), null);
    // Legendary should come before missing (rank 0)
    expect(result.thisWeekOffers[0]!.id).toBe('known');
    expect(result.thisWeekOffers[1]!.id).toBe('unknown');
  });

  it('still shows Proposed offers in signedOfferIds even if status not yet Signed', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId });
    const roster = [w1];
    const offers: Record<string, BoutOffer> = {
      pending: makeOffer({
        id: 'pending' as BoutOfferId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
      stale: makeOffer({
        id: 'stale' as BoutOfferId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
    };
    const signedIds = new Set<string>(['pending']);
    const result = filterAndSortOffers(offers, roster, 1, {}, signedIds, null);
    const ids = result.thisWeekOffers.map((o) => o.id);
    expect(ids).toContain('pending');
    expect(ids).not.toContain('stale');
  });

  it('excludes a warrior from idle if they appear in any player-relevant offer', () => {
    const w1 = makeWarrior({ id: 'w1' as WarriorId, status: 'Active' });
    const w2 = makeWarrior({ id: 'w2' as WarriorId, status: 'Active' });
    const roster = [w1, w2];
    const offers: Record<string, BoutOffer> = {
      // w1 is in this-week offer, w2 is only in an upcoming offer
      thisWeek: makeOffer({
        id: 'thisWeek' as BoutOfferId,
        warriorIds: ['w1' as WarriorId],
        boutWeek: 3,
        status: 'Proposed',
      }),
      upcoming: makeOffer({
        id: 'upcoming' as BoutOfferId,
        warriorIds: ['w2' as WarriorId],
        boutWeek: 10,
        status: 'Proposed',
      }),
    };
    const result = filterAndSortOffers(offers, roster, 1, {}, new Set(), null);
    expect(result.idleWarriors).toHaveLength(0);
  });
});
