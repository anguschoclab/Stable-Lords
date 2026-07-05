// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComparisonHeader } from '@/components/scouting/ComparisonHeader';
import type { RivalStableData, Warrior } from '@/types/game';

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children, className }: any) => (
    <div data-testid="surface" className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

function makeRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1' as any,
    owner: {
      id: 'owner-1' as any,
      name: 'Owner One',
      stableName: 'Iron Wolves',
      fame: 100,
      renown: 50,
      titles: 2,
    },
    fame: 100,
    roster: [],
    treasury: 1000,
    ledger: [],
    trainingAssignments: [],
    tier: 'Established',
    ...overrides,
  } as RivalStableData;
}

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'w-1' as any,
    name: 'Brutus the Bold',
    style: 'Gladiator' as any,
    attributes: {} as any,
    fame: 50,
    popularity: 30,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 10, losses: 5, kills: 2 },
    champion: false,
    status: 'Active' as any,
    age: 25,
    traits: [],
    ...overrides,
  } as Warrior;
}

describe('ComparisonHeader', () => {
  // ── Stable variant ──────────────────────────────────────────────
  describe('kind="stable"', () => {
    const rivalA = makeRival({
      owner: { ...makeRival().owner, stableName: 'Iron Wolves' },
      tier: 'Established',
    });
    const rivalB = makeRival({
      id: 'rival-2' as any,
      owner: {
        id: 'owner-2' as any,
        name: 'Owner Two',
        stableName: 'Crimson Lions',
        fame: 80,
        renown: 40,
        titles: 1,
      },
      tier: 'Major',
    });

    it('renders stable names for both rivals', () => {
      const { getByText } = render(
        <ComparisonHeader kind="stable" rivalA={rivalA} rivalB={rivalB} />
      );
      expect(getByText('Iron Wolves')).toBeInTheDocument();
      expect(getByText('Crimson Lions')).toBeInTheDocument();
    });

    it('renders "Challenger" and "Defender" labels', () => {
      const { getByText } = render(
        <ComparisonHeader kind="stable" rivalA={rivalA} rivalB={rivalB} />
      );
      expect(getByText('Challenger')).toBeInTheDocument();
      expect(getByText('Defender')).toBeInTheDocument();
    });

    it('renders tier badges for both rivals', () => {
      const { getAllByTestId, getByText } = render(
        <ComparisonHeader kind="stable" rivalA={rivalA} rivalB={rivalB} />
      );
      const badges = getAllByTestId('badge');
      expect(badges).toHaveLength(2);
      expect(getByText('Established')).toBeInTheDocument();
      expect(getByText('Major')).toBeInTheDocument();
    });

    it('renders "VS" divider text', () => {
      const { getByText } = render(
        <ComparisonHeader kind="stable" rivalA={rivalA} rivalB={rivalB} />
      );
      expect(getByText('VS')).toBeInTheDocument();
    });

    it('renders ArrowLeftRight icon (lucide)', () => {
      const { container } = render(
        <ComparisonHeader kind="stable" rivalA={rivalA} rivalB={rivalB} />
      );
      const svg = container.querySelector('svg.lucide-arrow-left-right');
      expect(svg).toBeInTheDocument();
    });
  });

  // ── Warrior variant ─────────────────────────────────────────────
  describe('kind="warrior"', () => {
    const warriorA = makeWarrior({ name: 'Brutus the Bold', age: 25, status: 'Active' as any });
    const warriorB = makeWarrior({
      id: 'w-2' as any,
      name: 'Maximus the Merciless',
      age: 30,
      status: 'Injured' as any,
    });

    it('renders warrior names for both warriors', () => {
      const { getByText } = render(
        <ComparisonHeader kind="warrior" warriorA={warriorA} warriorB={warriorB} />
      );
      expect(getByText('Brutus the Bold')).toBeInTheDocument();
      expect(getByText('Maximus the Merciless')).toBeInTheDocument();
    });

    it('renders "Not Selected" when warrior is undefined', () => {
      const { getAllByText } = render(
        <ComparisonHeader kind="warrior" warriorA={undefined} warriorB={undefined} />
      );
      expect(getAllByText('Not Selected')).toHaveLength(2);
    });

    it('renders age and status subtitle when warrior is present', () => {
      const { getByText } = render(
        <ComparisonHeader kind="warrior" warriorA={warriorA} warriorB={warriorB} />
      );
      expect(getByText(/25 years/)).toBeInTheDocument();
      expect(getByText(/Active/)).toBeInTheDocument();
      expect(getByText(/30 years/)).toBeInTheDocument();
      expect(getByText(/Injured/)).toBeInTheDocument();
    });

    it('hides subtitle when warrior is undefined', () => {
      const { container } = render(
        <ComparisonHeader kind="warrior" warriorA={undefined} warriorB={undefined} />
      );
      const subtitles = container.querySelectorAll('.text-\\[9px\\].text-muted-foreground\\/60');
      expect(subtitles).toHaveLength(0);
    });
  });

  // ── Shared structure ────────────────────────────────────────────
  it('renders Surface with glass variant', () => {
    const { getByTestId } = render(
      <ComparisonHeader
        kind="stable"
        rivalA={makeRival()}
        rivalB={makeRival({ id: 'rival-2' as any })}
      />
    );
    expect(getByTestId('surface')).toBeInTheDocument();
  });

  it('renders gradient overlay div', () => {
    const { container } = render(
      <ComparisonHeader
        kind="stable"
        rivalA={makeRival()}
        rivalB={makeRival({ id: 'rival-2' as any })}
      />
    );
    const overlay = container.querySelector('.bg-gradient-to-r');
    expect(overlay).toBeInTheDocument();
  });
});
