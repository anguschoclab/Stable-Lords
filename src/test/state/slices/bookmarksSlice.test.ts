import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createBookmarksSlice, BookmarksSlice } from '@/state/slices/bookmarksSlice';

const createTestStore = () =>
  create<BookmarksSlice>()(
    immer((set, get, ...args) => ({
      ...(createBookmarksSlice as any)(set, get, ...args),
    }))
  );

describe('BookmarksSlice', () => {
  let useTestStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useTestStore = createTestStore();
  });

  it('should initialize with an empty bookmarks array', () => {
    const { bookmarks } = useTestStore.getState();
    expect(bookmarks).toEqual([]);
  });

  it('should add a bookmark via toggleBookmark', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');

    const { bookmarks } = useTestStore.getState();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0]).toMatchObject({
      entityType: 'warrior',
      entityId: 'w1',
    });
    expect(bookmarks[0]!.createdAt).toBeDefined();
  });

  it('should remove an existing bookmark via toggleBookmark', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('warrior', 'w1');

    const { bookmarks } = useTestStore.getState();
    expect(bookmarks).toEqual([]);
  });

  it('should support multiple entity types', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('rival', 'r1');
    useTestStore.getState().toggleBookmark('promoter', 'p1');
    useTestStore.getState().toggleBookmark('trainer', 't1');
    useTestStore.getState().toggleBookmark('tournament', 'tr1');
    useTestStore.getState().toggleBookmark('boutOffer', 'bo1');
    useTestStore.getState().toggleBookmark('scoutReport', 'sr1');

    const { bookmarks } = useTestStore.getState();
    expect(bookmarks).toHaveLength(7);
    const types = bookmarks.map((b) => b.entityType);
    expect(types).toContain('warrior');
    expect(types).toContain('rival');
    expect(types).toContain('promoter');
    expect(types).toContain('trainer');
    expect(types).toContain('tournament');
    expect(types).toContain('boutOffer');
    expect(types).toContain('scoutReport');
  });

  it('should allow multiple bookmarks of the same type with different ids', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('warrior', 'w2');
    useTestStore.getState().toggleBookmark('warrior', 'w3');

    const { bookmarks } = useTestStore.getState();
    expect(bookmarks).toHaveLength(3);
  });

  it('should not add duplicate bookmarks for the same entity', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('warrior', 'w1');

    const { bookmarks } = useTestStore.getState();
    expect(bookmarks).toHaveLength(1);
  });

  it('isBookmarked should return true for existing bookmarks', () => {
    useTestStore.getState().toggleBookmark('rival', 'r1');

    expect(useTestStore.getState().isBookmarked('rival', 'r1')).toBe(true);
  });

  it('isBookmarked should return false for non-existent bookmarks', () => {
    useTestStore.getState().toggleBookmark('rival', 'r1');

    expect(useTestStore.getState().isBookmarked('rival', 'r2')).toBe(false);
    expect(useTestStore.getState().isBookmarked('warrior', 'r1')).toBe(false);
  });

  it('isBookmarked should return false when bookmarks array is empty', () => {
    expect(useTestStore.getState().isBookmarked('warrior', 'w1')).toBe(false);
  });

  it('getBookmarksByType should filter by entity type', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('warrior', 'w2');
    useTestStore.getState().toggleBookmark('rival', 'r1');
    useTestStore.getState().toggleBookmark('promoter', 'p1');

    const warriors = useTestStore.getState().getBookmarksByType('warrior');
    const rivals = useTestStore.getState().getBookmarksByType('rival');
    const promoters = useTestStore.getState().getBookmarksByType('promoter');
    const empty = useTestStore.getState().getBookmarksByType('trainer');

    expect(warriors).toHaveLength(2);
    expect(rivals).toHaveLength(1);
    expect(promoters).toHaveLength(1);
    expect(empty).toEqual([]);
  });

  it('should maintain correct state after mixed add and remove operations', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('warrior', 'w2');
    useTestStore.getState().toggleBookmark('rival', 'r1');

    expect(useTestStore.getState().bookmarks).toHaveLength(3);

    useTestStore.getState().toggleBookmark('warrior', 'w1');

    expect(useTestStore.getState().bookmarks).toHaveLength(2);
    expect(useTestStore.getState().isBookmarked('warrior', 'w1')).toBe(false);
    expect(useTestStore.getState().isBookmarked('warrior', 'w2')).toBe(true);
    expect(useTestStore.getState().isBookmarked('rival', 'r1')).toBe(true);
  });

  it('removeBookmark should remove a specific bookmark', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('warrior', 'w2');

    useTestStore.getState().removeBookmark('warrior', 'w1');

    expect(useTestStore.getState().bookmarks).toHaveLength(1);
    expect(useTestStore.getState().isBookmarked('warrior', 'w1')).toBe(false);
    expect(useTestStore.getState().isBookmarked('warrior', 'w2')).toBe(true);
  });

  it('removeBookmark should be idempotent for non-existent bookmarks', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');

    useTestStore.getState().removeBookmark('warrior', 'w2');

    expect(useTestStore.getState().bookmarks).toHaveLength(1);
  });

  it('clearBookmarks should remove all bookmarks', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('rival', 'r1');
    useTestStore.getState().toggleBookmark('promoter', 'p1');

    useTestStore.getState().clearBookmarks();

    expect(useTestStore.getState().bookmarks).toEqual([]);
  });

  it('clearBookmarksByType should remove only bookmarks of the given type', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('warrior', 'w2');
    useTestStore.getState().toggleBookmark('rival', 'r1');
    useTestStore.getState().toggleBookmark('promoter', 'p1');

    useTestStore.getState().clearBookmarksByType('warrior');

    expect(useTestStore.getState().bookmarks).toHaveLength(2);
    expect(useTestStore.getState().isBookmarked('warrior', 'w1')).toBe(false);
    expect(useTestStore.getState().isBookmarked('warrior', 'w2')).toBe(false);
    expect(useTestStore.getState().isBookmarked('rival', 'r1')).toBe(true);
    expect(useTestStore.getState().isBookmarked('promoter', 'p1')).toBe(true);
  });

  it('cleanDanglingBookmarks should remove bookmarks for missing entities', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');
    useTestStore.getState().toggleBookmark('warrior', 'w2');
    useTestStore.getState().toggleBookmark('rival', 'r1');
    useTestStore.getState().toggleBookmark('promoter', 'p1');

    const validIds: Partial<
      Record<import('@/types/bookmark.types').BookmarkEntityType, Set<string>>
    > = {
      warrior: new Set(['w1']),
      rival: new Set(['r1']),
    };

    useTestStore.getState().cleanDanglingBookmarks(validIds);

    expect(useTestStore.getState().bookmarks).toHaveLength(2);
    expect(useTestStore.getState().isBookmarked('warrior', 'w1')).toBe(true);
    expect(useTestStore.getState().isBookmarked('warrior', 'w2')).toBe(false);
    expect(useTestStore.getState().isBookmarked('rival', 'r1')).toBe(true);
    expect(useTestStore.getState().isBookmarked('promoter', 'p1')).toBe(false);
  });

  it('cleanDanglingBookmarks should be a no-op when all bookmarks are valid', () => {
    useTestStore.getState().toggleBookmark('warrior', 'w1');

    const validIds: Partial<
      Record<import('@/types/bookmark.types').BookmarkEntityType, Set<string>>
    > = {
      warrior: new Set(['w1']),
    };

    useTestStore.getState().cleanDanglingBookmarks(validIds);

    expect(useTestStore.getState().bookmarks).toHaveLength(1);
    expect(useTestStore.getState().isBookmarked('warrior', 'w1')).toBe(true);
  });
});
