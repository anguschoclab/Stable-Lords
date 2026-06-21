// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';

const bookmarkedIds = new Set<string>();
const mockToggle = vi.fn();

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector: any) => {
    const state = {
      isBookmarked: (_type: string, id: string) => bookmarkedIds.has(id),
      toggleBookmark: mockToggle,
    };
    return selector(state);
  },
}));

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
});
