import { describe, it, expect } from 'vitest';
import {
  resolveAbsoluteWeek,
  boutOfferAbsoluteWeek,
  boutOfferExpirationAbsoluteWeek,
  displayWeek,
} from '@/engine/core/absoluteWeek';
import type { BoutOffer } from '@/types/state.types';
import type { BoutOfferId, PromoterId, WarriorId } from '@/types/shared.types';

function makeOffer(overrides: Partial<BoutOffer> = {}): BoutOffer {
  return {
    id: 'test' as BoutOfferId,
    promoterId: 'p' as PromoterId,
    warriorIds: ['w1' as WarriorId, 'w2' as WarriorId],
    boutWeek: 5,
    expirationWeek: 4,
    purse: 100,
    hype: 50,
    status: 'Proposed',
    responses: {},
    ...overrides,
  };
}

describe('resolveAbsoluteWeek', () => {
  it('resolves same-year forward (created week 10, display week 15)', () => {
    // createdAbsWeek = 10 → displayWeek = 10; displayWk = 15 ≥ 10 → 10 - 10 + 15 = 15
    expect(resolveAbsoluteWeek(15, 10)).toBe(15);
  });

  it('resolves exact createdDisplay edge case (displayWk === createdDisplay)', () => {
    // displayWk = 10 ≥ 10 → 10 - 10 + 10 = 10
    expect(resolveAbsoluteWeek(10, 10)).toBe(10);
  });

  it('resolves wrap-around year boundary (created week 50, display week 3)', () => {
    // createdAbsWeek = 50 → displayWeek = 50; displayWk = 3 < 50 → 50 - 50 + 52 + 3 = 55
    expect(resolveAbsoluteWeek(3, 50)).toBe(55);
  });

  it('resolves wrap-around at exact year boundary (created week 52, display week 1)', () => {
    // createdAbsWeek = 52 → displayWeek = 52; displayWk = 1 < 52 → 52 - 52 + 52 + 1 = 53
    expect(resolveAbsoluteWeek(1, 52)).toBe(53);
  });

  it('resolves displayWk just below createdDisplay (created week 20, display week 19)', () => {
    // displayWk = 19 < 20 → 20 - 20 + 52 + 19 = 71
    expect(resolveAbsoluteWeek(19, 20)).toBe(71);
  });

  it('handles multi-year offset (created week 5, display week 50)', () => {
    // displayWk = 50 ≥ 5 → 5 - 5 + 50 = 50
    expect(resolveAbsoluteWeek(50, 5)).toBe(50);
  });
});

describe('boutOfferAbsoluteWeek', () => {
  it('resolves offer with createdAbsoluteWeek', () => {
    const offer = makeOffer({ boutWeek: 3, createdAbsoluteWeek: 50 });
    expect(boutOfferAbsoluteWeek(offer)).toBe(55);
  });

  it('resolves offer with same-year boutWeek', () => {
    const offer = makeOffer({ boutWeek: 15, createdAbsoluteWeek: 10 });
    expect(boutOfferAbsoluteWeek(offer)).toBe(15);
  });

  it('returns raw boutWeek for legacy offers (no createdAbsoluteWeek)', () => {
    const offer = makeOffer({ boutWeek: 42 });
    expect(boutOfferAbsoluteWeek(offer)).toBe(42);
  });

  it('returns raw boutWeek when createdAbsoluteWeek is undefined', () => {
    const offer = makeOffer({ boutWeek: 7, createdAbsoluteWeek: undefined });
    expect(boutOfferAbsoluteWeek(offer)).toBe(7);
  });
});

describe('boutOfferExpirationAbsoluteWeek', () => {
  it('resolves expiration with createdAbsoluteWeek', () => {
    const offer = makeOffer({ expirationWeek: 2, createdAbsoluteWeek: 50 });
    expect(boutOfferExpirationAbsoluteWeek(offer)).toBe(54);
  });

  it('returns raw expirationWeek for legacy offers', () => {
    const offer = makeOffer({ expirationWeek: 40 });
    expect(boutOfferExpirationAbsoluteWeek(offer)).toBe(40);
  });
});

describe('round-trip consistency', () => {
  it('displayWeek(boutOfferAbsoluteWeek(o)) === o.boutWeek when createdAbsoluteWeek is set', () => {
    const offer = makeOffer({ boutWeek: 3, createdAbsoluteWeek: 50 });
    expect(displayWeek(boutOfferAbsoluteWeek(offer))).toBe(3);
  });

  it('year-boundary: offer created at absWeek 52, boutWeek wraps to 1', () => {
    const offer = makeOffer({ boutWeek: 1, expirationWeek: 52, createdAbsoluteWeek: 52 });
    expect(boutOfferAbsoluteWeek(offer)).toBe(53);
    expect(boutOfferExpirationAbsoluteWeek(offer)).toBe(52);
  });

  it('year-boundary: offer created at absWeek 104 (year 2 week 52), boutWeek wraps to 1', () => {
    const offer = makeOffer({ boutWeek: 1, createdAbsoluteWeek: 104 });
    expect(boutOfferAbsoluteWeek(offer)).toBe(105);
  });
});
