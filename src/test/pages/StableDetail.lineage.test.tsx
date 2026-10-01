/**
 * StableDetail lineage card — legacy-founded stables must show their
 * founder and parent stable (megaplan Phase 6 contract).
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StableSidebar } from '@/pages/stableDetail/sections';
import { makeRival, makeOwner } from '@/test/_fixtures/factories';
import { useGameStore } from '@/state/useGameStore';
import type { StableId, WarriorId } from '@/types/shared.types';

const tierCfg = { label: 'Major', ring: 'silver' as const, text: 'text-arena-silver' };

describe('StableSidebar — lineage card', () => {
  beforeEach(() => {
    useGameStore.setState({ rivals: [] } as never);
  });

  it('renders founder and parent-stable lineage for a legacy-founded stable', () => {
    const parent = makeRival({
      id: 'parent-1' as StableId,
      owner: makeOwner({ id: 'parent-1' as StableId, stableName: 'Iron Wolves' }),
    });
    useGameStore.setState({ rivals: [parent] } as never);

    const founded = makeRival({
      id: 'child-1' as StableId,
      owner: makeOwner({
        id: 'child-1' as StableId,
        stableName: "Korvin's Academy",
        name: 'Korvin Stonereach',
        foundedByWarriorId: 'warrior-abc123' as WarriorId,
        foundedByWarriorName: 'KORVIN',
        parentStableId: 'parent-1' as StableId,
      }),
    });

    render(
      <TooltipProvider>
        <StableSidebar rival={founded} tierCfg={tierCfg} winRate={50} />
      </TooltipProvider>
    );

    expect(screen.getByText('Lineage')).toBeInTheDocument();
    expect(screen.getByText(/Founded by/)).toBeInTheDocument();
    expect(screen.getByText('Iron Wolves')).toBeInTheDocument();
  });

  it('renders nothing for a conventionally minted stable', () => {
    const plain = makeRival({
      id: 'plain-1' as StableId,
      owner: makeOwner({ id: 'plain-1' as StableId, stableName: 'Dawn Hammers' }),
    });
    render(
      <TooltipProvider>
        <StableSidebar rival={plain} tierCfg={tierCfg} winRate={50} />
      </TooltipProvider>
    );
    expect(screen.queryByText('Lineage')).not.toBeInTheDocument();
  });
});
