// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StyleCompositionDonut } from '@/components/stable/StyleCompositionDonut';
import { FightingStyle } from '@/types/shared.types';

function makeStyles(counts: Partial<Record<FightingStyle, number>>): FightingStyle[] {
  const result: FightingStyle[] = [];
  for (const [style, count] of Object.entries(counts)) {
    for (let i = 0; i < (count ?? 0); i++) {
      result.push(style as FightingStyle);
    }
  }
  return result;
}

describe('StyleCompositionDonut', () => {
  it('renders an SVG element', () => {
    const { container } = render(
      <StyleCompositionDonut styles={makeStyles({ [FightingStyle.StrikingAttack]: 3, [FightingStyle.BashingAttack]: 2 })} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders one arc path per distinct style', () => {
    const { container } = render(
      <StyleCompositionDonut styles={makeStyles({ [FightingStyle.StrikingAttack]: 3, [FightingStyle.BashingAttack]: 2, [FightingStyle.TotalParry]: 1 })} />
    );
    const paths = container.querySelectorAll('[data-testid^="style-arc-"]');
    expect(paths).toHaveLength(3);
  });

  it('renders nothing when roster is empty', () => {
    const { container } = render(<StyleCompositionDonut styles={[]} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('renders a single arc for single-style roster', () => {
    const { container } = render(
      <StyleCompositionDonut styles={makeStyles({ [FightingStyle.StrikingAttack]: 5 })} />
    );
    const paths = container.querySelectorAll('[data-testid^="style-arc-"]');
    expect(paths).toHaveLength(1);
  });

  it('each arc path has a title element containing style name', () => {
    const { container } = render(
      <StyleCompositionDonut styles={makeStyles({ [FightingStyle.StrikingAttack]: 3, [FightingStyle.BashingAttack]: 2 })} />
    );
    const paths = container.querySelectorAll('[data-testid^="style-arc-"]');
    paths.forEach((p) => {
      const titleEl = p.querySelector('title');
      expect(titleEl?.textContent?.length ?? 0).toBeGreaterThan(0);
    });
  });

  it('majority style arc has larger sweep than minority', () => {
    const { container } = render(
      <StyleCompositionDonut styles={makeStyles({ [FightingStyle.StrikingAttack]: 6, [FightingStyle.BashingAttack]: 2 })} />
    );
    const strikerKey = FightingStyle.StrikingAttack.replace(/\s+/g, '-');
    const basherKey = FightingStyle.BashingAttack.replace(/\s+/g, '-');
    const majorArc = container.querySelector(`[data-testid="style-arc-${strikerKey}"]`) as SVGPathElement;
    const minorArc = container.querySelector(`[data-testid="style-arc-${basherKey}"]`) as SVGPathElement;
    expect(majorArc).toBeInTheDocument();
    expect(minorArc).toBeInTheDocument();
    const majorSweep = parseFloat(majorArc.getAttribute('data-sweep') ?? '0');
    const minorSweep = parseFloat(minorArc.getAttribute('data-sweep') ?? '0');
    expect(majorSweep).toBeGreaterThan(minorSweep);
  });
});
