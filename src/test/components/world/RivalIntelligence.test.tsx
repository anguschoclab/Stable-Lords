// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RivalIntelligence } from '@/components/world/RivalIntelligence';
import { makeRival } from '@/test/_fixtures/factories';
import type { StableId } from '@/types/shared.types';

vi.mock('@/components/widgets', () => ({
  MetaDriftWidget: () => <div data-testid="meta-drift" />,
}));
vi.mock('@/components/bookmarks/BookmarkButton', () => ({
  BookmarkButton: () => <div data-testid="bookmark" />,
}));

const baseMemory = (over: any = {}) => ({
  lastTreasury: 1000,
  burnRate: 50,
  metaAwareness: {},
  knownRivals: [],
  opponentDossiers: {},
  ...over,
});

describe('RivalIntelligence (H.2)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders an intel-quality chip derived from dossier coverage', () => {
    const rival = makeRival({
      id: 'r1' as StableId,
      agentMemory: baseMemory({
        opponentDossiers: {
          's-a': { lastSeenWeek: 4, recordVs: { w: 1, l: 0, k: 0 }, knownStyles: [], estimatedThreat: 0.6 },
          's-b': { lastSeenWeek: 4, recordVs: { w: 0, l: 2, k: 0 }, knownStyles: [], estimatedThreat: 0.7 },
        },
      }),
    });
    render(<RivalIntelligence rivals={[rival]} />);
    expect(screen.getByTestId('intel-quality-chip')).toHaveTextContent(/2/);
  });

  it('shows honest zero-intel state when no dossiers exist', () => {
    const rival = makeRival({ id: 'r1' as StableId, agentMemory: baseMemory() });
    render(<RivalIntelligence rivals={[rival]} />);
    expect(screen.getByTestId('intel-quality-chip')).toHaveTextContent(/no intel/i);
  });

  it('renders a tournament-posture chip only while campaigning', () => {
    const campaigning = makeRival({
      id: 'r1' as StableId,
      agentMemory: baseMemory(),
      strategy: { intent: 'TOURNAMENT_CAMPAIGN', planWeeksRemaining: 2 },
    });
    const idle = makeRival({
      id: 'r2' as StableId,
      agentMemory: baseMemory(),
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    });
    const { container } = render(<RivalIntelligence rivals={[campaigning, idle]} />);
    const chips = container.querySelectorAll('[data-testid="tournament-posture-chip"]');
    expect(chips).toHaveLength(1);
    expect(chips[0]).toHaveTextContent(/tournament/i);
  });
});
