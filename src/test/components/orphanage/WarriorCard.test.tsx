// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { OrphanWarrior } from '@/data/orphanPool';
import type { FightingStyle, Attributes } from '@/types/shared.types';

vi.mock('@/engine/skillCalc', () => ({
  computeWarriorStats: () => ({
    derivedStats: { hp: 100 },
    baseStats: { att: 10, def: 10, ini: 10, par: 10, rip: 10, dec: 10 },
  }),
}));

vi.mock('@/data/orphanPool', () => ({
  TRAIT_DATA: {
    test_trait: {
      name: 'Test Trait',
      description: 'A test trait',
      effect: {},
    },
  },
}));

vi.mock('@/components/ui/WarriorBadges', () => ({
  StatBadge: ({ styleName }: { styleName: string }) => (
    <span data-testid="stat-badge">{styleName}</span>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => children,
}));

import WarriorCard from '@/components/orphanage/WarriorCard';

const attrs: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

function makeOrphan(overrides: Partial<OrphanWarrior> = {}): OrphanWarrior {
  return {
    id: 'ow1',
    name: 'TestWarrior',
    age: 20,
    style: 'StrikingAttack' as FightingStyle,
    attrs: { ...attrs },
    lore: 'A mysterious fighter from the hills.',
    trait: 'test_trait',
    origin: 'Highland',
    potential: { ST: 20, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
    ...overrides,
  };
}

const baseCardProps = { isSelected: false, canSelect: true };

describe('WarriorCard', () => {
  it('does not render a POT grade label', () => {
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={vi.fn()} />);
    expect(container.textContent).not.toMatch(/\bPOT\b/);
  });

  it('does not render any potential grade letter (S/A/B/C/D) as a standalone grade', () => {
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={vi.fn()} />);
    expect(container.textContent).not.toMatch(/POT\s*:?\s*[SABCDE]/i);
  });

  it('does not render grade-legend tooltip content', () => {
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={vi.fn()} />);
    expect(container.textContent).not.toMatch(/85\+/);
    expect(container.textContent).not.toMatch(/near-maximum ceiling/i);
    expect(container.textContent).not.toMatch(/70.?84/);
    expect(container.textContent).not.toMatch(/55.?69/);
    expect(container.textContent).not.toMatch(/below 55/i);
  });

  it('renders HP value', () => {
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={vi.fn()} />);
    expect(container.textContent).toContain('100');
  });

  it('renders the warrior name', () => {
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={vi.fn()} />);
    expect(container.textContent).toContain('TestWarrior');
  });

  it('renders the trait name', () => {
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={vi.fn()} />);
    expect(container.textContent).toContain('Test Trait');
  });

  it('renders the origin', () => {
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={vi.fn()} />);
    expect(container.textContent).toContain('Highland');
  });

  it('renders the lore', () => {
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={vi.fn()} />);
    expect(container.textContent).toContain('mysterious fighter');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={onClick} />);
    const card = container.querySelector('[role="button"]') || container.firstElementChild;
    fireEvent.click(card!);
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onClick on Enter key press', () => {
    const onClick = vi.fn();
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={onClick} />);
    const card = container.querySelector('[role="button"]') || container.firstElementChild;
    fireEvent.keyDown(card!, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onClick on Space key press', () => {
    const onClick = vi.fn();
    const { container } = render(<WarriorCard {...baseCardProps} warrior={makeOrphan()} onClick={onClick} />);
    const card = container.querySelector('[role="button"]') || container.firstElementChild;
    fireEvent.keyDown(card!, { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });
});
