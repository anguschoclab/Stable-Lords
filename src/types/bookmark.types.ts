/**
 * Bookmark types — player-managed watchlist for any game entity.
 */

/** Entity kinds that can be bookmarked. */
export type BookmarkEntityType =
  'warrior' | 'rival' | 'promoter' | 'trainer' | 'tournament' | 'boutOffer' | 'scoutReport';

/** One saved entity reference with its tracked timestamp. */
export interface Bookmark {
  entityType: BookmarkEntityType;
  entityId: string;
  createdAt: string;
}
