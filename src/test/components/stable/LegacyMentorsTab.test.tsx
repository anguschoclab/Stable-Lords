/**
 * LegacyMentorsTab — characterization tests for the mentor ranking pipeline.
 *
 * Pins the CURRENT behaviour before the single-pass loop refactor is applied:
 * score = legacyWins*2 + legacyKills*3 + fame; zero-score mentors excluded;
 * descending order; at most eight entries; empty state when nobody qualifies.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Trainer } from '@/types/shared.types';

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));
vi.mock('@/components/ui/SectionDivider', () => ({
  SectionDivider: ({ label }: any) => <div data-testid="divider">{label}</div>,
}));
vi.mock('@/components/ui/ImperialRing', () => ({
  ImperialRing: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('lucide-react', () => ({
  Award: () => <span />,
}));

import { LegacyMentorsTab } from '@/components/stable/LegacyMentorsTab';

function trainer(over: Partial<Trainer>): Trainer {
  return {
    id: over.id ?? 't',
    name: over.name ?? 'Trainer',
    tier: 'Seasoned',
    focus: 'Aggression',
    fame: 0,
    age: 40,
    contractWeeksLeft: 10,
    ...over,
  };
}

describe('LegacyMentorsTab ranking', () => {
  it('renders the empty state when no mentor has a positive score', () => {
    render(
      <LegacyMentorsTab
        currentTrainers={[
          trainer({ id: 'a', name: 'Nobody' }),
          trainer({ id: 'b', name: 'AlsoNobody', fame: 0 }),
        ]}
      />
    );
    expect(screen.getByText(/no mentor legacy recorded/i)).toBeInTheDocument();
  });

  it('renders the empty state for an empty roster', () => {
    render(<LegacyMentorsTab currentTrainers={[]} />);
    expect(screen.getByText(/no mentor legacy recorded/i)).toBeInTheDocument();
  });

  it('excludes mentors whose score is exactly zero', () => {
    render(
      <LegacyMentorsTab
        currentTrainers={[
          trainer({ id: 'zero', name: 'ZeroScore' }),
          trainer({ id: 'one', name: 'HasFame', fame: 1 }),
        ]}
      />
    );
    expect(screen.queryByText('ZeroScore')).not.toBeInTheDocument();
    expect(screen.getByText('HasFame')).toBeInTheDocument();
  });

  it('scores legacyWins*2 + legacyKills*3 + fame and sorts descending', () => {
    // kills dominate wins, wins dominate fame
    render(
      <LegacyMentorsTab
        currentTrainers={[
          trainer({ id: 'fame', name: 'FameOnly', fame: 100 }),
          trainer({ id: 'wins', name: 'WinsOnly', legacyWins: 60, fame: 0 }), // 120
          trainer({ id: 'kills', name: 'KillsOnly', legacyKills: 50, fame: 0 }), // 150
        ]}
      />
    );
    const names = screen.getAllByText(/Only$/).map((n) => n.textContent);
    expect(names).toEqual(['KillsOnly', 'WinsOnly', 'FameOnly']);
  });

  it('treats missing legacyWins/legacyKills as zero', () => {
    render(
      <LegacyMentorsTab
        currentTrainers={[
          trainer({ id: 'a', name: 'OnlyWins', legacyWins: 3, legacyKills: undefined, fame: 0 }),
        ]}
      />
    );
    // score 6 shows in the Score column
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('caps the list at eight mentors', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      trainer({ id: `t${i}`, name: `Mentor${String(i).padStart(2, '0')}`, fame: i + 1 })
    );
    render(<LegacyMentorsTab currentTrainers={many} />);
    // top 8 by fame: Mentor11..Mentor04
    expect(screen.getByText('Mentor11')).toBeInTheDocument();
    expect(screen.getByText('Mentor04')).toBeInTheDocument();
    expect(screen.queryByText('Mentor03')).not.toBeInTheDocument();
    expect(screen.queryByText('Mentor00')).not.toBeInTheDocument();
  });

  it('keeps equal scores in input order (stable sort)', () => {
    render(
      <LegacyMentorsTab
        currentTrainers={[
          trainer({ id: 'first', name: 'Alpha', fame: 5 }),
          trainer({ id: 'second', name: 'Beta', fame: 5 }),
        ]}
      />
    );
    const names = screen.getAllByText(/^(Alpha|Beta)$/).map((n) => n.textContent);
    expect(names).toEqual(['Alpha', 'Beta']);
  });
});
