/**
 * RivalListShell integration — RivalStableList at ~150 stables must offer
 * search, sort, and a bounded render window (the megaplan list contract).
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RivalStableList } from '@/components/scouting/RivalStableList';
import { makeRival, makeOwner } from '@/test/_fixtures/factories';
import { useGameStore } from '@/state/useGameStore';
import type { StableId } from '@/types/shared.types';

function makeNamedRival(id: string, stableName: string, ownerName: string, treasury = 1000) {
  return makeRival({
    id: id as StableId,
    owner: makeOwner({ id: id as StableId, stableName, name: ownerName }),
    treasury,
  });
}

describe('RivalStableList — list shell', () => {
  beforeEach(() => {
    useGameStore.setState({ ownerGrudges: [] } as never);
  });

  it('filters by stable name and owner name', () => {
    const rivals = [
      makeNamedRival('r1', 'Iron Wolves', 'Ragnar Stormborn'),
      makeNamedRival('r2', 'Ash Reapers', 'Helena Cross'),
    ];
    render(
      <TooltipProvider>
        <RivalStableList rivals={rivals} selectedRivalId={null} onSelectRival={() => {}} />
      </TooltipProvider>
    );

    const search = screen.getByLabelText('Filter list');
    fireEvent.change(search, { target: { value: 'helena' } });
    expect(screen.queryByLabelText('Select rival stable Iron Wolves')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Select rival stable Ash Reapers')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'wolves' } });
    expect(screen.getByLabelText('Select rival stable Iron Wolves')).toBeInTheDocument();
    expect(screen.queryByLabelText('Select rival stable Ash Reapers')).not.toBeInTheDocument();
  });

  it('windows the list past pageSize and expands via the more button', () => {
    const rivals = Array.from({ length: 60 }, (_, i) =>
      makeNamedRival(`r${i}`, `Stable ${String(i).padStart(3, '0')}`, `Owner ${i}`)
    );
    render(
      <TooltipProvider>
        <RivalStableList rivals={rivals} selectedRivalId={null} onSelectRival={() => {}} />
      </TooltipProvider>
    );

    // Default window — 25 of 60 rendered, remainder behind the button.
    expect(screen.queryByLabelText('Select rival stable Stable 059')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /\+35 more/i }));
    expect(screen.getByLabelText('Select rival stable Stable 059')).toBeInTheDocument();
  });

  it('offers a sort control with the canonical rival sorts', () => {
    const rivals = [makeNamedRival('r1', 'Alpha', 'A'), makeNamedRival('r2', 'Beta', 'B')];
    render(
      <TooltipProvider>
        <RivalStableList rivals={rivals} selectedRivalId={null} onSelectRival={() => {}} />
      </TooltipProvider>
    );
    const sort = screen.getByLabelText('Sort list');
    expect(sort).toBeInTheDocument();
  });
});
