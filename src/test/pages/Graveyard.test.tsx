// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import Graveyard from '@/pages/Graveyard';
import { makeWarrior } from '@/test/_fixtures/factories';
import { useGameStore } from '@/state/useGameStore';
import '@/test/_setup/setup';

/**
 * Region-pinning spec for Graveyard (L2 PageFrame gap + tabs structure).
 * Pins header title, world/stable counters, and the two memorial tabs.
 */

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

describe('Graveyard page (region pinning)', () => {
  beforeEach(() => {
    useGameStore.setState({
      graveyard: [],
      player: { id: 'p1', stableName: 'Test Stable' },
      season: 'Spring',
    } as never);
  });

  it('renders header, counters, and both memorial tabs', () => {
    render(<Graveyard />);
    expect(screen.getByRole('heading', { level: 1, name: 'The Graveyard' })).toBeTruthy();
    expect(screen.getByText('WORLD FALLEN')).toBeTruthy();
    expect(screen.getByText('STABLE MEMORIAL')).toBeTruthy();
    expect(screen.getByText('Private Memorial')).toBeTruthy();
    expect(screen.getByText('World Cemetery')).toBeTruthy();
  });

  it('stable memorial counter only counts player-owned fallen', () => {
    const mine = makeWarrior({ name: 'Mine Fallen' });
    const theirs = makeWarrior({ name: 'Their Fallen' });
    useGameStore.setState({
      graveyard: [
        { ...mine, stableId: 'p1' },
        { ...theirs, stableId: 'rival-1' },
      ],
    } as never);
    render(
      <TooltipProvider>
        <Graveyard />
      </TooltipProvider>
    );
    // world counter = 2, stable counter = 1 — check each label's stat block
    const worldLabel = screen.getByText('WORLD FALLEN');
    const stableLabel = screen.getByText('STABLE MEMORIAL');
    expect(worldLabel.parentElement?.textContent).toMatch(/2/);
    expect(stableLabel.parentElement?.textContent).toMatch(/1/);
  });
});
