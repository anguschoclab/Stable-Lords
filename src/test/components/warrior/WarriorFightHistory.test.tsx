// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WarriorFightHistory } from '@/components/warrior/WarriorFightHistory';
import { useGameStore } from '@/state/useGameStore';
import { makeGameState, makeFightSummary } from '@/test/_fixtures/factories';

vi.mock('@/components/BoutViewer', () => ({
  default: () => <div data-testid="bout-viewer" />,
}));

describe('WarriorFightHistory', () => {
  beforeEach(() => {
    useGameStore.setState({ ...makeGameState({}) } as never);
  });

  // PR #1027 — the list must not hold a store subscription: only expanded
  // rows read state, via primitive weapon-id selectors. Mutating a store
  // slice the row does not read must not re-render the list.
  describe('subscription narrowing', () => {
    it('does not re-render when a non-subscribed slice changes', () => {
      const warriorId = 'w_subject' as never;
      const fight = makeFightSummary({
        warriorIdA: warriorId,
        transcript: ['First blood.'],
      });
      let commits = 0;
      render(
        <React.Profiler
          id="fight-history"
          onRender={() => {
            commits++;
          }}
        >
          <WarriorFightHistory arenaHistory={[fight]} warriorId={warriorId} />
        </React.Profiler>
      );
      fireEvent.click(screen.getByRole('button'));
      const afterExpand = commits;
      act(() => {
        useGameStore.setState({ roster: [...useGameStore.getState().roster] });
      });
      expect(commits).toBe(afterExpand);
    });
  });
});
