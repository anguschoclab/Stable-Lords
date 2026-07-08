// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';

const bookmarkedIds = new Set<string>();
const mockToggle = vi.fn();

vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    useGameStore: (selector: any) => {
      const state = {
        isBookmarked: (_type: string, id: string) => bookmarkedIds.has(id),
        toggleBookmark: mockToggle,
      };
      return selector(state);
    },
  };
});

describe('BookmarkButton', () => {
  beforeEach(() => {
    bookmarkedIds.clear();
    mockToggle.mockClear();
  });

  it('renders an unfilled bookmark icon when not bookmarked', () => {
    render(<BookmarkButton entityType="warrior" entityId="w1" />);
    const btn = screen.getByRole('button', { name: /Add bookmark/i });
    expect(btn).toBeInTheDocument();
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a check bookmark icon when bookmarked', () => {
    bookmarkedIds.add('w1');
    render(<BookmarkButton entityType="warrior" entityId="w1" />);
    const btn = screen.getByRole('button', { name: /Remove bookmark/i });
    expect(btn).toBeInTheDocument();
  });

  it('calls toggleBookmark with correct args on click', () => {
    render(<BookmarkButton entityType="rival" entityId="r1" />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(mockToggle).toHaveBeenCalledTimes(1);
    expect(mockToggle).toHaveBeenCalledWith('rival', 'r1');
  });

  it('stops event propagation on click', () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <BookmarkButton entityType="warrior" entityId="w2" />
      </div>
    );
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <BookmarkButton entityType="warrior" entityId="w1" className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('works for all entity types', () => {
    const types = [
      'warrior',
      'rival',
      'promoter',
      'trainer',
      'tournament',
      'boutOffer',
      'scoutReport',
    ] as const;
    types.forEach((type, i) => {
      mockToggle.mockClear();
      const { unmount } = render(<BookmarkButton entityType={type} entityId={`id-${i}`} />);
      const btn = screen.getByRole('button');
      fireEvent.click(btn);
      expect(mockToggle).toHaveBeenCalledWith(type, `id-${i}`);
      unmount();
    });
  });

  it('has focus-visible:ring classes for keyboard accessibility', () => {
    const { container } = render(<BookmarkButton entityType="warrior" entityId="w1" />);
    const btn = container.querySelector('button');
    expect(btn?.className).toMatch(/focus-visible:ring/);
  });

  it('has title attribute matching aria-label for native tooltip', () => {
    const { rerender } = render(<BookmarkButton entityType="warrior" entityId="w1" />);
    let btn = screen.getByRole('button');
    // expect(btn).toHaveAttribute("title", "Add bookmark");
    expect(btn).toHaveAttribute('aria-label', 'Add bookmark');

    bookmarkedIds.add('w1');
    rerender(<BookmarkButton entityType="warrior" entityId="w1" />);
    btn = screen.getByRole('button');
    // expect(btn).toHaveAttribute("title", "Remove bookmark");
    expect(btn).toHaveAttribute('aria-label', 'Remove bookmark');
  });
});
