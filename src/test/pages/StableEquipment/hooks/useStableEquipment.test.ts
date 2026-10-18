// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStableEquipment } from '@/pages/StableEquipment/hooks/useStableEquipment';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeTestWarrior } from '@/test/_fixtures/namedWarrior';
import {
  checkWeaponRequirements,
  DEFAULT_LOADOUT,
  validateLoadout,
} from '@/data/equipment';
import type { Warrior } from '@/types/game';
import type { GameState } from '@/types/state.types';
import '@/test/_setup/setup';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function loadState(roster: Warrior[]) {
  const state = createFreshState('test-seed');
  state.roster = roster;
  useGameStore.getState().loadGame('test-slot', state as GameState);
}

function makeEligibleWarrior(id: string, name: string) {
  const warrior = makeTestWarrior(id, name, { equipment: DEFAULT_LOADOUT });
  warrior.attributes = { ...warrior.attributes, ST: 15, WT: 15, DF: 15 };
  return warrior;
}

function eligibleRecommendation(
  recs: ReturnType<typeof useStableEquipment>['recs'],
  warrior: Warrior
) {
  const rec = recs.find(
    (candidate) =>
      validateLoadout(candidate.loadout).length === 0 &&
      checkWeaponRequirements(candidate.loadout.weapon, warrior.attributes).met
  );
  if (!rec) throw new Error('Fixture produced no eligible recommendation');
  return rec;
}

describe('useStableEquipment transaction draft', () => {
  beforeEach(() => {
    const fresh = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', fresh as GameState);
  });

  it('stages a loadout for review without mutating warrior equipment', () => {
    const warrior = makeEligibleWarrior('w1', 'Alpha');
    loadState([warrior]);

    const { result } = renderHook(() => useStableEquipment());
    const rec = eligibleRecommendation(result.current.recs, warrior);
    act(() => result.current.handleApply(rec.loadout, rec.label));

    expect(result.current.pendingLoadout).toEqual({ loadout: rec.loadout, label: rec.label });
    expect(useGameStore.getState().roster[0]!.equipment).toEqual(DEFAULT_LOADOUT);
  });

  it('commits the reviewed loadout atomically and clears the pending review', () => {
    const warrior = makeEligibleWarrior('w1', 'Alpha');
    loadState([warrior]);

    const { result } = renderHook(() => useStableEquipment());
    const rec = eligibleRecommendation(result.current.recs, warrior);
    act(() => result.current.handleApply(rec.loadout, rec.label));
    act(() => result.current.commitLoadout());

    expect(useGameStore.getState().roster[0]!.equipment).toEqual(rec.loadout);
    expect(result.current.pendingLoadout).toBeNull();
  });

  it('cancelLoadout discards the pending review without changing the roster', () => {
    const warrior = makeEligibleWarrior('w1', 'Alpha');
    loadState([warrior]);

    const { result } = renderHook(() => useStableEquipment());
    const rec = eligibleRecommendation(result.current.recs, warrior);
    act(() => result.current.handleApply(rec.loadout, rec.label));
    act(() => result.current.cancelLoadout());

    expect(result.current.pendingLoadout).toBeNull();
    expect(useGameStore.getState().roster[0]!.equipment).toEqual(DEFAULT_LOADOUT);
  });

  it('changing the target warrior discards a pending review', () => {
    const warriorA = makeEligibleWarrior('w1', 'Alpha');
    const warriorB = makeEligibleWarrior('w2', 'Beta');
    loadState([warriorA, warriorB]);

    const { result } = renderHook(() => useStableEquipment());
    const rec = eligibleRecommendation(result.current.recs, warriorA);
    act(() => result.current.handleApply(rec.loadout, rec.label));
    act(() => result.current.setTargetWarriorId('w2'));

    expect(result.current.targetWarriorId).toBe('w2');
    expect(result.current.pendingLoadout).toBeNull();
    expect(useGameStore.getState().roster[0]!.equipment).toEqual(DEFAULT_LOADOUT);
  });
});
