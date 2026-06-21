/**
 * Bookmark types — player-managed watchlist for any game entity.
 */

/**
 *
 */
export type BookmarkEntityType =
  | 'warrior'
  | 'rival'
  | 'promoter'
  | 'trainer'
  | 'tournament'
  | 'boutOffer'
  | 'scoutReport';

/**
 *
 */
export interface Bookmark {
  entityType: BookmarkEntityType;
  entityId: string;
  createdAt: string;
}
