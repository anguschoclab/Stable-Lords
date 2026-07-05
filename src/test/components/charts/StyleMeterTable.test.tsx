// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: (s: unknown) => unknown) => fn,
}));

let mockState: { roster: Warrior[] } = { roster: [] };

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector: (s: unknown) => unknown) => selector(mockState),
}));

import { StyleMeterTable } from '@/components/charts/StyleMeterTable';

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'w1' as WarriorId,
    name: 'TestWarrior',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 12, SZ: 8, WT: 15, WL: 14, SP: 11, DF: 9 },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    traits: [],
    ...overrides,
  } as Warrior;
}

describe('StyleMeterTable', () => {
  beforeEach(() => {
    mockState = { roster: [] };
  });

  it('renders without crashing', () => {
    const { container } = render(<StyleMeterTable />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows "No bout data yet" when roster empty', () => {
    const { container } = render(<StyleMeterTable />);
    expect(container.textContent).toContain('No bout data yet');
  });

  it('renders style rows from roster with career data', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 6, losses: 4, kills: 0 } }),
        makeWarrior({ id: 'w2' as WarriorId, style: FightingStyle.BashingAttack, career: { wins: 3, losses: 3, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    expect(container.textContent).toContain('ST');
    expect(container.textContent).toContain('BA');
  });

  it('sorts rows by winRate descending', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.BashingAttack, career: { wins: 3, losses: 3, kills: 0 } }),
        makeWarrior({ id: 'w2' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 6, losses: 4, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    const abbrevs = Array.from(container.querySelectorAll('.text-right.text-\\[9px\\]')).map(
      (el) => el.textContent?.trim()
    );
    // 60% (ST) should come before 50% (BA)
    expect(abbrevs.indexOf('ST')).toBeLessThan(abbrevs.indexOf('BA'));
  });

  it('aggregates wins/losses per style', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 3, losses: 1, kills: 0 } }),
        makeWarrior({ id: 'w2' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 2, losses: 2, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    // Combined: 5W/3L → 62.5% → rounds to 63%
    expect(container.textContent).toContain('63%');
    expect(container.textContent).toContain('5W/3L');
  });

  it('win rate calculation: 3W/1L → 75%', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 3, losses: 1, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    expect(container.textContent).toContain('75%');
    expect(container.textContent).toContain('3W/1L');
  });

  it('zero bouts → 0%', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 0, losses: 0, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    expect(container.textContent).toContain('0%');
    expect(container.textContent).toContain('0W/0L');
  });

  it('bar color — high win rate (≥60%) → bg-primary', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 6, losses: 4, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    const bar = container.querySelector('.bg-primary');
    expect(bar).toBeInTheDocument();
  });

  it('bar color — mid win rate (45–59%) → bg-arena-gold', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 5, losses: 6, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    const bar = container.querySelector('.bg-arena-gold');
    expect(bar).toBeInTheDocument();
  });

  it('bar color — low win rate (<45%) → bg-destructive', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 0, losses: 3, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    const bar = container.querySelector('.bg-destructive');
    expect(bar).toBeInTheDocument();
  });

  it('bar color boundary — 59% → bg-arena-gold (not primary)', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 59, losses: 41, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    const goldBar = container.querySelector('.bg-arena-gold');
    expect(goldBar).toBeInTheDocument();
  });

  it('bar color boundary — 44% → bg-destructive (not gold)', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 44, losses: 56, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    const destructiveBar = container.querySelector('.bg-destructive');
    expect(destructiveBar).toBeInTheDocument();
  });

  it('text color matches bar color — 75% → text-primary', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 3, losses: 1, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    const pctText = container.querySelector('.text-primary');
    expect(pctText).toBeInTheDocument();
    expect(pctText?.textContent).toContain('75%');
  });

  it('uses STYLE_ABBREV for label — StrikingAttack → "ST"', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 1, losses: 0, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    expect(container.textContent).toContain('ST');
    expect(container.textContent).not.toContain('StrikingAttack');
  });

  it('unknown style falls back to style string', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: 'CustomStyle' as any, career: { wins: 1, losses: 0, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    expect(container.textContent).toContain('CustomStyle');
  });

  it('warrior missing career → defaults to 0/0', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack } as Partial<Warrior>),
      ],
    };
    delete (mockState.roster[0] as any).career;
    const { container } = render(<StyleMeterTable />);
    expect(container.textContent).toContain('0%');
    expect(container.textContent).toContain('0W/0L');
  });

  it('applies custom className to root Surface', () => {
    const { container } = render(<StyleMeterTable className="test-cls" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('test-cls');
  });

  it('bar width matches percentage', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 3, losses: 1, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    const bar = container.querySelector('.bg-primary') as HTMLElement;
    expect(bar).toBeInTheDocument();
    expect(bar.style.width).toBe('75%');
  });

  it('roster with 5+ styles → all rendered', () => {
    mockState = {
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, style: FightingStyle.StrikingAttack, career: { wins: 1, losses: 0, kills: 0 } }),
        makeWarrior({ id: 'w2' as WarriorId, style: FightingStyle.BashingAttack, career: { wins: 1, losses: 0, kills: 0 } }),
        makeWarrior({ id: 'w3' as WarriorId, style: FightingStyle.LungingAttack, career: { wins: 1, losses: 0, kills: 0 } }),
        makeWarrior({ id: 'w4' as WarriorId, style: FightingStyle.ParryRiposte, career: { wins: 1, losses: 0, kills: 0 } }),
        makeWarrior({ id: 'w5' as WarriorId, style: FightingStyle.AimedBlow, career: { wins: 1, losses: 0, kills: 0 } }),
      ],
    };
    const { container } = render(<StyleMeterTable />);
    expect(container.textContent).toContain('ST');
    expect(container.textContent).toContain('BA');
    expect(container.textContent).toContain('LU');
    expect(container.textContent).toContain('PR');
    expect(container.textContent).toContain('AB');
  });
});
