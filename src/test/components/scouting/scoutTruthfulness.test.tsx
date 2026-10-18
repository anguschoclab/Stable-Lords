// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NoReportState } from '@/components/scouting/components/NoReportState';
import { ReportHeader } from '@/components/scouting/components/ReportHeader';
import { ScoutIntelTab } from '@/components/scouting/ScoutIntelTab';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeRivalStable } from '@/test/_fixtures/factories';
import { makeTestWarrior } from '@/test/_fixtures/namedWarrior';
import type { GameState } from '@/types/state.types';
import type { ScoutReportData } from '@/types/game';
import '@/test/_setup/setup';

describe('scouting truthfulness and copy', () => {
  it('describes report quality by its real attribute variance, not fabricated precision', () => {
    render(<NoReportState warriorName="Cassius" treasury={200} onScout={vi.fn()} />);

    expect(screen.getByText('Basic Report')).toBeInTheDocument();
    expect(screen.getByText('Attribute variance ±5')).toBeInTheDocument();
    expect(screen.getByText('Expert Report')).toBeInTheDocument();
    expect(screen.getByText('Attribute variance ±1')).toBeInTheDocument();
    expect(screen.queryByText(/SCAN/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Precision:/)).not.toBeInTheDocument();
  });

  it('shows the report filing week instead of a static ACTIVE status', () => {
    const report = {
      id: 'report-1',
      warriorName: 'Cassius',
      quality: 'Detailed',
      week: 7,
    } as ScoutReportData;

    render(
      <TooltipProvider>
        <ReportHeader report={report} />
      </TooltipProvider>
    );

    expect(screen.getByText('Detailed Report')).toBeInTheDocument();
    expect(screen.getByText('Filed Week 7')).toBeInTheDocument();
    expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument();
    expect(screen.queryByText(/SCAN COMPLETED/)).not.toBeInTheDocument();
  });

  it('uses plain Roman scouting prompts for empty rival and warrior columns', () => {
    const state = createFreshState('scout-empty-state-seed');
    const rival = makeRivalStable('rival-a', [makeTestWarrior('a1', 'Alpha')]);
    state.rivals = [rival];
    useGameStore.getState().loadGame('scout-empty-state', state as GameState);

    render(
      <TooltipProvider>
        <ScoutIntelTab
          rivals={[rival]}
          reports={[]}
          selectedRivalId={null}
          onSelectRival={vi.fn()}
          selectedWarriorId={null}
          onSelectWarrior={vi.fn()}
          treasury={100}
          onScout={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(
      screen.getByRole('heading', { name: 'Select a Rival Stable' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Choose a stable to inspect its active roster.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Select a Warrior to Scout' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Choose a warrior to order a scout report.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/host connection|lock-on|deep scan/i)).not.toBeInTheDocument();
  });
});
