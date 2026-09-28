// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { makeTrainingWarrior, makeTrainingCardProps } from '@/test/_fixtures/trainingCard';

vi.mock('@/engine/training', () => ({
  computeGainChance: vi.fn(() => 0),
}));

vi.mock('@/engine/warrior/potential', () => ({
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

const makeWarrior = makeTrainingWarrior;

const defaultProps = makeTrainingCardProps();

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
