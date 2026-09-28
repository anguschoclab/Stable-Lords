// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Attributes } from '@/types/shared.types';
import type { Warrior, AttributePotential } from '@/types/warrior.types';
import { makeSpartacusWarrior } from '@/test/_fixtures/factories';

vi.mock('@/components/ui/tooltip', async () => await import('@/test/_mocks/tooltip'))

vi.mock('@/components/ui/WarriorBadges', () => ({
  WarriorNameTag: ({ name }: { name: string }) => <span data-testid="warrior-name">{name}</span>,
  StatBadge: ({ styleName }: { styleName: string }) => (
    <span data-testid="stat-badge">{styleName}</span>
  ),
}));

vi.mock('@/components/ui/StatBattery', () => ({
  StatBattery: ({ label, value, max }: { label: string; value: number; max: number }) => (
    <div data-testid={`stat-battery-${label}`} data-value={value} data-max={max} />
  ),
}));

vi.mock('@/components/bookmarks/BookmarkButton', () => ({
  BookmarkButton: () => <button data-testid="bookmark-btn">Bookmark</button>,
}));

vi.mock('@/components/warrior/traits/TraitBadge', () => ({
  TraitBadge: ({ traitId }: { traitId: string }) => (
    <span data-testid={`trait-badge-${traitId}`}>{traitId}</span>
  ),
}));

vi.mock('@/engine/warrior/potential', () => ({
  potentialRating: vi.fn(
    (p: Record<string, number>) =>
      Object.values(p).reduce((a, b) => a + b, 0) / Object.keys(p).length
  ),
  potentialGrade: vi.fn((rating: number) => {
    if (rating >= 20) return 'S';
    if (rating >= 17) return 'A';
    if (rating >= 14) return 'B';
    if (rating >= 11) return 'C';
    return 'D';
  }),
}));

vi.mock('@/engine/warrior/warriorValue', () => ({
  computeWarriorLiability: vi.fn(() => ({
    score: 0,
    recommendation: 'Keep',
    factors: [],
  })),
}));

import { potentialRating, potentialGrade } from '@/engine/warrior/potential';
import { computeWarriorLiability } from '@/engine/warrior/warriorValue';
import { RankStrip } from '@/components/stable/RankStrip';
import { PotentialBadge } from '@/components/stable/PotentialBadge';
import { LiabilityBadge } from '@/components/stable/LiabilityBadge';
import { AttributeMatrix } from '@/components/stable/AttributeMatrix';
import { TacticalSummary } from '@/components/stable/TacticalSummary';
import { RosterWarriorRow } from '@/components/stable/RosterWarriorRow';

const baseAttrs: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

const makeWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
  makeSpartacusWarrior({
    attributes: { ...baseAttrs },
    age: 24,
    potential: { ST: 20, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
    ...overrides,
  });

// ─── RankStrip ─────────────────────────────────────────────────────────────

describe('RankStrip', () => {
  it('renders rank number (rankIndex + 1)', () => {
    const { container } = render(<RankStrip rankIndex={2} />);
    expect(container.textContent).toContain('3');
  });

  it('renders RANK label', () => {
    const { container } = render(<RankStrip rankIndex={0} />);
    expect(container.textContent).toContain('RANK');
  });

  it('renders Crown icon for rank 0', () => {
    const { container } = render(<RankStrip rankIndex={0} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('does not render Crown icon for rank > 0', () => {
    const { container } = render(<RankStrip rankIndex={1} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(0);
  });

  it('applies arena-gold class for rank 0', () => {
    const { container } = render(<RankStrip rankIndex={0} />);
    expect(container.innerHTML).toContain('arena-gold');
  });

  it('applies primary class for rank 1', () => {
    const { container } = render(<RankStrip rankIndex={1} />);
    expect(container.innerHTML).toContain('primary');
  });
});

// ─── PotentialBadge ────────────────────────────────────────────────────────

describe('PotentialBadge', () => {
  beforeEach(() => {
    vi.mocked(potentialRating).mockReturnValue(20);
    vi.mocked(potentialGrade).mockReturnValue('S');
  });

  it('renders POT label and grade', () => {
    const potential: AttributePotential = {
      ST: 20,
      CN: 20,
      SZ: 10,
      WT: 20,
      WL: 20,
      SP: 20,
      DF: 20,
    };
    const { container } = render(<PotentialBadge potential={potential} />);
    expect(container.textContent).toContain('POT');
    expect(container.textContent).toContain('S');
  });

  it('returns null when potential is null', () => {
    const { container } = render(<PotentialBadge potential={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when potential is undefined', () => {
    const { container } = render(<PotentialBadge potential={undefined} />);
    expect(container.innerHTML).toBe('');
  });

  it('applies arena-gold class for S grade', () => {
    vi.mocked(potentialGrade).mockReturnValue('S');
    const potential: AttributePotential = {
      ST: 25,
      CN: 25,
      SZ: 25,
      WT: 25,
      WL: 25,
      SP: 25,
      DF: 25,
    };
    const { container } = render(<PotentialBadge potential={potential} />);
    expect(container.innerHTML).toContain('arena-gold');
  });

  it('applies primary class for A grade', () => {
    vi.mocked(potentialGrade).mockReturnValue('A');
    const potential: AttributePotential = {
      ST: 20,
      CN: 20,
      SZ: 10,
      WT: 20,
      WL: 20,
      SP: 20,
      DF: 20,
    };
    const { container } = render(<PotentialBadge potential={potential} />);
    expect(container.innerHTML).toContain('primary');
  });
});

// ─── LiabilityBadge ────────────────────────────────────────────────────────

describe('LiabilityBadge', () => {
  beforeEach(() => {
    vi.mocked(computeWarriorLiability).mockReturnValue({
      score: 0,
      recommendation: 'Keep',
      factors: [],
    });
  });

  it('returns null when recommendation is Keep', () => {
    const warrior = makeWarrior();
    const { container } = render(<LiabilityBadge warrior={warrior} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders Consider releasing when recommendation is Release', () => {
    vi.mocked(computeWarriorLiability).mockReturnValue({
      score: 10,
      recommendation: 'Release',
      factors: [{ name: 'Age', weight: 5 }],
    });
    const warrior = makeWarrior();
    const { container } = render(<LiabilityBadge warrior={warrior} />);
    expect(container.textContent).toContain('Consider releasing');
  });

  it('renders Watch when recommendation is Monitor', () => {
    vi.mocked(computeWarriorLiability).mockReturnValue({
      score: 5,
      recommendation: 'Monitor',
      factors: [{ name: 'Age', weight: 2 }],
    });
    const warrior = makeWarrior();
    const { container } = render(<LiabilityBadge warrior={warrior} />);
    expect(container.textContent).toContain('Watch');
  });

  it('renders factor details in tooltip', () => {
    vi.mocked(computeWarriorLiability).mockReturnValue({
      score: 10,
      recommendation: 'Release',
      factors: [
        { name: 'Age', weight: 5 },
        { name: 'Injuries', weight: 3 },
      ],
    });
    const warrior = makeWarrior();
    const { container } = render(<LiabilityBadge warrior={warrior} />);
    expect(container.textContent).toContain('Age');
    expect(container.textContent).toContain('+5');
    expect(container.textContent).toContain('Injuries');
  });
});

// ─── AttributeMatrix ───────────────────────────────────────────────────────

describe('AttributeMatrix', () => {
  it('renders 7 StatBattery components', () => {
    const { container } = render(<AttributeMatrix attributes={baseAttrs} />);
    const batteries = container.querySelectorAll('[data-testid^="stat-battery-"]');
    expect(batteries.length).toBe(7);
  });

  it('passes correct value to each StatBattery', () => {
    const attrs: Attributes = { ST: 15, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
    const { container } = render(<AttributeMatrix attributes={attrs} />);
    const stBattery = container.querySelector('[data-testid="stat-battery-ST"]');
    expect(stBattery?.getAttribute('data-value')).toBe('15');
  });

  it('passes ATTRIBUTE_TRAINING.MAX_VALUE as max', () => {
    const { container } = render(<AttributeMatrix attributes={baseAttrs} />);
    const battery = container.querySelector('[data-testid="stat-battery-ST"]');
    expect(battery?.getAttribute('data-max')).toBe('25');
  });
});

// ─── TacticalSummary ───────────────────────────────────────────────────────

describe('TacticalSummary', () => {
  it('renders Condition label', () => {
    const { container } = render(<TacticalSummary injuryCount={0} />);
    expect(container.textContent).toContain('Condition');
  });

  it('renders Nominal when injuryCount is 0', () => {
    const { container } = render(<TacticalSummary injuryCount={0} />);
    expect(container.textContent).toContain('Nominal');
  });

  it('renders Compromised when injuryCount > 0', () => {
    const { container } = render(<TacticalSummary injuryCount={2} />);
    expect(container.textContent).toContain('Compromised');
  });

  it('renders Fight Report button', () => {
    const { container } = render(<TacticalSummary injuryCount={0} />);
    expect(container.textContent).toContain('Fight Report');
  });
});

// ─── RosterWarriorRow (integration) ────────────────────────────────────────

describe('RosterWarriorRow', () => {
  function renderRow(warrior = makeWarrior(), rankIndex = 0) {
    const onClick = vi.fn();
    const { container, getByRole } = render(
      <RosterWarriorRow warrior={warrior} rankIndex={rankIndex} onClick={onClick} />
    );
    return { container, getByRole, onClick };
  }

  it('renders warrior name', () => {
    const { container } = renderRow();
    expect(container.textContent).toContain('Spartacus');
  });

  it('renders rank number', () => {
    const { container } = renderRow(makeWarrior(), 2);
    expect(container.textContent).toContain('3');
  });

  it('calls onClick when clicked', () => {
    const { container, onClick } = renderRow();
    const btn = container.querySelector('[role="button"]')!;
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onClick on Enter key press', () => {
    const { container, onClick } = renderRow();
    const btn = container.querySelector('[role="button"]')!;
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onClick on Space key press', () => {
    const { container, onClick } = renderRow();
    const btn = container.querySelector('[role="button"]')!;
    fireEvent.keyDown(btn, { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });

  it('renders attribute batteries', () => {
    const { container } = renderRow();
    const batteries = container.querySelectorAll('[data-testid^="stat-battery-"]');
    expect(batteries.length).toBe(7);
  });

  it('renders victory rate', () => {
    const { container } = renderRow(makeWarrior({ career: { wins: 8, losses: 2, kills: 1 } }));
    expect(container.textContent).toContain('80%');
  });

  it('renders kills count', () => {
    const { container } = renderRow(makeWarrior({ career: { wins: 5, losses: 3, kills: 7 } }));
    expect(container.textContent).toContain('7');
  });

  it('renders trait badges (up to 3)', () => {
    const warrior = makeWarrior({ traits: ['brave', 'swift', 'strong', 'extra'] });
    const { container } = renderRow(warrior);
    const badges = container.querySelectorAll('[data-testid^="trait-badge-"]');
    expect(badges.length).toBe(3);
  });

  it('renders potential badge when potential exists', () => {
    vi.mocked(potentialGrade).mockReturnValue('S');
    const warrior = makeWarrior({
      potential: { ST: 25, CN: 25, SZ: 25, WT: 25, WL: 25, SP: 25, DF: 25 },
    });
    const { container } = renderRow(warrior);
    expect(container.textContent).toContain('S');
  });

  it('renders liability badge when recommendation is not Keep', () => {
    vi.mocked(computeWarriorLiability).mockReturnValue({
      score: 10,
      recommendation: 'Release',
      factors: [],
    });
    const { container } = renderRow();
    expect(container.textContent).toContain('Consider releasing');
  });

  it('has aria-label with warrior name', () => {
    const { container } = renderRow();
    const btn = container.querySelector('[role="button"]')!;
    expect(btn.getAttribute('aria-label')).toContain('Spartacus');
  });
});
