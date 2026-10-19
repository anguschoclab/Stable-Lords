/**
 * GlobalSearch — the always-visible entity finder in the nav rail.
 * Substring search over the unified entity index, grouped results,
 * keyboard navigation, and route-level destinations.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/stable' }),
  };
});

import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { useGameStore } from '@/state/useGameStore';
import { clearEntityIndexCaches } from '@/engine/core/entityIndex';
import { makeWarrior, makeRival, makeOwner } from '@/test/_fixtures/factories';
import type { WarriorId, StableId } from '@/types/shared.types';

function seedStore() {
  useGameStore.setState({
    player: { id: 'p1', stableName: 'Crimson House', name: 'Player' } as never,
    roster: [makeWarrior({ id: 'w-1' as WarriorId, name: 'Alice the Bold' })],
    graveyard: [makeWarrior({ id: 'w-2' as WarriorId, name: 'Dead Dave', status: 'Dead' })],
    retired: [],
    rivals: [
      makeRival({
        id: 'r1' as StableId,
        owner: makeOwner({ id: 'r1' as StableId, stableName: 'Iron Wolves' }),
        roster: [makeWarrior({ id: 'w-3' as WarriorId, name: 'Rival Ron' })],
      }),
    ],
    promoters: {},
    trainers: [],
  } as never);
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearEntityIndexCaches();
    seedStore();
  });

  it('shows no results below two characters', () => {
    render(<GlobalSearch />);
    const input = screen.getByRole('combobox', { name: /search/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('lists grouped matches with badges at two+ characters', () => {
    render(<GlobalSearch />);
    const input = screen.getByRole('combobox', { name: /search/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'alice' } });
    expect(screen.getByText('Alice the Bold')).toBeInTheDocument();
    expect(screen.getByText('Yours')).toBeInTheDocument();
  });

  it('surfaces fallen and rival warriors with their badges', () => {
    render(<GlobalSearch />);
    const input = screen.getByRole('combobox', { name: /search/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'da' } });
    expect(screen.getByText('Dead Dave')).toBeInTheDocument();
    expect(screen.getByText('Fallen')).toBeInTheDocument();
  });

  it('navigates to the entity route on Enter', () => {
    render(<GlobalSearch />);
    const input = screen.getByRole('combobox', { name: /search/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'ron' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: expect.stringContaining('/warrior/w-3') })
    );
  });

  it('navigates on click and fires onNavigate (drawer close) callback', () => {
    const onNavigate = vi.fn();
    render(<GlobalSearch onNavigate={onNavigate} />);
    const input = screen.getByRole('combobox', { name: /search/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'iron' } });
    fireEvent.click(screen.getByText('Iron Wolves'));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/world/stable/r1' })
    );
    expect(onNavigate).toHaveBeenCalled();
  });

  it('closes on Escape and shows an empty-state message for misses', () => {
    render(<GlobalSearch />);
    const input = screen.getByRole('combobox', { name: /search/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'zzzz' } });
    expect(screen.getByText(/no souls answer/i)).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
