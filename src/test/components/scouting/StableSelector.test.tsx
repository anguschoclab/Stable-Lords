/**
 * StableSelector — the two-column comparison picker shares one list shell:
 * a single search/sort narrows both columns (megaplan Phase 6 contract).
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StableSelector } from '@/components/scouting/StableSelector';
import { makeRival, makeOwner } from '@/test/_fixtures/factories';
import type { StableId } from '@/types/shared.types';

function rival(id: string, stableName: string) {
  return makeRival({
    id: id as StableId,
    owner: makeOwner({ id: `${id}-owner` as StableId, stableName, name: `Owner ${id}` }),
  });
}

describe('StableSelector — list shell', () => {
  it('filters both columns from one search input', () => {
    render(
      <TooltipProvider>
        <StableSelector
          rivals={[rival('r1', 'Iron Wolves'), rival('r2', 'Ash Reapers')]}
          idA={null}
          setIdA={() => {}}
          idB={null}
          setIdB={() => {}}
        />
      </TooltipProvider>
    );

    fireEvent.change(screen.getByLabelText('Filter comparison stables'), {
      target: { value: 'wolves' },
    });

    expect(screen.getByLabelText('Select Iron Wolves as Stable Prime')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Iron Wolves as Stable Challenger')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Select Ash Reapers as Stable Prime')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Select Ash Reapers as Stable Challenger')
    ).not.toBeInTheDocument();
  });

  it('windows both columns past the page size', () => {
    const rivals = Array.from({ length: 60 }, (_, i) =>
      rival(`r${i}`, `Stable ${String(i).padStart(3, '0')}`)
    );
    render(
      <TooltipProvider>
        <StableSelector rivals={rivals} idA={null} setIdA={() => {}} idB={null} setIdB={() => {}} />
      </TooltipProvider>
    );
    expect(
      screen.queryByLabelText('Select Stable 059 as Stable Prime')
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /\+\d+ more/i }));
    expect(screen.getByLabelText('Select Stable 059 as Stable Prime')).toBeInTheDocument();
  });
});
