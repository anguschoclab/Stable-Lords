import { WEEKS_PER_YEAR } from '@/constants/core/core';
import type { BoutOffer } from '@/types/state.types';

/**
 * The monotonic week counter. `state.week` resets 52→1 every year, which breaks
 * any cross-week arithmetic at the boundary (offers booked in week 52 for "week
 * 53" never match week 1 of the next year). All scheduling math must use
 * absoluteWeek; `week`/`year` remain for display and season logic.
 */
export function deriveAbsoluteWeek(year?: number, week?: number): number {
  const y = Math.max(1, year ?? 1);
  const w = Math.max(1, week ?? 1);
  return (y - 1) * WEEKS_PER_YEAR + w;
}

/** Convert an absolute week back to the in-year display week (1–52). */
export function displayWeek(absoluteWeek: number): number {
  return ((Math.max(1, absoluteWeek) - 1) % WEEKS_PER_YEAR) + 1;
}

/** Resolve a display week to absolute, given the absolute week it was created in. */
export function resolveAbsoluteWeek(displayWk: number, createdAbsWeek: number): number {
  const createdDisplay = displayWeek(createdAbsWeek);
  if (displayWk >= createdDisplay) {
    return createdAbsWeek - createdDisplay + displayWk;
  }
  return createdAbsWeek - createdDisplay + WEEKS_PER_YEAR + displayWk;
}

/** Resolve offer.boutWeek to absolute. Legacy offers (no createdAbsoluteWeek) return boutWeek as-is. */
export function boutOfferAbsoluteWeek(offer: BoutOffer): number {
  return offer.createdAbsoluteWeek != null
    ? resolveAbsoluteWeek(offer.boutWeek, offer.createdAbsoluteWeek)
    : offer.boutWeek;
}

/** Resolve offer.expirationWeek to absolute. Legacy offers return expirationWeek as-is. */
export function boutOfferExpirationAbsoluteWeek(offer: BoutOffer): number {
  return offer.createdAbsoluteWeek != null
    ? resolveAbsoluteWeek(offer.expirationWeek, offer.createdAbsoluteWeek)
    : offer.expirationWeek;
}
