import { vi, type Mock } from 'vitest';
import { useGameStore } from '@/state/useGameStore';

/** Shared bookmark-store harness for BookmarkButton specs. */
export const bookmarkedIds = new Set<string>();
export const mockToggleBookmark: Mock = vi.fn();

export function resetBookmarkState() {
  bookmarkedIds.clear();
  mockToggleBookmark.mockClear();
  // Inject fake state into the real store — vi.mock's importOriginal arg
  // does not exist under bun:test.
  useGameStore.setState({
    isBookmarked: (_type: string, id: string) => bookmarkedIds.has(id),
    toggleBookmark: mockToggleBookmark,
  } as never);
}
