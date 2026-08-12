import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FightsList from '@/components/awards/FightsList';
import UpsetsList, { type UpsetEntry } from '@/components/awards/UpsetsList';
import type { FightSummary } from '@/types/game';

const mockFights: FightSummary[] = [
  {
    id: 'f1' as never,
    title: 'Alice vs Bob',
    winner: 'A',
    by: 'KO',
    week: 1,
    flashyTags: ['Upset'],
    warriorIdA: 'w1' as never,
    warriorIdD: 'w2' as never,
    styleA: 'Bashing Attack',
    styleD: 'Parry',
    createdAt: '2024-01-01',
  },
  {
    id: 'f2' as never,
    title: 'Carol vs Dave',
    winner: 'D',
    by: 'Kill',
    week: 2,
    warriorIdA: 'w3' as never,
    warriorIdD: 'w4' as never,
    styleA: 'Striking Attack',
    styleD: 'Evasion',
    createdAt: '2024-01-02',
  },
];

const mockUpsets: UpsetEntry[] = [
  { winner: 'Alice', loser: 'Bob', by: 'KO', fameDiff: 50, week: 1 },
  { winner: 'Carol', loser: 'Dave', by: 'Kill', fameDiff: 30, round: 2 },
];

describe('FightsList', () => {
  it('renders null when fights is empty', () => {
    const { container } = render(<FightsList fights={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when fights is undefined', () => {
    const { container } = render(<FightsList fights={undefined as unknown as FightSummary[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders fight count in trigger', () => {
    render(<FightsList fights={mockFights} />);
    expect(screen.getByText(/All Bouts \(2\)/)).toBeInTheDocument();
  });

  it('renders with getRound callback', () => {
    render(<FightsList fights={mockFights} getRound={(id) => (id === 'f1' ? 1 : 2)} />);
    expect(screen.getByText(/All Bouts \(2\)/)).toBeInTheDocument();
  });
});

describe('UpsetsList', () => {
  it('renders null when upsets is empty', () => {
    const { container } = render(<UpsetsList upsets={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders upset count in trigger', () => {
    render(<UpsetsList upsets={mockUpsets} />);
    expect(screen.getByText(/Biggest Upsets \(2\)/)).toBeInTheDocument();
  });

  it('renders null when upsets is undefined', () => {
    const { container } = render(<UpsetsList upsets={undefined as unknown as UpsetEntry[]} />);
    expect(container.firstChild).toBeNull();
  });
});
