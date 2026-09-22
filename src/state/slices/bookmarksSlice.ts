import { StateCreator } from 'zustand';
import type { Bookmark, BookmarkEntityType } from '@/types/bookmark.types';
import type { GameStore } from '@/state/useGameStore';

const EMPTY_SET: Set<string> = new Set();
const keySetCache = new WeakMap<Bookmark[], Set<string>>();
const typeSetCache = new WeakMap<Bookmark[], Map<BookmarkEntityType, Set<string>>>();

/**
 * Cached Set of `${entityType}:${entityId}` keys for O(1) bookmark existence
 * checks. WeakMap-keyed on the bookmarks array — immer produces a new array
 * on every bookmark change, so the cache self-invalidates and never leaks.
 */
export function bookmarkKeySet(bookmarks: Bookmark[] | undefined): Set<string> {
  if (!bookmarks) return EMPTY_SET;
  let set = keySetCache.get(bookmarks);
  if (!set) {
    set = new Set(bookmarks.map((b) => `${b.entityType}:${b.entityId}`));
    keySetCache.set(bookmarks, set);
  }
  return set;
}

/**
 * Cached per-type Map of entityId Sets — one pass over bookmarks builds all
 * type buckets. Replaces `rows.filter((r) => bookmarks.some(...))` scans.
 */
export function bookmarkIdsByType(
  bookmarks: Bookmark[] | undefined
): Map<BookmarkEntityType, Set<string>> {
  if (!bookmarks) return new Map();
  let map = typeSetCache.get(bookmarks);
  if (!map) {
    map = new Map();
    for (const b of bookmarks) {
      let set = map.get(b.entityType);
      if (!set) {
        set = new Set();
        map.set(b.entityType, set);
      }
      set.add(b.entityId);
    }
    typeSetCache.set(bookmarks, map);
  }
  return map;
}

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
    return bookmarkKeySet(get().bookmarks).has(`${type}:${id}`);
  },

  getBookmarksByType: (type) => {
    return get().bookmarks.filter((b: Bookmark) => b.entityType === type);
  },
});
