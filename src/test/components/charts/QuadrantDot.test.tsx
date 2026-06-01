// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QuadrantDotItem } from '@/components/charts/QuadrantDot';
import type { QuadrantDot } from '@/hooks/useQuadrantDots';

describe('QuadrantDotItem', () => {
  const playerDot: QuadrantDot = {
    label: 'Player Stable',
    fame: 50,
    notoriety: 60,
    isPlayer: true,
  };

  const rivalDot: QuadrantDot = {
    label: 'Rival Stable',
    fame: 30,
    notoriety: 40,
    isPlayer: false,
  };

  it('renders player dot with primary color class', () => {
    const { container } = render(
      <TooltipProvider>
        <QuadrantDotItem dot={playerDot} />
      </TooltipProvider>
    );

    const dot = container.querySelector('.bg-primary');
    expect(dot).toBeInTheDocument();
  });

  it('renders rival dot with white/30 color class', () => {
    const { container } = render(
      <TooltipProvider>
        <QuadrantDotItem dot={rivalDot} />
      </TooltipProvider>
    );

    const dot = container.querySelector('.bg-white\\/30');
    expect(dot).toBeInTheDocument();
  });

  it('positions dot correctly based on fame and notoriety', () => {
    const { container } = render(
      <TooltipProvider>
        <QuadrantDotItem dot={playerDot} />
      </TooltipProvider>
    );

    const dot = container.querySelector('.bg-primary') as HTMLElement;
    expect(dot).toBeInTheDocument();
    expect(dot.style.left).toBe('50%');
    expect(dot.style.top).toBe('40%'); // 100 - 60 = 40
  });

  it('renders tooltip wrapper around the dot', () => {
    const { container } = render(
      <TooltipProvider>
        <QuadrantDotItem dot={playerDot} />
      </TooltipProvider>
    );

    const trigger = container.querySelector('[data-state="closed"]');
    expect(trigger).toBeInTheDocument();
  });
});
