// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';
import { OverrideSliders } from '@/components/warrior/condition/OverrideSliders';
import type { PlanCondition } from '@/types/shared.types';

function makeCond(overrides?: Partial<PlanCondition['override']>): PlanCondition {
  return {
    trigger: { type: 'HP_BELOW', value: 50 },
    override: {
      OE: undefined,
      AL: undefined,
      killDesire: undefined,
      ...overrides,
    },
  };
}

describe('OverrideSliders', () => {
  it('renders OE, AL, and KD labels', () => {
    render(<OverrideSliders cond={makeCond()} onSliderChange={vi.fn()} />);
    expect(screen.getByText(/OE/i)).toBeInTheDocument();
    expect(screen.getByText(/AL/i)).toBeInTheDocument();
    expect(screen.getByText(/KD/i)).toBeInTheDocument();
  });

  it('shows "set" button when override is undefined', () => {
    render(<OverrideSliders cond={makeCond()} onSliderChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Set OE override' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set AL override' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set Kill Desire override' })).toBeInTheDocument();
  });

  it('shows "clear" button when override is defined', () => {
    render(
      <OverrideSliders
        cond={makeCond({ OE: 5, AL: 3, killDesire: 7 })}
        onSliderChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Clear OE override' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear AL override' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear Kill Desire override' })).toBeInTheDocument();
  });

  it('renders sliders only for defined overrides', () => {
    const { container } = render(
      <OverrideSliders
        cond={makeCond({ OE: 5 })}
        onSliderChange={vi.fn()}
      />
    );
    const sliders = container.querySelectorAll('[role="slider"]');
    expect(sliders).toHaveLength(1);
  });

  it('renders all 3 sliders when all overrides are defined', () => {
    const { container } = render(
      <OverrideSliders
        cond={makeCond({ OE: 5, AL: 3, killDesire: 7 })}
        onSliderChange={vi.fn()}
      />
    );
    const sliders = container.querySelectorAll('[role="slider"]');
    expect(sliders).toHaveLength(3);
  });

  it('displays current override values in labels', () => {
    render(
      <OverrideSliders
        cond={makeCond({ OE: 5, AL: 3, killDesire: 7 })}
        onSliderChange={vi.fn()}
      />
    );
    expect(screen.getByText(/OE.*5/)).toBeInTheDocument();
    expect(screen.getByText(/AL.*3/)).toBeInTheDocument();
    expect(screen.getByText(/KD.*7/)).toBeInTheDocument();
  });

  it('shows "—" for undefined overrides', () => {
    render(<OverrideSliders cond={makeCond()} onSliderChange={vi.fn()} />);
    expect(screen.getByText(/OE.*—/)).toBeInTheDocument();
    expect(screen.getByText(/AL.*—/)).toBeInTheDocument();
    expect(screen.getByText(/KD.*—/)).toBeInTheDocument();
  });

  it('calls onSliderChange with undefined when clear button clicked', () => {
    const onSliderChange = vi.fn();
    render(
      <OverrideSliders
        cond={makeCond({ OE: 5 })}
        onSliderChange={onSliderChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear OE override' }));
    expect(onSliderChange).toHaveBeenCalledWith('OE', undefined);
  });

  it('calls onSliderChange with 5 when set button clicked', () => {
    const onSliderChange = vi.fn();
    render(<OverrideSliders cond={makeCond()} onSliderChange={onSliderChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Set OE override' }));
    expect(onSliderChange).toHaveBeenCalledWith('OE', 5);
  });

  it('renders Label elements for a11y', () => {
    const { container } = render(<OverrideSliders cond={makeCond()} onSliderChange={vi.fn()} />);
    const labels = container.querySelectorAll('label');
    expect(labels.length).toBeGreaterThanOrEqual(3);
  });

  it('renders with correct slider range (min=1, max=10)', () => {
    const { container } = render(
      <OverrideSliders
        cond={makeCond({ OE: 5, AL: 3, killDesire: 7 })}
        onSliderChange={vi.fn()}
      />
    );
    const sliders = container.querySelectorAll('[role="slider"]');
    for (const slider of sliders) {
      expect(slider).toHaveAttribute('aria-valuemin', '1');
      expect(slider).toHaveAttribute('aria-valuemax', '10');
    }
  });
});
