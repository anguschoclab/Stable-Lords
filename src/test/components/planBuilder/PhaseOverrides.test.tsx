// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';
import PhaseOverrides from '@/components/planBuilder/PhaseOverrides';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/shared.types';

const basePlan: FightPlan = {
  style: FightingStyle.StrikingAttack,
  OE: 5,
  AL: 5,
  killDesire: 5,
  offensiveTactic: 'Lunge',
  defensiveTactic: 'Dodge',
};

describe('PhaseOverrides', () => {
  it('renders "Phase Overrides" label with htmlFor association', () => {
    const { container } = render(<PhaseOverrides plan={basePlan} onPlanChange={vi.fn()} />);
    const label = container.querySelector('label[for="phase-overrides-switch"]');
    expect(label).toBeInTheDocument();
    expect(label?.textContent).toMatch(/phase overrides/i);
  });

  it('renders a switch with id="phase-overrides-switch"', () => {
    render(<PhaseOverrides plan={basePlan} onPlanChange={vi.fn()} />);
    const sw = document.getElementById('phase-overrides-switch');
    expect(sw).toBeInTheDocument();
  });

  it('does not render phase sliders when switch is off', () => {
    render(<PhaseOverrides plan={basePlan} onPlanChange={vi.fn()} />);
    expect(screen.queryByText('opening')).not.toBeInTheDocument();
  });

  it('renders opening, mid, late phase labels when switch is toggled on', () => {
    render(
      <PhaseOverrides
        plan={{
          ...basePlan,
          phases: {
            opening: { OE: 3, AL: 5, killDesire: 5 },
          },
        }}
        onPlanChange={vi.fn()}
      />
    );
    expect(screen.getByText('opening')).toBeInTheDocument();
    expect(screen.getByText('mid')).toBeInTheDocument();
    expect(screen.getByText('late')).toBeInTheDocument();
  });

  it('renders OE labels for each phase', () => {
    render(
      <PhaseOverrides
        plan={{
          ...basePlan,
          phases: {
            opening: { OE: 3, AL: 5, killDesire: 5 },
          },
        }}
        onPlanChange={vi.fn()}
      />
    );
    const oeLabels = screen.getAllByText('OE');
    expect(oeLabels.length).toBeGreaterThanOrEqual(3);
  });

  it('renders Clear button for phases that have overrides', () => {
    render(
      <PhaseOverrides
        plan={{
          ...basePlan,
          phases: {
            opening: { OE: 3, AL: 5, killDesire: 5 },
          },
        }}
        onPlanChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Clear phase opening' })).toBeInTheDocument();
  });

  it('does not render Clear button for phases without overrides', () => {
    render(
      <PhaseOverrides
        plan={{
          ...basePlan,
          phases: {
            opening: { OE: 3, AL: 5, killDesire: 5 },
          },
        }}
        onPlanChange={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: 'Clear phase mid' })).not.toBeInTheDocument();
  });

  it('calls onPlanChange when Clear button is clicked', () => {
    const onPlanChange = vi.fn();
    render(
      <PhaseOverrides
        plan={{
          ...basePlan,
          phases: {
            opening: { OE: 3, AL: 5, killDesire: 5 },
          },
        }}
        onPlanChange={onPlanChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear phase opening' }));
    expect(onPlanChange).toHaveBeenCalledOnce();
  });

  it('renders sliders with correct range (min=1, max=10) when phases are active', () => {
    const { container } = render(
      <PhaseOverrides
        plan={{
          ...basePlan,
          phases: {
            opening: { OE: 3, AL: 5, killDesire: 5 },
          },
        }}
        onPlanChange={vi.fn()}
      />
    );
    const sliders = container.querySelectorAll('[role="slider"]');
    expect(sliders.length).toBeGreaterThanOrEqual(3);
    for (const slider of sliders) {
      expect(slider).toHaveAttribute('aria-valuemin', '1');
      expect(slider).toHaveAttribute('aria-valuemax', '10');
    }
  });
});
