/**
 * RosterWall — the player roster gains list-shell search over name,
 * epithet, and style; the bookmark filter composes with the search
 * results instead of fighting them.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...mod,
    useNavigate: () => vi.fn(),
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
      <a href={to}>{children}</a>
    ),
  };
});

import { RosterWall } from '@/components/stable/RosterWall';
import { useGameStore } from '@/state/useGameStore';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { WarriorId } from '@/types/shared.types';

function seed(roster: ReturnType<typeof makeWarrior>[]) {
  useGameStore.setState({
    roster,
    rivals: [],
    arenaChampions: {},
    absoluteWeek: 1,
    bookmarks: [],
  } as never);
}

describe('RosterWall — search', () => {
  beforeEach(() => {
    seed([
      makeWarrior({ id: 'w-1' as WarriorId, name: 'Karg', epithet: 'the Red' }),
      makeWarrior({ id: 'w-2' as WarriorId, name: 'Morga' }),
    ]);
  });

  it('filters roster rows by name', () => {
    render(
      <TooltipProvider>
        <RosterWall />
      </TooltipProvider>
    );
    const search = screen.getByLabelText('Filter roster');
    fireEvent.change(search, { target: { value: 'karg' } });
    expect(screen.getByLabelText('View profile for Karg')).toBeInTheDocument();
    expect(screen.queryByLabelText('View profile for Morga')).not.toBeInTheDocument();
  });

  it('filters roster rows by epithet', () => {
    render(
      <TooltipProvider>
        <RosterWall />
      </TooltipProvider>
    );
    const search = screen.getByLabelText('Filter roster');
    fireEvent.change(search, { target: { value: 'red' } });
    expect(screen.getByLabelText('View profile for Karg')).toBeInTheDocument();
    expect(screen.queryByLabelText('View profile for Morga')).not.toBeInTheDocument();
  });
});
