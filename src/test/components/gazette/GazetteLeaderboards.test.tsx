// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { FightSummary } from '@/types/game';

vi.mock('@/components/EntityLink', () => ({
  WarriorLink: ({ name, className }: { name: string; className?: string }) => (
    <span
      data-testid="warrior-link"
      data-name={name}
      className={className}
      aria-label={`Open details for warrior ${name}`}
    >
      {name}
    </span>
  ),
}));

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children }: any) => <td>{children}</td>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}));

import {
  GazetteLeaderboard,
  BestByStyle,
  RisingStars,
} from '@/components/gazette/GazetteLeaderboards';

function makeFight(a: string, d: string, winner: 'A' | 'D'): FightSummary {
  return {
    title: `${a} vs ${d}`,
    warriorIdA: `id-${a}` as any,
    warriorIdD: `id-${d}` as any,
    winner,
    by: 'Decision',
    week: 1,
    styleA: 'Brawler',
    styleD: 'Technician',
    fameA: 100,
    fameD: 50,
    flashyTags: [],
  } as any;
}

describe('GazetteLeaderboards', () => {
  const fights: FightSummary[] = [
    makeFight('Brutus', 'Cassius', 'A'),
    makeFight('Brutus', 'Maximus', 'A'),
    makeFight('Brutus', 'Spartacus', 'A'),
    makeFight('Cassius', 'Maximus', 'D'),
  ];

  it('GazetteLeaderboard renders warrior names as WarriorLink', () => {
    render(<GazetteLeaderboard allFights={fights} />);
    const links = screen.getAllByTestId('warrior-link');
    expect(links.length).toBeGreaterThan(0);
    expect(links.some((l) => l.getAttribute('data-name') === 'Brutus')).toBe(true);
  });

  it('GazetteLeaderboard preserves styling classes on WarriorLink', () => {
    render(<GazetteLeaderboard allFights={fights} />);
    const links = screen.getAllByTestId('warrior-link');
    expect(links[0]?.className).toContain('font-display');
  });

  it('BestByStyle renders warrior names as WarriorLink', () => {
    render(<BestByStyle allFights={fights} />);
    const links = screen.getAllByTestId('warrior-link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('RisingStars renders warrior names as WarriorLink', () => {
    render(<RisingStars allFights={fights} />);
    const links = screen.getAllByTestId('warrior-link');
    expect(links.length).toBeGreaterThan(0);
  });
});
