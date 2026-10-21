// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useScouting } from '@/pages/scouting/useScouting';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeRivalStable } from '@/test/_fixtures/factories';
import { makeTestWarrior } from '@/test/_fixtures/namedWarrior';
import { getScoutCost } from '@/engine/scouting/scouting';
import type { GameState } from '@/types/state.types';
import type { RivalStableData } from '@/types/game';
import '@/test/_setup/setup';

vi.mock('sonner', () => __SHARED_MOCKS.sonner);

function loadState(rivals: RivalStableData[], treasury = 200) {
  const state = createFreshState('scouting-contract-seed');
  state.week = 3;
  state.treasury = treasury;
  state.rivals = rivals;
  state.scoutReports = [];
  useGameStore.getState().loadGame('scouting-contract', state as GameState);
}

describe('useScouting controller', () => {
  beforeEach(() => {
    loadState([]);
    vi.clearAllMocks();
  });

  it('selecting a different rival clears the previously selected warrior', () => {
    const warriorA = makeTestWarrior('rival-a-w1', 'Alpha');
    const rivalA = makeRivalStable('rival-a', [warriorA]);
    const rivalB = makeRivalStable('rival-b', [makeTestWarrior('rival-b-w1', 'Beta')]);
    loadState([rivalA, rivalB]);

    const { result } = renderHook(() => useScouting(false));
    act(() => result.current.handleSelectRival(rivalA.owner.id));
    act(() => result.current.handleSelectWarrior(warriorA.id));
    expect(result.current.selectedWarriorId).toBe(warriorA.id);

    act(() => result.current.handleSelectRival(rivalB.owner.id));

    expect(result.current.selectedRivalId).toBe(rivalB.owner.id);
    expect(result.current.selectedWarriorId).toBeNull();
  });

  it('refuses an unaffordable report without mutating scouting state', () => {
    const warrior = makeTestWarrior('rival-w1', 'Cassius');
    const rival = makeRivalStable('rival-a', [warrior]);
    loadState([rival], 0);

    const { result } = renderHook(() => useScouting(false));
    act(() => result.current.handleSelectRival(rival.owner.id));
    act(() => result.current.handleSelectWarrior(warrior.id));
    act(() => result.current.handleScout('Basic'));

    expect(toast.error).toHaveBeenCalledWith('Insufficient funds! Scouting requires 25g.');
    expect(useGameStore.getState().scoutReports).toEqual([]);
    expect(useGameStore.getState().treasury).toBe(0);
  });

  it('files one current report, deducts its real cost, and records the ledger entry', () => {
    const warrior = makeTestWarrior('rival-w1', 'Cassius');
    const rival = makeRivalStable('rival-a', [warrior]);
    loadState([rival], 200);

    const { result } = renderHook(() => useScouting(false));
    act(() => result.current.handleSelectRival(rival.owner.id));
    act(() => result.current.handleSelectWarrior(warrior.id));
    act(() => result.current.handleScout('Detailed'));

    const state = useGameStore.getState();
    expect(state.treasury).toBe(200 - getScoutCost('Detailed'));
    expect(state.scoutReports).toHaveLength(1);
    expect(state.scoutReports?.[0]).toMatchObject({
      warriorId: warrior.id,
      warriorName: 'Cassius',
      quality: 'Detailed',
      week: 3,
    });
    expect(state.ledger.at(-1)).toMatchObject({
      label: 'Scouting: Cassius (Detailed)',
      amount: -getScoutCost('Detailed'),
      category: 'other',
    });
  });

  it('replaces a stale report for the same warrior instead of duplicating it', () => {
    const warrior = makeTestWarrior('rival-w1', 'Cassius');
    const rival = makeRivalStable('rival-a', [warrior]);
    loadState([rival], 200);

    const { result } = renderHook(() => useScouting(false));
    act(() => result.current.handleSelectRival(rival.owner.id));
    act(() => result.current.handleSelectWarrior(warrior.id));
    act(() => result.current.handleScout('Basic'));
    act(() => result.current.handleScout('Expert'));

    const reports = useGameStore.getState().scoutReports ?? [];
    expect(reports).toHaveLength(1);
    expect(reports[0]?.quality).toBe('Expert');
  });

  it('keeps reports for same-name warriors separate — dedupe keys on warriorId', () => {
    // Two different warriors can share a display name; scouting the second
    // must not discard the first's report.
    const warriorA = makeTestWarrior('rival-w1', 'Cassius');
    const warriorB = makeTestWarrior('rival-w2', 'Cassius');
    const rival = makeRivalStable('rival-a', [warriorA, warriorB]);
    loadState([rival], 500);

    const { result } = renderHook(() => useScouting(false));
    act(() => result.current.handleSelectRival(rival.owner.id));

    act(() => result.current.handleSelectWarrior(warriorA.id));
    act(() => result.current.handleScout('Basic'));

    act(() => result.current.handleSelectWarrior(warriorB.id));
    act(() => result.current.handleScout('Basic'));

    const reports = useGameStore.getState().scoutReports ?? [];
    expect(reports).toHaveLength(2);
    expect(reports.map((r) => r.warriorId).sort()).toEqual([warriorA.id, warriorB.id].sort());
  });

  it('deposits generated insight tokens into state.insightTokens', () => {
    // generateScoutInsights emits a Style token on every report — they were
    // previously discarded at the purchase call site.
    const warrior = makeTestWarrior('rival-w1', 'Cassius');
    const rival = makeRivalStable('rival-a', [warrior]);
    loadState([rival], 200);

    const { result } = renderHook(() => useScouting(false));
    act(() => result.current.handleSelectRival(rival.owner.id));
    act(() => result.current.handleSelectWarrior(warrior.id));
    act(() => result.current.handleScout('Basic'));

    const tokens = useGameStore.getState().insightTokens ?? [];
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.some((t) => t.type === 'Style' && t.warriorId === warrior.id)).toBe(true);
  });
});
