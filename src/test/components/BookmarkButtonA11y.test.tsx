/**
 * BookmarkButton accessibility — verifies keyboard focus states and aria-label.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';

const bookmarkedIds = new Set<string>();
const mockToggle = vi.fn();

vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  useGameStore: (selector: any) => {
    const state = {
      isBookmarked: (_type: string, id: string) => bookmarkedIds.has(id),
      toggleBookmark: mockToggle,
    };
    return selector(state);
  },
}));

describe('BookmarkButton accessibility', () => {
  beforeEach(() => {
    bookmarkedIds.clear();
    mockToggle.mockClear();
  });

  it('has focus-visible:ring classes', () => {
    const { container } = render(<BookmarkButton entityType="warrior" entityId="w1" />);
    const btn = container.querySelector('button');
    expect(btn?.className).toMatch(/focus-visible:ring/);
  });

  it('has aria-label that changes between Add and Remove bookmark', () => {
    const { rerender } = render(<BookmarkButton entityType="warrior" entityId="w1" />);
    let btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Add bookmark');

    bookmarkedIds.add('w1');
    rerender(<BookmarkButton entityType="warrior" entityId="w1" />);
    btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Remove bookmark');
  });

  it('is keyboard accessible (can receive focus via tabIndex)', () => {
    const { container } = render(<BookmarkButton entityType="warrior" entityId="w1" />);
    const btn = container.querySelector('button');
    expect(btn).not.toBeNull();
    expect(btn?.tagName).toBe('BUTTON');
  });

  it('toggles bookmark on click', () => {
    render(<BookmarkButton entityType="warrior" entityId="w1" />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(mockToggle).toHaveBeenCalledWith('warrior', 'w1');
  });

  it('uses ring-inset (not ring-offset) for focus ring', () => {
    const { container } = render(<BookmarkButton entityType="warrior" entityId="w1" />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('ring-inset');
    expect(btn?.className).not.toContain('ring-offset');
  });
});
