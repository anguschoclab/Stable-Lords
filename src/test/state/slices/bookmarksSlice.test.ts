import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createBookmarksSlice, BookmarksSlice } from '@/state/slices/bookmarksSlice';
import { act } from '@testing-library/react';

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
    act(() => {
      useTestStore.getState().toggleBookmark('warrior', 'w1');
    });

    const { bookmarks } = useTestStore.getState();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0]).toMatchObject({
      entityType: 'warrior',
      entityId: 'w1',
    });
    expect(bookmarks[0]!.createdAt).toBeDefined();
  });

  it('should remove an existing bookmark via toggleBookmark', () => {
    act(() => {
      useTestStore.getState().toggleBookmark('warrior', 'w1');
      useTestStore.getState().toggleBookmark('warrior', 'w1');
    });

    const { bookmarks } = useTestStore.getState();
    expect(bookmarks).toEqual([]);
  });

  it('should support multiple entity types', () => {
    act(() => {
      useTestStore.getState().toggleBookmark('warrior', 'w1');
      useTestStore.getState().toggleBookmark('rival', 'r1');
      useTestStore.getState().toggleBookmark('promoter', 'p1');
      useTestStore.getState().toggleBookmark('trainer', 't1');
      useTestStore.getState().toggleBookmark('tournament', 'tr1');
      useTestStore.getState().toggleBookmark('boutOffer', 'bo1');
      useTestStore.getState().toggleBookmark('scoutReport', 'sr1');
    });

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
    act(() => {
      useTestStore.getState().toggleBookmark('warrior', 'w1');
      useTestStore.getState().toggleBookmark('warrior', 'w2');
      useTestStore.getState().toggleBookmark('warrior', 'w3');
    });

    const { bookmarks } = useTestStore.getState();
    expect(bookmarks).toHaveLength(3);
  });

  it('should not add duplicate bookmarks for the same entity', () => {
    act(() => {
      useTestStore.getState().toggleBookmark('warrior', 'w1');
      useTestStore.getState().toggleBookmark('warrior', 'w1');
      useTestStore.getState().toggleBookmark('warrior', 'w1');
    });

    const { bookmarks } = useTestStore.getState();
    expect(bookmarks).toHaveLength(1);
  });

  it('isBookmarked should return true for existing bookmarks', () => {
    act(() => {
      useTestStore.getState().toggleBookmark('rival', 'r1');
    });

    expect(useTestStore.getState().isBookmarked('rival', 'r1')).toBe(true);
  });

  it('isBookmarked should return false for non-existent bookmarks', () => {
    act(() => {
      useTestStore.getState().toggleBookmark('rival', 'r1');
    });

    expect(useTestStore.getState().isBookmarked('rival', 'r2')).toBe(false);
    expect(useTestStore.getState().isBookmarked('warrior', 'r1')).toBe(false);
  });

  it('isBookmarked should return false when bookmarks array is empty', () => {
    expect(useTestStore.getState().isBookmarked('warrior', 'w1')).toBe(false);
  });

  it('getBookmarksByType should filter by entity type', () => {
    act(() => {
      useTestStore.getState().toggleBookmark('warrior', 'w1');
      useTestStore.getState().toggleBookmark('warrior', 'w2');
      useTestStore.getState().toggleBookmark('rival', 'r1');
      useTestStore.getState().toggleBookmark('promoter', 'p1');
    });

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
    act(() => {
      useTestStore.getState().toggleBookmark('warrior', 'w1');
      useTestStore.getState().toggleBookmark('warrior', 'w2');
      useTestStore.getState().toggleBookmark('rival', 'r1');
    });

    expect(useTestStore.getState().bookmarks).toHaveLength(3);

    act(() => {
      useTestStore.getState().toggleBookmark('warrior', 'w1');
    });

    expect(useTestStore.getState().bookmarks).toHaveLength(2);
    expect(useTestStore.getState().isBookmarked('warrior', 'w1')).toBe(false);
    expect(useTestStore.getState().isBookmarked('warrior', 'w2')).toBe(true);
    expect(useTestStore.getState().isBookmarked('rival', 'r1')).toBe(true);
  });
});
