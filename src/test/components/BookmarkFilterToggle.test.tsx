// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';

describe('BookmarkFilterToggle', () => {
  it('renders in inactive state', () => {
    render(<BookmarkFilterToggle active={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Bookmarked Only')).toBeInTheDocument();
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
  });

  it('renders in active state', () => {
    render(<BookmarkFilterToggle active={true} onToggle={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<BookmarkFilterToggle active={false} onToggle={onToggle} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('displays count badge when provided', () => {
    render(<BookmarkFilterToggle active={false} onToggle={vi.fn()} count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not display count badge when not provided', () => {
    render(<BookmarkFilterToggle active={false} onToggle={vi.fn()} />);
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('sets aria-pressed to reflect active state', () => {
    const { rerender } = render(<BookmarkFilterToggle active={false} onToggle={vi.fn()} />);
    let btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    rerender(<BookmarkFilterToggle active={true} onToggle={vi.fn()} />);
    btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });
});
