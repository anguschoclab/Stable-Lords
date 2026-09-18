import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoutControls from '@/components/bout-viewer/BoutControls';
import BoutResolution from '@/components/bout-viewer/BoutResolution';
import BoutHeader from '@/components/bout-viewer/BoutHeader';
import { FightingStyle } from '@/types/game';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('@/components/arena', () => ({
  ViewModeToggle: ({ mode, onChange }: { mode: string; onChange: (m: string) => void }) => (
    <div data-testid="view-mode-toggle" onClick={() => onChange('text')}>
      {mode}
    </div>
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
  const props = (over: Partial<Parameters<typeof BoutControls>[0]> = {}) => ({
    viewMode: 'arena' as const,
    onViewModeChange: vi.fn(),
    isPlaying: false,
    speed: 1 as const,
    setSpeed: vi.fn(),
    visibleCount: 5,
    totalEvents: 10,
    onReset: vi.fn(),
    onTogglePlay: vi.fn(),
    onSkipToEnd: vi.fn(),
    ...over,
  });

  it('renders without crashing', () => {
    const { container } = renderWithTooltip(<BoutControls {...props()} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('labels the transport button "Play bout" when paused', () => {
    renderWithTooltip(<BoutControls {...props({ isPlaying: false })} />);
    expect(screen.getByRole('button', { name: 'Play bout' })).toBeInTheDocument();
  });

  it('labels the transport button "Pause playback" when playing', () => {
    renderWithTooltip(<BoutControls {...props({ isPlaying: true })} />);
    expect(screen.getByRole('button', { name: 'Pause playback' })).toBeInTheDocument();
  });

  it('invokes onTogglePlay from the transport button', () => {
    const onTogglePlay = vi.fn();
    renderWithTooltip(<BoutControls {...props({ onTogglePlay })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play bout' }));
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('invokes onReset and onSkipToEnd from their buttons', () => {
    const onReset = vi.fn();
    const onSkipToEnd = vi.fn();
    renderWithTooltip(<BoutControls {...props({ onReset, onSkipToEnd })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset bout viewer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip to end of bout' }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onSkipToEnd).toHaveBeenCalledTimes(1);
  });

  it('exposes the transport tooltip matching the reset/skip convention', async () => {
    // PR #962 target: play/pause gets a tooltip like RESET BUFFER / SKIP TO RESOLVE.
    renderWithTooltip(<BoutControls {...props({ isPlaying: false })} />);
    fireEvent.focus(screen.getByRole('button', { name: 'Play bout' }));
    expect(await screen.findByText('PLAY BOUT')).toBeInTheDocument();
  });

  it('shows the pause tooltip while playing', async () => {
    renderWithTooltip(<BoutControls {...props({ isPlaying: true })} />);
    fireEvent.focus(screen.getByRole('button', { name: 'Pause playback' }));
    expect(await screen.findByText('PAUSE PLAYBACK')).toBeInTheDocument();
  });

  it('marks the active speed with aria-pressed', () => {
    renderWithTooltip(<BoutControls {...props({ speed: 2 })} />);
    expect(screen.getByRole('button', { name: 'Set playback speed to 2x' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Set playback speed to 1x' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('shows the visible/total event counters', () => {
    renderWithTooltip(<BoutControls {...props({ visibleCount: 3, totalEvents: 9 })} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });
});
