/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InsightManager } from '@/components/ledger/InsightManager/index';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    insightTokens: [],
    roster: [],
    consumeInsightToken: vi.fn(),
  })),
}));

vi.mock('@/components/ledger/InsightManager/hooks/useInsightManager', () => ({
  useInsightManager: vi.fn(() => ({
    tokens: [],
    safeRoster: [],
    selectedTokenId: null,
    setSelectedTokenId: vi.fn(),
    selectedWarriorId: null,
    setSelectedWarriorId: vi.fn(),
    selectedWarrior: null,
    isRevealing: false,
    revealData: null,
    setRevealData: vi.fn(),
    handleReveal: vi.fn(),
  })),
}));

import { useInsightManager } from '@/components/ledger/InsightManager/hooks/useInsightManager';

describe('InsightManager', () => {
  it('renders the Insight Vault when there are no tokens', () => {
    render(<InsightManager />);
    expect(screen.getByText('Insight Vault')).toBeInTheDocument();
    expect(screen.getByText('Tokens Available: 0')).toBeInTheDocument();
  });

  it('renders correctly when there are tokens', () => {
    vi.mocked(useInsightManager).mockReturnValue({
      tokens: [{ id: 'tk1', hintText: 'A clue' }],
      safeRoster: [],
      selectedTokenId: null,
      setSelectedTokenId: vi.fn(),
      selectedWarriorId: null,
      setSelectedWarriorId: vi.fn(),
      selectedWarrior: null,
      isRevealing: false,
      revealData: null,
      setRevealData: vi.fn(),
      handleReveal: vi.fn(),
    } as any);

    render(<InsightManager />);
    expect(screen.getByText('Tokens Available: 1')).toBeInTheDocument();
  });
});
