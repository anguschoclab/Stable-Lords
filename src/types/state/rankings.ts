import type { BoutOfferId, PromoterId, StableId, WarriorId } from '../shared.types';




/**
 * Defines the shape of ranking entry.
 */
export interface RankingEntry {
  overallRank: number;
  classRank: number;
  compositeScore: number;
}



/**
 * Bout offer status type.
 */
export type BoutOfferStatus = 'Proposed' | 'Signed' | 'Rejected' | 'Canceled' | 'Expired';



/**
 * Bout offer response type.
 */
export type BoutOfferResponse = 'Pending' | 'Accepted' | 'Declined' | 'Countered';



/**
 * Defines the shape of bout offer.
 */
export interface BoutOffer {
  id: BoutOfferId;
  promoterId: PromoterId;
  warriorIds: WarriorId[];
  boutWeek: number;
  expirationWeek: number;
  purse: number;
  hype: number;
  status: BoutOfferStatus;
  responses: Record<WarriorId, BoutOfferResponse>;
  proposerStableId?: StableId;
  conditions?: string[];
  createdAt?: string;
  /** Arena where this bout will take place. Absent only for legacy/tournament offers. */
  arenaId?: string;
  /** Absolute week when this offer was created. Disambiguates boutWeek/expirationWeek
   *  which are stored as display weeks (1–52). Legacy saves omit this field. */
  createdAbsoluteWeek?: number;
  /** Purse increase demanded by the last counter (COUNTERED_PURSE round).
   *  The proposer stable must afford this bump for the counter to sign. */
  counterPurseBump?: number;
  /** Set when this offer is an arena title bout for the given arena —
   *  pinned venue, no counters, priority in slate ordering and pairings. */
  titleArenaId?: string;
  /** Short reason codes recorded when a stable answers a title bout —
   *  e.g. 'title-defense-health' for a hurt champion's refusal. Surfaced on
   *  the offer card so the player can read rival title decisions. */
  responseNotes?: Record<WarriorId, string>;
}



/**
 * Promoter personality type.
 */
export type PromoterPersonality = 'Greedy' | 'Honorable' | 'Sadistic' | 'Flashy' | 'Corporate';
