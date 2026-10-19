/**
 * Breadcrumbs — canonical chain + referrer-aware back chip.
 * The chain always names the entity's real parent; the back chip only
 * appears when the recorded referrer differs from that canonical parent.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

let mockPathname = '/warrior/w-1';
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...mod,
    useLocation: () => ({ pathname: mockPathname }),
    Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  };
});

import { Breadcrumbs } from '@/components/layout/breadcrumbs/Breadcrumbs';
import {
  recordVisit,
  resetNavTrail,
} from '@/components/layout/breadcrumbs/navTrail';
import { useGameStore } from '@/state/useGameStore';
import { clearEntityIndexCaches } from '@/engine/core/entityIndex';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { WarriorId } from '@/types/shared.types';

function seedStore() {
  useGameStore.setState({
    player: { id: 'p1', stableName: 'Crimson House', name: 'Player' } as never,
    roster: [makeWarrior({ id: 'w-1' as WarriorId, name: 'Alice' })],
    graveyard: [],
    retired: [],
    rivals: [],
    promoters: {},
    trainers: [],
  } as never);
}

describe('Breadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearEntityIndexCaches();
    resetNavTrail();
    seedStore();
    mockPathname = '/warrior/w-1';
  });

  it('renders the canonical chain with the leaf as a non-link current page', () => {
    render(<Breadcrumbs />);
    expect(screen.getByText('Stable').closest('a')).toHaveAttribute('href', '/stable');
    expect(screen.getByText('Roster').closest('a')).toHaveAttribute('href', '/stable/roster');
    const leaf = screen.getByText('Alice');
    expect(leaf).toHaveAttribute('aria-current', 'page');
    expect(leaf.closest('a')).toBeNull();
  });

  it('renders a referrer chip when the real referrer differs from the canonical parent', () => {
    recordVisit('/bookmarks', 'Bookmarks');
    recordVisit('/warrior/w-1', 'Alice');
    render(<Breadcrumbs />);
    const chip = screen.getByRole('link', { name: /bookmarks/i });
    expect(chip).toHaveAttribute('href', '/bookmarks');
  });

  it('suppresses the referrer chip when the referrer IS the canonical parent', () => {
    recordVisit('/stable/roster', 'Roster');
    recordVisit('/warrior/w-1', 'Alice');
    render(<Breadcrumbs />);
    // Exactly one "Roster" link — the canonical crumb, not a duplicated chip.
    expect(screen.getAllByRole('link', { name: /roster/i })).toHaveLength(1);
  });

  it('renders nothing on non-detail routes', () => {
    mockPathname = '/stable/roster';
    const { container } = render(<Breadcrumbs />);
    expect(container).toBeEmptyDOMElement();
  });
});
