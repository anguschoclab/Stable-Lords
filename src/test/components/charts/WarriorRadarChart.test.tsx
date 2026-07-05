// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

vi.mock('recharts', () => {
  const Stub = ({ children, ...props }: any) => (
    <div data-testid="recharts-stub" data-props={JSON.stringify(props)}>
      {children}
    </div>
  );
  return {
    RadarChart: Stub,
    Radar: Stub,
    PolarGrid: Stub,
    PolarAngleAxis: ({ dataKey }: any) => <div data-testid="polar-angle-axis" data-key={dataKey} />,
    PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  };
});

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
  ChartConfig: {},
}));

import { WarriorRadarChart } from '@/components/charts/WarriorRadarChart';

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'w1' as WarriorId,
    name: 'TestWarrior',
    style: 'StrikingAttack' as FightingStyle,
    attributes: { ST: 10, CN: 12, SZ: 8, WT: 15, WL: 14, SP: 11, DF: 9 },
    baseSkills: { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    injuries: [],
    career: { wins: 0, losses: 0, kills: 0 },
    fame: 0,
    popularity: 0,
    titles: [],
    flair: [],
    champion: false,
    status: 'Active',
    ...overrides,
  } as Warrior;
}

describe('WarriorRadarChart', () => {
  it('renders without crashing', () => {
    render(<WarriorRadarChart warrior={makeWarrior()} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders all 7 attribute labels via PolarAngleAxis', () => {
    render(<WarriorRadarChart warrior={makeWarrior()} />);
    const axes = screen.getAllByTestId('polar-angle-axis');
    expect(axes).toHaveLength(1);
    expect(axes[0]?.getAttribute('data-key')).toBe('attribute');
  });

  it('renders two Radar components (potential + current)', () => {
    render(<WarriorRadarChart warrior={makeWarrior()} />);
    const radars = screen.getAllByTestId('recharts-stub');
    expect(radars.length).toBeGreaterThanOrEqual(2);
  });

  it('uses potential values when warrior has potential', () => {
    const warrior = makeWarrior({
      potential: { ST: 20, CN: 20, SZ: 20, WT: 20, WL: 20, SP: 20, DF: 20 },
    });
    render(<WarriorRadarChart warrior={warrior} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('falls back to current attributes when potential is undefined', () => {
    const warrior = makeWarrior();
    expect(warrior.potential).toBeUndefined();
    render(<WarriorRadarChart warrior={warrior} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });
});
