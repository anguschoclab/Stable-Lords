// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

let mockState: any = {};

vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn((selector?: any) => (selector ? selector(mockState) : mockState)),
}));

vi.mock('zustand/react/shallow', async () => await import('@/test/_mocks/useShallow'));

vi.mock('@/components/EntityLink', async () => await import('@/test/_mocks/entityLinks'));

import { ActionTimeline } from '@/components/dashboard/ActionTimeline';

describe('ActionTimeline', () => {
  beforeEach(() => {
    mockState = {
      roster: [{ id: 'w1', name: 'Brutus' }],
      graveyard: [],
      retired: [],
      rivals: [{ owner: { stableName: 'Wolf Pack' }, roster: [] }],
      player: { stableName: "Dragon's Hearth" },
    };
  });

  it('warrior names in event.description render as WarriorLink', () => {
    render(
      <ActionTimeline
        events={[{ week: 1, description: 'Signed warrior Brutus for 100g', riskTier: 'Low' }]}
      />
    );
    expect(screen.getAllByTestId('warrior-link').length).toBeGreaterThan(0);
  });

  it('stable names in event.description render as StableLink', () => {
    render(
      <ActionTimeline
        events={[{ week: 1, description: "Dragon's Hearth raided rivals", riskTier: 'High' }]}
      />
    );
    expect(screen.getAllByTestId('stable-link').length).toBeGreaterThan(0);
  });

  it('empty events renders empty state', () => {
    render(<ActionTimeline events={[]} />);
    expect(screen.getByText('No recent actions recorded.')).toBeInTheDocument();
  });
});
