// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';

vi.mock('@/engine/training', () => ({
  computeGainChance: vi.fn(() => 0),
}));

vi.mock('@/engine/potential', () => ({
  canGrow: vi.fn(() => true),
}));

vi.mock('@/engine/training/trainingGains/traitTraining', () => ({
  traitTrainingPool: vi.fn(() => []),
  canAcquireTrait: vi.fn(() => false),
  TRAIT_CAP: 3,
}));

import { computeGainChance } from '@/engine/training';
import { WarriorTrainingCard } from '@/components/warrior/WarriorTrainingCard';
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

const defaultProps = {
  assignment: undefined,
  seasonalGains: {},
  trainers: [],
  onAssign: vi.fn(),
  onAssignRecovery: vi.fn(),
  onClear: vi.fn(),
};

describe('WarriorTrainingCard heat-tint bar', () => {
  beforeEach(() => {
    vi.mocked(computeGainChance).mockReturnValue(0);
  });

  function renderCard(warrior = makeWarrior()) {
    return render(
      <TooltipProvider>
        <WarriorTrainingCard warrior={warrior} {...defaultProps} />
      </TooltipProvider>
    );
  }

  it('uses muted color class when chance = 0', () => {
    vi.mocked(computeGainChance).mockReturnValue(0);
    const { container } = renderCard();
    const bars = container.querySelectorAll('[data-testid^="training-bar-"]');
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0]?.getAttribute('data-chance-class')).toContain('muted');
  });

  it('uses arena-gold color class when chance = 25', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.25);
    const { container } = renderCard();
    const bars = container.querySelectorAll('[data-testid^="training-bar-"]');
    expect(bars[0]?.getAttribute('data-chance-class')).toContain('arena-gold');
  });

  it('uses primary color class when chance = 55', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.55);
    const { container } = renderCard();
    const bars = container.querySelectorAll('[data-testid^="training-bar-"]');
    expect(bars[0]?.getAttribute('data-chance-class')).toContain('primary');
  });

  it('uses arena-fame color class when chance = 80', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.8);
    const { container } = renderCard();
    const bars = container.querySelectorAll('[data-testid^="training-bar-"]');
    expect(bars[0]?.getAttribute('data-chance-class')).toContain('arena-fame');
  });

  it('ceiling marker renders with arena-gold class when potential is revealed', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.4);
    const { container } = renderCard();
    const markers = container.querySelectorAll('[data-testid^="ceiling-marker-"]');
    expect(markers.length).toBeGreaterThan(0);
    markers.forEach((m) => {
      expect(m.getAttribute('class')).toContain('arena-gold');
    });
  });

  it('ceiling marker is absent when potential is not revealed', () => {
    vi.mocked(computeGainChance).mockReturnValue(0.4);
    const { container } = renderCard(makeWarrior({ potentialRevealed: {} }));
    const markers = container.querySelectorAll('[data-testid^="ceiling-marker-"]');
    expect(markers.length).toBe(0);
  });
});
