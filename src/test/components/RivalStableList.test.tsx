// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { makeRivalStable } from '@/test/_fixtures/factories';
import type { RivalStableData } from '@/types/game';
import type { StableId, GrudgeId } from '@/types/shared.types';
import { useGameStore } from '@/state/useGameStore';

vi.mock('@tanstack/react-router', () => ({ ...__SHARED_MOCKS.routerLink }));

// SelectableCard wraps rows in a side Tooltip — the app-level TooltipProvider
// is not mounted in specs, so stub the primitives (same pattern as
// StableRankingsRow.test.tsx).
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function makeRivals(n: number): RivalStableData[] {
  return Array.from({ length: n }, (_, i) => makeRivalStable(`r${i}`, []));
}

describe('RivalStableList (virtualized)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({ ownerGrudges: [] } as never);
  });

  it('renders rival stable names', async () => {
    const { RivalStableList } = await import('@/components/scouting/RivalStableList');
    render(
      <RivalStableList rivals={makeRivals(3)} selectedRivalId={null} onSelectRival={vi.fn()} />
    );
    expect(screen.getByText('Stable r0')).toBeInTheDocument();
  });

  it('mounts a bounded scroll container (max-h + overflow-auto)', async () => {
    const { RivalStableList } = await import('@/components/scouting/RivalStableList');
    const { container } = render(
      <RivalStableList rivals={makeRivals(3)} selectedRivalId={null} onSelectRival={vi.fn()} />
    );
    const scroll = container.querySelector('[class*="max-h"][class*="overflow-auto"]');
    expect(scroll).not.toBeNull();
  });

  it('windows to 25 rows with a "+N more" toggle that expands to the full filtered set', async () => {
    const { RivalStableList } = await import('@/components/scouting/RivalStableList');
    render(
      <RivalStableList rivals={makeRivals(30)} selectedRivalId={null} onSelectRival={vi.fn()} />
    );
    expect(screen.getByText('+5 more')).toBeInTheDocument();
    // default sort is name — 'Stable r9' sorts last of the 30 alphabetically
    expect(screen.queryByText('Stable r9')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+5 more'));
    // showAll → all 30 render (jsdom fallback: virtualizer returns 0 items)
    expect(screen.getByText('Stable r9')).toBeInTheDocument();
  });

  it('search filters the rendered set', async () => {
    const { RivalStableList } = await import('@/components/scouting/RivalStableList');
    const rivals = [...makeRivals(3), makeRivalStable('needle', [])];
    render(<RivalStableList rivals={rivals} selectedRivalId={null} onSelectRival={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Filter list'), { target: { value: 'needle' } });
    expect(screen.getByText('Stable needle')).toBeInTheDocument();
    expect(screen.queryByText('Stable r0')).not.toBeInTheDocument();
  });

  it('clicking a card selects the rival by owner id', async () => {
    const { RivalStableList } = await import('@/components/scouting/RivalStableList');
    const onSelectRival = vi.fn();
    render(
      <RivalStableList
        rivals={makeRivals(2)}
        selectedRivalId={null}
        onSelectRival={onSelectRival}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select rival stable Stable r0' }));
    expect(onSelectRival).toHaveBeenCalledWith('owner-r0');
  });

  it('Enter/Space keydown selects (keyboard parity preserved)', async () => {
    const { RivalStableList } = await import('@/components/scouting/RivalStableList');
    const onSelectRival = vi.fn();
    render(
      <RivalStableList
        rivals={makeRivals(2)}
        selectedRivalId={null}
        onSelectRival={onSelectRival}
      />
    );
    const card = screen.getByRole('button', { name: 'Select rival stable Stable r1' });
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onSelectRival).toHaveBeenCalledWith('owner-r1');
    onSelectRival.mockClear();
    fireEvent.keyDown(card, { key: ' ' });
    expect(onSelectRival).toHaveBeenCalledWith('owner-r1');
  });

  it('marks the selected card aria-pressed', async () => {
    const { RivalStableList } = await import('@/components/scouting/RivalStableList');
    render(
      <RivalStableList rivals={makeRivals(2)} selectedRivalId="owner-r1" onSelectRival={vi.fn()} />
    );
    const selected = screen.getByRole('button', { name: 'Select rival stable Stable r1' });
    expect(selected).toHaveAttribute('aria-pressed', 'true');
    const other = screen.getByRole('button', { name: 'Select rival stable Stable r0' });
    expect(other).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders grudge flames for a rival owner with an active grudge', async () => {
    const { RivalStableList } = await import('@/components/scouting/RivalStableList');
    useGameStore.setState({
      ownerGrudges: [
        {
          id: 'g1' as GrudgeId,
          ownerIdA: 'owner-r0' as StableId,
          ownerIdB: 'owner-other' as StableId,
          intensity: 3,
          reason: 'Arena feud',
          startWeek: 1,
          lastEscalation: 2,
        },
      ],
    } as never);
    const { container } = render(
      <RivalStableList rivals={makeRivals(2)} selectedRivalId={null} onSelectRival={vi.fn()} />
    );
    expect(container.querySelectorAll('svg.text-arena-blood').length).toBe(3);
  });

  it('renders nothing but the shell when rivals is empty', async () => {
    const { RivalStableList } = await import('@/components/scouting/RivalStableList');
    render(<RivalStableList rivals={[]} selectedRivalId={null} onSelectRival={vi.fn()} />);
    expect(screen.getByText('Rival Stables')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Select rival stable/ })).not.toBeInTheDocument();
  });
});
