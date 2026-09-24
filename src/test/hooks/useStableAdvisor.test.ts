// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle, type WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, BoutOffer } from '@/types/state.types';
import '@/test/_setup/setup';

const baseAttrs = { ST: 14, CN: 14, SZ: 11, WT: 12, WL: 11, SP: 14, DF: 11 };

function makeTestWarrior(id: string, name: string, overrides?: Partial<Warrior>): Warrior {
  return makeWarrior(id as any, name, FightingStyle.AimedBlow, baseAttrs, {
    ...overrides,
  });
}

function makeOffer(id: string, widA: string, widB: string, purse = 250): BoutOffer {
  return {
    id: id as any,
    promoterId: 'p1' as any,
    warriorIds: [widA as any, widB as any],
    boutWeek: 2,
    createdAbsoluteWeek: 1,
    expirationWeek: 2,
    purse,
    hype: 10,
    status: 'Proposed',
    responses: { [widA]: 'Pending', [widB]: 'Pending' } as any,
  };
}

describe('useStableAdvisor', () => {
  beforeEach(() => {
    const fresh = createFreshState('test-seed');
    fresh.week = 1;
    fresh.absoluteWeek = 1;
    fresh.year = 1;
    fresh.season = 'Spring';
    fresh.weather = 'Clear';
    fresh.roster = [];
    fresh.trainingAssignments = [];
    fresh.boutOffers = {};
    useGameStore.getState().loadGame('test-slot', fresh as GameState);
  });

  it('renders report from current world state', () => {
    const w1 = makeTestWarrior('w1', 'Aulus');
    const state = useGameStore.getState();
    act(() => {
      state.setState((draft) => {
        draft.roster = [w1];
      });
    });

    const { result } = renderHook(() => useStableAdvisor());
    expect(result.current.report.cards).toHaveLength(1);
    expect(result.current.report.cards[0]!.warriorId).toBe('w1');
    expect(result.current.report.summary.totalWarriors).toBe(1);
  });

  it('applies recommendation for a single warrior', () => {
    const w1 = makeTestWarrior('w1', 'Aulus');
    const rival = makeTestWarrior('r1', 'Rival', { style: FightingStyle.WallOfSteel });
    const offer = makeOffer('off_1', 'w1', 'r1', 300);

    const state = useGameStore.getState();
    act(() => {
      state.setState((draft) => {
        draft.roster = [w1];
        draft.rivals = [{ id: 'rival_stable', roster: [rival], owner: { stableName: 'Rivals' } } as any];
        draft.boutOffers = { off_1: offer } as any;
      });
    });

    const { result } = renderHook(() => useStableAdvisor());

    act(() => {
      result.current.applyWarriorSetup('w1' as WarriorId);
    });

    const updated = useGameStore.getState();
    // 1. Training assignment applied
    expect(updated.trainingAssignments.some((a) => a.warriorId === 'w1')).toBe(true);
    // 2. Bout offer accepted
    expect((updated.boutOffers as any)['off_1']?.responses['w1']).toBe('Accepted');
    // 3. Plan updated
    const updatedWarrior = updated.roster.find((w) => w.id === 'w1');
    expect(updatedWarrior?.plan?.offensiveTactic).toBeDefined();
    expect(updatedWarrior?.plan?.defensiveTactic).toBeDefined();
  });

  it('applies all recommendations in one atomic batch', () => {
    const w1 = makeTestWarrior('w1', 'Aulus');
    const w2 = makeTestWarrior('w2', 'Brutus', {
      injuries: [
        {
          id: 'i1' as any,
          name: 'Sprain',
          description: '',
          severity: 'Moderate',
          weeksRemaining: 2,
          penalties: {},
        },
      ],
    });

    const state = useGameStore.getState();
    act(() => {
      state.setState((draft) => {
        draft.roster = [w1, w2];
      });
    });

    const { result } = renderHook(() => useStableAdvisor());

    act(() => {
      result.current.applyAllSetups();
    });

    const updated = useGameStore.getState();
    // Both warriors received training assignments
    expect(updated.trainingAssignments).toHaveLength(2);
    const w2Assignment = updated.trainingAssignments.find((a) => a.warriorId === 'w2');
    expect(w2Assignment?.type).toBe('recovery');

    // W2 (injured) plan set to yield
    const updatedW2 = updated.roster.find((w) => w.id === 'w2');
    expect(updatedW2?.plan?.fallbackCondition).toBe('YIELD');
  });

  it('updates campaign focus when pinned by user', () => {
    const w1 = makeTestWarrior('w1', 'Aulus');
    const state = useGameStore.getState();
    act(() => {
      state.setState((draft) => {
        draft.roster = [w1];
      });
    });

    const { result } = renderHook(() => useStableAdvisor());

    act(() => {
      result.current.setWarriorCampaignFocus('w1' as WarriorId, 'TOURNAMENT_PUSH');
    });

    const updatedWarrior = useGameStore.getState().roster.find((w) => w.id === 'w1');
    expect(updatedWarrior?.campaignFocus).toBe('TOURNAMENT_PUSH');
  });
});
