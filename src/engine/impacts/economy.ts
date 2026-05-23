/**
 * Economy Domain Impacts
 * Handles treasury, fame, popularity, ledger, and newsletter-related state impacts.
 */
import type { GameState, LedgerEntry, NewsletterItem } from '@/types/state.types';

/**
 * Apply treasury delta to state.
 */
export const treasuryDelta = (state: GameState, value: number) => {
  state.treasury = (state.treasury ?? 0) + value;
};

/**
 * Apply fame delta to state.
 */
export const fameDelta = (state: GameState, value: number) => {
  state.fame = (state.fame ?? 0) + value;
  if (state.player) state.player.fame = (state.player.fame ?? 0) + value;
};

/**
 * Apply popularity delta to state.
 */
export const popularityDelta = (state: GameState, value: number) => {
  state.popularity = (state.popularity ?? 0) + value;
};

/**
 * Apply ledger entries to state.
 */
export const ledgerEntries = (state: GameState, value: LedgerEntry[]) => {
  state.ledger = [...(state.ledger ?? []), ...value];
};

/**
 * Apply newsletter items to state.
 */
export const newsletterItems = (state: GameState, value: NewsletterItem[]) => {
  state.newsletter = [...(state.newsletter || []), ...value];
};

/**
 * Economy impact handlers map.
 */
export const economyHandlers = {
  treasuryDelta,
  fameDelta,
  popularityDelta,
  ledgerEntries,
  newsletterItems,
};
