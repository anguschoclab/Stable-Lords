// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import Gazette from '@/pages/Gazette';
import type { GazetteStory } from '@/types/state/game';
import '@/test/_setup/setup';

vi.mock('@/components/gazette/GazetteArticle', () => ({
  GazetteArticle: ({ issue }: { issue: { mainHeadline: string } }) => (
    <article>{issue.mainHeadline}</article>
  ),
}));

vi.mock('@/components/gazette/MetaAnalytics', () => ({
  TacticalStyleAnalysis: () => <div data-testid="tactical-analysis" />,
  StyleMatchupHeatmap: () => <div data-testid="style-heatmap" />,
}));

vi.mock('@/components/gazette/GazetteLeaderboards', () => ({
  GazetteLeaderboard: () => <div data-testid="gazette-leaderboard" />,
  BestByStyle: () => <div data-testid="best-by-style" />,
  RisingStars: () => <div data-testid="rising-stars" />,
}));

function issue(week: number): GazetteStory {
  return {
    id: `issue-${week}` as GazetteStory['id'],
    headline: `Week ${week} headline`,
    body: 'First dispatch.\n\nSecond dispatch.',
    mood: 'Calm',
    tags: [],
    week,
  };
}

function seed(gazettes: GazetteStory[]) {
  const state = createFreshState('test-seed');
  useGameStore.getState().loadGame('test-slot', state);
  useGameStore.setState({ gazettes, season: 'Spring', week: 6 } as never);
}

function renderPage() {
  return render(
    <TooltipProvider>
      <Gazette />
    </TooltipProvider>
  );
}

describe('Gazette page', () => {
  beforeEach(() => seed([]));

  it('shows an honest empty archive and no fabricated live analytics', () => {
    renderPage();

    expect(screen.getByText('The Presses Are Silent')).toBeInTheDocument();
    expect(screen.getByText('No Editions')).toBeInTheDocument();
    expect(screen.queryByText('Arena Stats')).not.toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('orders issues newest-first and Historical Recall reveals the archive remainder', () => {
    seed([1, 3, 5, 2, 4].map(issue));
    renderPage();

    expect(screen.getByText('Week 5 headline')).toBeInTheDocument();
    expect(screen.getByText('Week 4 headline')).toBeInTheDocument();
    expect(screen.getByText('Week 3 headline')).toBeInTheDocument();
    expect(screen.queryByText('Week 2 headline')).not.toBeInTheDocument();
    expect(screen.queryByText('Week 1 headline')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Historical Recall/i }));

    expect(screen.getByText('Week 2 headline')).toBeInTheDocument();
    expect(screen.getByText('Week 1 headline')).toBeInTheDocument();
  });
});
