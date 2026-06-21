import { StateCreator } from 'zustand';
import type { Bookmark, BookmarkEntityType } from '@/types/bookmark.types';
import type { GameStore } from '@/state/useGameStore';

/**
 *
 */
export interface BookmarksSlice {
  bookmarks: Bookmark[];
  toggleBookmark: (type: BookmarkEntityType, id: string) => void;
  removeBookmark: (type: BookmarkEntityType, id: string) => void;
  clearBookmarks: () => void;
  clearBookmarksByType: (type: BookmarkEntityType) => void;
  cleanDanglingBookmarks: (
    entityIdsByType: Partial<Record<BookmarkEntityType, Set<string>>>
  ) => void;
  isBookmarked: (type: BookmarkEntityType, id: string) => boolean;
  getBookmarksByType: (type: BookmarkEntityType) => Bookmark[];
}

/**
 *
 */
export const createBookmarksSlice: StateCreator<GameStore, [], [], BookmarksSlice> = (
  set,
  get
) => ({
  bookmarks: [],

  toggleBookmark: (type, id) => {
    set((state) => {
      const existingIndex = state.bookmarks.findIndex(
        (b: Bookmark) => b.entityType === type && b.entityId === id
      );
      if (existingIndex >= 0) {
        return {
          bookmarks: state.bookmarks.filter((_b: Bookmark, i: number) => i !== existingIndex),
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

  removeBookmark: (type, id) => {
    set((state) => ({
      bookmarks: state.bookmarks.filter(
        (b: Bookmark) => !(b.entityType === type && b.entityId === id)
      ),
    }));
  },

  clearBookmarks: () => {
    set({ bookmarks: [] });
  },

  clearBookmarksByType: (type) => {
    set((state) => ({
      bookmarks: state.bookmarks.filter((b: Bookmark) => b.entityType !== type),
    }));
  },

  cleanDanglingBookmarks: (entityIdsByType) => {
    set((state) => {
      const valid = state.bookmarks.filter((b: Bookmark) => {
        const ids = entityIdsByType[b.entityType];
        return ids ? ids.has(b.entityId) : false;
      });
      if (valid.length === state.bookmarks.length) return state;
      return { bookmarks: valid };
    });
  },

  isBookmarked: (type, id) => {
    return get().bookmarks.some((b: Bookmark) => b.entityType === type && b.entityId === id);
  },

  getBookmarksByType: (type) => {
    return get().bookmarks.filter((b: Bookmark) => b.entityType === type);
  },
});
