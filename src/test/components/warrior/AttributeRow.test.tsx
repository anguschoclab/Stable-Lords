// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import type { TrainingAssignment, Attributes } from '@/types/game';

vi.mock('@/engine/training', () => ({
  computeGainChance: vi.fn(() => 0),
}));

vi.mock('@/engine/potential', () => ({
  canGrow: vi.fn(() => true),
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress" data-value={value} />
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { computeGainChance } from '@/engine/training';
import { canGrow } from '@/engine/potential';
import { AttributeRow } from '@/components/warrior/AttributeRow';
import { TooltipProvider } from '@/components/ui/tooltip';

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'w1' as WarriorId,
    name: 'Spartacus',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    injuries: [],
    career: { wins: 5, losses: 3, kills: 1 },
    fame: 7,
    popularity: 3,
    titles: [],
    flair: [],
    champion: false,
    status: 'Active',
    age: 24,
    fatigue: 0,
    potential: { ST: 20, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
    potentialRevealed: { ST: true, CN: true, SZ: true, WT: true, WL: true, SP: true, DF: true },
    traits: [],
    ...overrides,
  } as Warrior;
}

const baseProps = {
  assignment: undefined as TrainingAssignment | undefined,
  seasonalGains: {} as Partial<Record<keyof Attributes, number>>,
  trainers: [] as import('@/types/game').Trainer[],
  atCap: false,
  onAssign: vi.fn(),
};

function renderRow(key: keyof Attributes, warrior = makeWarrior(), props = {}) {
  return render(
    <TooltipProvider>
      <AttributeRow warrior={warrior} attributeKey={key} {...baseProps} {...props} />
    </TooltipProvider>
  );
}

describe('AttributeRow', () => {
  beforeEach(() => {
    vi.mocked(computeGainChance).mockReturnValue(0);
    vi.clearAllMocks();
  });

  it('renders data-testid="training-bar-{key}" with correct data-chance-class for muted', () => {
    vi.mocked(computeGainChance).mockReturnValue(0);
    const { container } = renderRow('ST');
    const bar = container.querySelector('[data-testid="training-bar-ST"]');
    expect(bar).toBeTruthy();
    expect(bar?.getAttribute('data-chance-class')).toContain('muted');
  });

  it('renders data-chance-class arena-gold when chance < 40', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.25);
    const { container } = renderRow('ST');
    const bar = container.querySelector('[data-testid="training-bar-ST"]');
    expect(bar?.getAttribute('data-chance-class')).toContain('arena-gold');
  });

  it('renders data-chance-class primary when chance < 70', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.55);
    const { container } = renderRow('ST');
    const bar = container.querySelector('[data-testid="training-bar-ST"]');
    expect(bar?.getAttribute('data-chance-class')).toContain('primary');
  });

  it('renders data-chance-class arena-fame when chance >= 70', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.8);
    const { container } = renderRow('ST');
    const bar = container.querySelector('[data-testid="training-bar-ST"]');
    expect(bar?.getAttribute('data-chance-class')).toContain('arena-fame');
  });

  it('renders ceiling marker when potential is revealed', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.4);
    const { container } = renderRow('ST');
    const marker = container.querySelector('[data-testid="ceiling-marker-ST"]');
    expect(marker).toBeTruthy();
    expect(marker?.getAttribute('class')).toContain('arena-gold');
  });

  it('does not render ceiling marker when potential is not revealed', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.4);
    const warrior = makeWarrior({ potentialRevealed: {} });
    const { container } = renderRow('ST', warrior);
    const marker = container.querySelector('[data-testid="ceiling-marker-ST"]');
    expect(marker).toBeNull();
  });

  it('disables button when attribute is SZ', () => {
    const { container } = renderRow('SZ');
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('disables button when attribute is maxed (val >= 25)', () => {
    const warrior = makeWarrior({
      attributes: { ST: 25, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    });
    const { container } = renderRow('ST', warrior);
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('disables button when atCap is true', () => {
    const { container } = renderRow('ST', makeWarrior(), { atCap: true });
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('disables button when seasonCapped', () => {
    const { container } = renderRow('ST', makeWarrior(), {
      seasonalGains: { ST: 3 },
    });
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('disables button when ceilingHit', () => {
    vi.mocked(canGrow).mockReturnValue(false);
    const warrior = makeWarrior({
      attributes: { ST: 20, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      potential: { ST: 20, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
    });
    const { container } = renderRow('ST', warrior);
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('shows MAX text when attribute is maxed', () => {
    const warrior = makeWarrior({
      attributes: { ST: 25, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    });
    const { container } = renderRow('ST', warrior);
    expect(container.textContent).toContain('MAX');
  });

  it('shows 3/3 text when season-capped', () => {
    const { container } = renderRow('ST', makeWarrior(), {
      seasonalGains: { ST: 3 },
    });
    expect(container.textContent).toContain('3/3');
  });

  it('shows chance percentage when not disabled', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.55);
    const { container } = renderRow('ST');
    expect(container.textContent).toContain('55%');
  });

  it('calls onAssign when clicked and not disabled', () => {
    const onAssign = vi.fn();
    const { container } = renderRow('ST', makeWarrior(), { onAssign });
    const button = container.querySelector('button');
    expect(button).not.toBeDisabled();
    fireEvent.click(button!);
    expect(onAssign).toHaveBeenCalledWith('ST');
  });

  it('does not call onAssign when disabled', () => {
    const onAssign = vi.fn();
    const { container } = renderRow('SZ', makeWarrior(), { onAssign });
    const button = container.querySelector('button');
    fireEvent.click(button!);
    expect(onAssign).not.toHaveBeenCalled();
  });

  it('shows selected check icon when isSelected', () => {
    const assignment: TrainingAssignment = {
      warriorId: 'w1' as WarriorId,
      type: 'attribute',
      attribute: 'ST',
    };
    const { container } = renderRow('ST', makeWarrior(), { assignment });
    expect(container.textContent).toContain('ST');
  });
});
