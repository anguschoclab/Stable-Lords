import { StateCreator } from 'zustand';
import type { Bookmark, BookmarkEntityType } from '@/types/bookmark.types';
import type { GameStore } from '@/state/useGameStore';

export interface BookmarksSlice {
  bookmarks: Bookmark[];
  toggleBookmark: (type: BookmarkEntityType, id: string) => void;
  isBookmarked: (type: BookmarkEntityType, id: string) => boolean;
  getBookmarksByType: (type: BookmarkEntityType) => Bookmark[];
}

export const createBookmarksSlice: StateCreator<GameStore, [], [], BookmarksSlice> = (
  set,
  get
) => ({
  bookmarks: [],

  toggleBookmark: (type, id) => {
    set((state: GameStore) => {
      const existingIndex = state.bookmarks.findIndex(
        (b: Bookmark) => b.entityType === type && b.entityId === id
      );
      if (existingIndex >= 0) {
        return {
          bookmarks: state.bookmarks.filter(
            (_b: Bookmark, i: number) => i !== existingIndex
          ),
        };
      }
      return {
        bookmarks: [
          ...state.bookmarks,
          {
            entityType: type,
            entityId: id,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
  },

  isBookmarked: (type, id) => {
    return get().bookmarks.some(
      (b: Bookmark) => b.entityType === type && b.entityId === id
    );
  },

  getBookmarksByType: (type) => {
    return get().bookmarks.filter((b: Bookmark) => b.entityType === type);
  },
});
