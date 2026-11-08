// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { FightSummary } from '@/types/game';
import { FightingStyle } from '@/types/shared.types';

vi.mock('@/components/EntityLink', () => ({ ...__SHARED_MOCKS.entityLinks }));

vi.mock('@/components/ui/Surface', () => ({ ...__SHARED_MOCKS.uiSurface }));

vi.mock('@/components/ui/badge', () => __SHARED_MOCKS.uiBadge);

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children }: any) => <td>{children}</td>,
}));

vi.mock('@/components/ui/tooltip', () => ({ ...__SHARED_MOCKS.tooltip }));

import {
  GazetteLeaderboard,
  BestByStyle,
  RisingStars,
} from '@/components/gazette/GazetteLeaderboards';

function makeFight(
  a: string,
  d: string,
  winner: 'A' | 'D',
  styleA = FightingStyle.StrikingAttack,
  styleD = FightingStyle.TotalParry
): FightSummary {
  return {
    title: `${a} vs ${d}`,
    warriorIdA: `id-${a}` as any,
    warriorIdD: `id-${d}` as any,
    winner,
    by: 'Decision',
    week: 1,
    styleA,
    styleD,
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

  it('BestByStyle lists the styles actually fought — no stale "No Data" rows', () => {
    // Regression: the style list was hardcoded to names that are not real
    // FightingStyle values, so every row rendered "No Data" forever.
    render(<BestByStyle allFights={fights} />);
    expect(screen.getByText(FightingStyle.StrikingAttack)).toBeInTheDocument();
    expect(screen.getByText(FightingStyle.TotalParry)).toBeInTheDocument();
    // Brutus won 3 fights as a Striking-Attack fighter — he leads that style.
    const links = screen.getAllByTestId('warrior-link');
    expect(links.some((l) => l.getAttribute('data-name') === 'Brutus')).toBe(true);
    expect(screen.queryByText('No Data')).not.toBeInTheDocument();
  });

  it('RisingStars renders warrior names as WarriorLink', () => {
    render(<RisingStars allFights={fights} />);
    const links = screen.getAllByTestId('warrior-link');
    expect(links.length).toBeGreaterThan(0);
  });
});
