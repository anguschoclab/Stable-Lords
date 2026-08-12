import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutosimConsole } from '@/components/run-round/AutosimConsole';
import { OutcomeIcon } from '@/components/run-round/OutcomeIcon';
import { LethalityBadge } from '@/components/run-round/LethalityBadge';
import { RunResultsSummary } from '@/components/run-round/RunResultsSummary';
import type { Warrior } from '@/types/game';

const mockWarrior = {
  id: 'w1',
  name: 'TestWarrior',
  style: 'Bashing Attack',
  derivedStats: { hp: 20 },
} as unknown as Warrior;

describe('OutcomeIcon', () => {
  it('renders Skull for Kill', () => {
    const { container } = render(<OutcomeIcon by="Kill" />);
    expect(container.querySelector('.lucide-skull')).toBeInTheDocument();
  });

  it('renders Zap for KO', () => {
    const { container } = render(<OutcomeIcon by="KO" />);
    expect(container.querySelector('.lucide-zap')).toBeInTheDocument();
  });

  it('renders null for other outcomes', () => {
    const { container } = render(<OutcomeIcon by="Exhaustion" />);
    expect(container.firstChild).toBeNull();
  });
});

describe('LethalityBadge', () => {
  it('renders High Lethality Risk for high score', () => {
    const wA = { ...mockWarrior, derivedStats: { hp: 10 } } as unknown as Warrior;
    const wB = { ...mockWarrior, derivedStats: { hp: 10 } } as unknown as Warrior;
    render(<LethalityBadge wA={wA} wB={wB} crowdMood="Bloodthirsty" />);
    expect(screen.getByText(/High Lethality Risk/i)).toBeInTheDocument();
  });

  it('renders Standard Bout for low score', () => {
    const wA = { ...mockWarrior, derivedStats: { hp: 50 }, style: 'Parry' } as unknown as Warrior;
    const wB = { ...mockWarrior, derivedStats: { hp: 50 }, style: 'Parry' } as unknown as Warrior;
    render(<LethalityBadge wA={wA} wB={wB} crowdMood="Calm" />);
    expect(screen.getByText(/Standard Bout/i)).toBeInTheDocument();
  });
});

describe('RunResultsSummary', () => {
  it('renders deaths and KOs', () => {
    render(<RunResultsSummary deaths={3} KOs={5} />);
    expect(screen.getByText(/3 Casualties/i)).toBeInTheDocument();
    expect(screen.getByText(/5 KOs/i)).toBeInTheDocument();
  });

  it('does not render deaths when zero', () => {
    render(<RunResultsSummary deaths={0} KOs={2} />);
    expect(screen.queryByText(/Casualties/i)).not.toBeInTheDocument();
    expect(screen.getByText(/2 KOs/i)).toBeInTheDocument();
  });
});

describe('AutosimConsole', () => {
  it('renders start buttons when idle', () => {
    const onStart = vi.fn();
    render(<AutosimConsole isSimulating={false} progress={null} result={null} onStart={onStart} />);
    expect(screen.getByText(/4 Wks/i)).toBeInTheDocument();
    expect(screen.getByText(/8 Wks/i)).toBeInTheDocument();
    expect(screen.getByText(/13 Wks/i)).toBeInTheDocument();
  });

  it('calls onStart with 4 when short button clicked', () => {
    const onStart = vi.fn();
    render(<AutosimConsole isSimulating={false} progress={null} result={null} onStart={onStart} />);
    fireEvent.click(screen.getByText(/4 Wks/i));
    expect(onStart).toHaveBeenCalledWith(4);
  });

  it('renders progress when simulating', () => {
    render(
      <AutosimConsole
        isSimulating={true}
        progress={{ current: 2, total: 4 }}
        result={null}
        onStart={vi.fn()}
      />
    );
    expect(screen.getByText(/Processing Cycle 2 of 4/i)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders result when completed', () => {
    render(
      <AutosimConsole
        isSimulating={false}
        progress={null}
        result={{ stopReason: 'max_weeks', stopDetail: 'Done', weeksSimmed: 13, weekSummaries: [{ week: 1, bouts: 3, deaths: 0, injuries: 0, deathNames: [], injuryNames: [] }], finalState: null as never }}
        onStart={vi.fn()}
      />
    );
    expect(screen.getByText(/Simulation Concluded/i)).toBeInTheDocument();
    expect(screen.getByText(/13 Weeks/i)).toBeInTheDocument();
  });
});
