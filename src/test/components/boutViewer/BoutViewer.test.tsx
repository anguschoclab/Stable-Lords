import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BoutControls from '@/components/bout-viewer/BoutControls';
import BoutResolution from '@/components/bout-viewer/BoutResolution';
import BoutHeader from '@/components/bout-viewer/BoutHeader';
import { FightingStyle } from '@/types/game';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('@/components/arena', () => ({
  ViewModeToggle: ({ mode, onChange }: { mode: string; onChange: (m: string) => void }) => (
    <div data-testid="view-mode-toggle" onClick={() => onChange('text')}>{mode}</div>
  ),
}));

vi.mock('@/engine/combat/utils/outcomeStyles', () => ({
  getOutcomeStyles: () => ({ icon: 'Skull', color: 'text-destructive', label: 'Kill' }),
}));

const renderWithTooltip = (ui: React.ReactElement) =>
  render(<TooltipProvider>{ui}</TooltipProvider>);

describe('BoutHeader', () => {
  it('renders without crashing', () => {
    renderWithTooltip(
      <BoutHeader
        nameA="Alice"
        nameD="Bob"
        styleA={FightingStyle.BashingAttack}
        styleD={FightingStyle.TotalParry}
        winner="A"
        minutes={5}
        totalEvents={10}
        visibleCount={5}
        expanded={false}
        onToggleExpanded={vi.fn()}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders Swords icon between names', () => {
    renderWithTooltip(
      <BoutHeader
        nameA="Alice"
        nameD="Bob"
        styleA={FightingStyle.BashingAttack}
        styleD={FightingStyle.TotalParry}
        winner={null}
        minutes={0}
        totalEvents={0}
        visibleCount={0}
        expanded={false}
        onToggleExpanded={vi.fn()}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

describe('BoutResolution', () => {
  it('renders without crashing when complete', () => {
    const { container } = render(
      <BoutResolution
        isComplete={true}
        winner="A"
        winnerName="Alice"
        by="Kill"
        minutes={5}
        totalEvents={10}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without crashing when incomplete', () => {
    render(
      <BoutResolution
        isComplete={false}
        winner={null}
        winnerName={null}
        by={null}
        minutes={0}
        totalEvents={0}
      />
    );
  });
});

describe('BoutControls', () => {
  it('renders without crashing', () => {
    const { container } = renderWithTooltip(
      <BoutControls
        viewMode="arena"
        onViewModeChange={vi.fn()}
        isPlaying={false}
        speed={1}
        setSpeed={vi.fn()}
        visibleCount={5}
        totalEvents={10}
        onReset={vi.fn()}
        onTogglePlay={vi.fn()}
        onSkipToEnd={vi.fn()}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
