/**
 * UI accessibility tests — verifies aria-labels, keyboard navigation,
 * focus-visible styles, and design token usage on key components.
 */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';
import { vi } from 'vitest';

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

vi.mock('@/engine/potential', () => ({
  potentialRating: () => 75,
  potentialGrade: () => 'A',
}));

vi.mock('@/components/ui/WarriorBadges', () => ({
  StatBadge: () => <span data-testid="stat-badge">Style</span>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => children,
}));

import WarriorCard from '@/components/orphanage/WarriorCard';

const COMPONENTS_DIR = path.resolve(__dirname, '../../components');

describe('AppHeader accessibility', () => {
  const appHeaderPath = path.join(COMPONENTS_DIR, 'layout', 'AppHeader.tsx');
  const source = fs.readFileSync(appHeaderPath, 'utf-8');

  it('SaveButton has aria-label', () => {
    expect(source).toMatch(/aria-label.*[Ss]ave/);
  });

  it('ResetButton has aria-label', () => {
    expect(source).toMatch(/aria-label.*[Rr]eset|[Ee]xpunge/);
  });

  it('ExitButton has aria-label', () => {
    expect(source).toMatch(/aria-label.*[Ee]xit/);
  });

  it('MuteButton has aria-label', () => {
    expect(source).toMatch(/aria-label.*[Mm]ute/);
  });

  it('ExecuteWeekButton has aria-label', () => {
    expect(source).toMatch(/aria-label.*[Ww]eek|[Ee]xecute/);
  });

  it('uses focus-visible styles (not just focus:)', () => {
    expect(source).toMatch(/focus-visible:/);
  });
});

describe('WarriorCard keyboard accessibility', () => {
  const mockWarrior = {
    id: 'w1',
    name: 'TestWarrior',
    style: 'AGG' as any,
    attrs: { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 },
    trait: 'test_trait',
    origin: 'Test origin',
    lore: 'Test lore',
    potential: { ATT: 80, DEF: 80, INI: 80, PAR: 80, RIP: 80, DEC: 80 },
  } as any;

  it('renders a div with role="button"', () => {
    const { container } = render(
      <WarriorCard warrior={mockWarrior} isSelected={false} canSelect={true} onClick={() => {}} />
    );
    const card = container.querySelector('[role="button"]');
    expect(card).not.toBeNull();
  });

  it('has tabIndex={0} for keyboard focus', () => {
    const { container } = render(
      <WarriorCard warrior={mockWarrior} isSelected={false} canSelect={true} onClick={() => {}} />
    );
    const card = container.querySelector('[tabindex="0"]');
    expect(card).not.toBeNull();
  });

  it('has aria-label or aria-pressed for screen readers', () => {
    const { container } = render(
      <WarriorCard warrior={mockWarrior} isSelected={false} canSelect={true} onClick={() => {}} />
    );
    const card = container.querySelector('[role="button"]');
    expect(card?.getAttribute('aria-label')).toBeTruthy();
  });

  it('responds to Enter and Space keys', () => {
    const onClick = vi.fn();
    const { container } = render(
      <WarriorCard warrior={mockWarrior} isSelected={false} canSelect={true} onClick={onClick} />
    );
    const card = container.querySelector('[role="button"]')!;
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('source file has onKeyDown handler', () => {
    const source = fs.readFileSync(
      path.join(COMPONENTS_DIR, 'orphanage', 'WarriorCard.tsx'),
      'utf-8'
    );
    expect(source).toMatch(/onKeyDown/);
  });
});

describe('Tournament design token fixes', () => {
  it('TournamentStatsHeader uses design tokens (no hardcoded hex colors)', () => {
    const source = fs.readFileSync(
      path.join(COMPONENTS_DIR, 'tournaments', 'schedule', 'TournamentStatsHeader.tsx'),
      'utf-8'
    );
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('TournamentBracket uses design tokens (no hardcoded hex in className)', () => {
    const source = fs.readFileSync(
      path.join(COMPONENTS_DIR, 'tournaments', 'TournamentBracket.tsx'),
      'utf-8'
    );
    expect(source).not.toMatch(/text-\[#[0-9a-fA-F]{3,8}\]/);
  });

  it('TournamentBracket subdirectory has focus-visible styles', () => {
    const bracketDir = path.join(COMPONENTS_DIR, 'tournaments', 'bracket');
    const files = fs.readdirSync(bracketDir).filter((f) => f.endsWith('.tsx'));
    const allSource = files
      .map((f) => fs.readFileSync(path.join(bracketDir, f), 'utf-8'))
      .join('\n');
    expect(allSource).toMatch(/focus-visible/);
  });
});
