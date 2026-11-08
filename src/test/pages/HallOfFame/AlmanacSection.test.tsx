// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { AlmanacData } from '@/engine/analytics/almanac';
import { AlmanacSection } from '@/pages/HallOfFame/components/AlmanacSection';

vi.mock('@/components/EntityLink', () => ({ ...__SHARED_MOCKS.entityLinks }));
vi.mock('@/components/ui/Surface', () => ({ ...__SHARED_MOCKS.uiSurface }));
vi.mock('@/components/ui/badge', () => __SHARED_MOCKS.uiBadge);
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const data: AlmanacData = {
  career: [
    {
      id: 'wins',
      title: 'Most Wins',
      kind: 'warrior',
      rows: [
        {
          key: 'w1',
          name: 'Gladiator',
          warriorId: 'w1',
          value: 82,
          valueLabel: 'wins',
          detail: '82W · 34L · 7K',
          isPlayer: true,
        },
        { key: 'w2', name: 'Reaper', warriorId: 'w2', value: 44, valueLabel: 'wins' },
      ],
    },
    {
      id: 'fame',
      title: 'Highest Fame',
      kind: 'warrior',
      rows: [{ key: 'w1', name: 'Gladiator', warriorId: 'w1', value: 287, valueLabel: 'fame' }],
    },
  ],
  accolades: [
    {
      id: 'accolade-WARRIOR_OF_YEAR',
      title: 'Warrior of the Year',
      kind: 'scroll',
      rows: [{ key: 'y2', name: 'Champ Two', sub: 'Year 2', value: 33 }],
    },
  ],
  championships: [
    {
      id: 'currentChampions',
      title: 'Current Champions',
      kind: 'warrior',
      rows: [{ key: 'w9-arena_a', name: 'Old King', value: 50, valueLabel: 'weeks' }],
    },
  ],
  streaks: [
    {
      id: 'winStreaks',
      title: 'Best Win Streaks',
      kind: 'warrior',
      caveat: 'Recorded fight window only',
      rows: [{ key: 'w1', name: 'Gladiator', warriorId: 'w1', value: 7, valueLabel: 'wins' }],
    },
  ],
  styleArena: [],
  fights: [
    {
      id: 'fightOfWeek',
      title: 'Fight of the Week',
      kind: 'fight',
      rows: [
        {
          key: 'h1',
          name: 'w1 vs w3',
          fightId: 'f2',
          fightTitle: 'w1 vs w3',
          fightBy: 'Kill',
          fightWeek: 5,
          value: 0,
        },
        { key: 'h2', name: 'Archived bout', value: 0, archived: true, fightWeek: 40 },
      ],
    },
  ],
  stables: [],
  world: [
    { label: 'Total Bouts', value: 1200 },
    { label: 'Total Deaths', value: 3 },
    { label: 'Year', value: 4 },
  ],
};

describe('AlmanacSection', () => {
  it('renders every populated board with its rows', () => {
    render(<AlmanacSection data={data} />);

    const wins = screen.getByTestId('almanac-board-wins');
    expect(within(wins).getByText('Most Wins')).toBeInTheDocument();
    expect(within(wins).getByText('Gladiator')).toBeInTheDocument();
    expect(within(wins).getByText('Reaper')).toBeInTheDocument();
    expect(within(wins).getByText('82')).toBeInTheDocument();

    expect(screen.getByTestId('almanac-board-accolade-WARRIOR_OF_YEAR')).toBeInTheDocument();
    expect(screen.getByTestId('almanac-board-currentChampions')).toBeInTheDocument();
    expect(screen.getByTestId('almanac-board-fightOfWeek')).toBeInTheDocument();
  });

  it('surfaces caveats on windowed boards', () => {
    render(<AlmanacSection data={data} />);
    const streaks = screen.getByTestId('almanac-board-winStreaks');
    expect(within(streaks).getByText(/recorded/i)).toBeInTheDocument();
  });

  it('renders archived hall-of-fame entries without links', () => {
    render(<AlmanacSection data={data} />);
    const board = screen.getByTestId('almanac-board-fightOfWeek');
    expect(within(board).getAllByText(/archived|lost to history/i).length).toBeGreaterThan(0);
  });

  it('renders the world stat strip', () => {
    render(<AlmanacSection data={data} />);
    expect(screen.getByText('Total Bouts')).toBeInTheDocument();
    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('Total Deaths')).toBeInTheDocument();
  });

  it('renders an honest empty state when nothing is recorded yet', () => {
    render(
      <AlmanacSection
        data={{
          career: [],
          accolades: [],
          championships: [],
          streaks: [],
          styleArena: [],
          fights: [],
          stables: [],
          world: [],
        }}
      />
    );
    expect(screen.getAllByText(/no records|awaiting|nothing recorded/i).length).toBeGreaterThan(0);
  });
});
