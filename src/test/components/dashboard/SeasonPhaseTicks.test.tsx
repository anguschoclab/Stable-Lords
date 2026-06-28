// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SeasonPhaseTicks } from '@/components/dashboard/SeasonPhaseTicks';

describe('SeasonPhaseTicks', () => {
  it('renders 13 tick elements', () => {
    const { container } = render(<SeasonPhaseTicks currentWeek={5} />);
    const ticks = container.querySelectorAll('[data-testid^="week-tick-"]');
    expect(ticks).toHaveLength(13);
  });

  it('active week tick has data-active attribute', () => {
    const { container } = render(<SeasonPhaseTicks currentWeek={7} />);
    const activeTick = container.querySelector('[data-testid="week-tick-7"]');
    expect(activeTick).toHaveAttribute('data-active', 'true');
  });

  it('non-active ticks do not have data-active=true', () => {
    const { container } = render(<SeasonPhaseTicks currentWeek={7} />);
    const tick3 = container.querySelector('[data-testid="week-tick-3"]');
    expect(tick3).not.toHaveAttribute('data-active', 'true');
  });

  it('tick at week 4 has Opening boundary marker', () => {
    const { container } = render(<SeasonPhaseTicks currentWeek={5} />);
    const marker = container.querySelector('[data-testid="phase-marker-4"]');
    expect(marker).toBeInTheDocument();
    expect(marker?.textContent).toMatch(/Opening/i);
  });

  it('tick at week 9 has Championship boundary marker', () => {
    const { container } = render(<SeasonPhaseTicks currentWeek={5} />);
    const marker = container.querySelector('[data-testid="phase-marker-9"]');
    expect(marker).toBeInTheDocument();
    expect(marker?.textContent).toMatch(/Championship/i);
  });

  it('past weeks (< currentWeek) have data-past attribute', () => {
    const { container } = render(<SeasonPhaseTicks currentWeek={7} />);
    const tick3 = container.querySelector('[data-testid="week-tick-3"]');
    expect(tick3).toHaveAttribute('data-past', 'true');
  });

  it('future weeks (> currentWeek) do not have data-past attribute', () => {
    const { container } = render(<SeasonPhaseTicks currentWeek={7} />);
    const tick10 = container.querySelector('[data-testid="week-tick-10"]');
    expect(tick10).not.toHaveAttribute('data-past', 'true');
  });

  it('handles edge case currentWeek=1 (no past ticks)', () => {
    const { container } = render(<SeasonPhaseTicks currentWeek={1} />);
    const tick1 = container.querySelector('[data-testid="week-tick-1"]');
    expect(tick1).toHaveAttribute('data-active', 'true');
    const tick2 = container.querySelector('[data-testid="week-tick-2"]');
    expect(tick2).not.toHaveAttribute('data-past', 'true');
  });
});
