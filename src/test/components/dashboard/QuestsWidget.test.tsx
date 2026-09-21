// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestsWidget } from '@/components/dashboard/QuestsWidget';
import { useGameStore } from '@/state/useGameStore';
import { QUESTS_DISMISSED } from '@/engine/onboarding/quests';
import { makeGameState, makeFightSummary } from '@/test/_fixtures/factories';

describe('QuestsWidget (G4)', () => {
  beforeEach(() => {
    useGameStore.setState({ ...makeGameState({ arenaHistory: [], scoutReports: [], trainers: [] }) } as never);
  });

  it('renders the checklist on a fresh state', () => {
    render(<QuestsWidget />);
    expect(screen.getByText(/getting started/i)).toBeInTheDocument();
    expect(screen.getByText(/fight your first bout/i)).toBeInTheDocument();
  });

  it('hides once dismissed via coachDismissed sentinel', () => {
    render(<QuestsWidget />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(useGameStore.getState().coachDismissed).toContain(QUESTS_DISMISSED);
  });

  it('hides when all quests are complete', () => {
    useGameStore.setState(
      {
        ...makeGameState({
          absoluteWeek: 3,
          arenaHistory: [makeFightSummary({ by: 'KO' })],
          scoutReports: [{} as never],
          trainingAssignments: [{} as never],
          roster: [
            {
              ...useGameStore.getState().roster[0],
              equipment: { weapon: 'sword', armor: 'a', shield: 's', helm: 'h' },
            } as never,
          ],
        }),
      } as never
    );
    const { container } = render(<QuestsWidget />);
    expect(container.firstChild).toBeNull();
  });
});
