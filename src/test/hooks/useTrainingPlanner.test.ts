// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrainingPlanner } from '@/pages/TrainingPlanner/hooks/useTrainingPlanner';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan, Warrior } from '@/types/game';
import type { GameState } from '@/types/state.types';
import '@/test/_setup/setup';

const baseAttrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

function makeTestWarrior(id: string, name: string, overrides?: Partial<Warrior>): Warrior {
  return makeWarrior(id as any, name, FightingStyle.StrikingAttack, baseAttrs, {
    ...overrides,
  });
}

function makePlan(style: FightingStyle = FightingStyle.StrikingAttack): FightPlan {
  return {
    style,
    OE: 5,
    AL: 5,
    killDesire: 5,
    target: 'Any',
    offensiveTactic: 'Decisiveness',
    defensiveTactic: 'none',
  };
}

function loadState(roster: Warrior[]) {
  const state = createFreshState('test-seed');
  state.roster = roster;
  useGameStore.getState().loadGame('test-slot', state as GameState);
}

describe('useTrainingPlanner', () => {
  beforeEach(() => {
    const fresh = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', fresh as GameState);
  });

  it('returns activeWarriors filtered to status === Active only', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    const w2 = makeTestWarrior('w2', 'Beta', { status: 'Dead' });
    const w3 = makeTestWarrior('w3', 'Gamma', { status: 'Retired' });
    loadState([w1, w2, w3]);

    const { result } = renderHook(() => useTrainingPlanner());
    expect(result.current.activeWarriors).toHaveLength(1);
    expect(result.current.activeWarriors[0]!.id).toBe('w1');
  });

  it('defaults selectedId to first active warrior id', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    const w2 = makeTestWarrior('w2', 'Beta');
    loadState([w1, w2]);

    const { result } = renderHook(() => useTrainingPlanner());
    expect(result.current.selectedId).toBe('w1');
  });

  it('setSelectedId updates the selected id', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    const w2 = makeTestWarrior('w2', 'Beta');
    loadState([w1, w2]);

    const { result } = renderHook(() => useTrainingPlanner());
    act(() => {
      result.current.setSelectedId('w2');
    });
    expect(result.current.selectedId).toBe('w2');
    expect(result.current.selectedWarrior?.id).toBe('w2');
  });

  it('selectedWarrior finds the correct warrior by selectedId', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    const w2 = makeTestWarrior('w2', 'Beta');
    loadState([w1, w2]);

    const { result } = renderHook(() => useTrainingPlanner());
    act(() => {
      result.current.setSelectedId('w2');
    });
    expect(result.current.selectedWarrior?.name).toBe('Beta');
  });

  it('returns setState function from store', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    loadState([w1]);

    const { result } = renderHook(() => useTrainingPlanner());
    expect(typeof result.current.setState).toBe('function');
  });

  it('plansSetCount = 0 when no warriors have plans', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    const w2 = makeTestWarrior('w2', 'Beta');
    loadState([w1, w2]);

    const { result } = renderHook(() => useTrainingPlanner());
    expect(result.current.plansSetCount).toBe(0);
  });

  it('plansSetCount = N when all active warriors have plans', () => {
    const w1 = makeTestWarrior('w1', 'Alpha', { plan: makePlan() });
    const w2 = makeTestWarrior('w2', 'Beta', { plan: makePlan() });
    loadState([w1, w2]);

    const { result } = renderHook(() => useTrainingPlanner());
    expect(result.current.plansSetCount).toBe(2);
  });

  it('plansSetCount = correct count when mixed', () => {
    const w1 = makeTestWarrior('w1', 'Alpha', { plan: makePlan() });
    const w2 = makeTestWarrior('w2', 'Beta');
    const w3 = makeTestWarrior('w3', 'Gamma', { plan: makePlan() });
    loadState([w1, w2, w3]);

    const { result } = renderHook(() => useTrainingPlanner());
    expect(result.current.plansSetCount).toBe(2);
  });

  it('plansSetCount only counts active warriors', () => {
    const w1 = makeTestWarrior('w1', 'Alpha', { plan: makePlan() });
    const w2 = makeTestWarrior('w2', 'Beta', { status: 'Dead', plan: makePlan() });
    loadState([w1, w2]);

    const { result } = renderHook(() => useTrainingPlanner());
    expect(result.current.activeWarriors).toHaveLength(1);
    expect(result.current.plansSetCount).toBe(1);
  });

  it('empty roster returns empty activeWarriors, null selectedId, undefined selectedWarrior, 0 plansSetCount', () => {
    loadState([]);

    const { result } = renderHook(() => useTrainingPlanner());
    expect(result.current.activeWarriors).toHaveLength(0);
    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedWarrior).toBeUndefined();
    expect(result.current.plansSetCount).toBe(0);
  });

  it('does NOT return seasonalGainsMap, avgTrainability, or currentTrainers', () => {
    const w1 = makeTestWarrior('w1', 'Alpha');
    loadState([w1]);

    const { result } = renderHook(() => useTrainingPlanner());
    expect((result.current as any).seasonalGainsMap).toBeUndefined();
    expect((result.current as any).avgTrainability).toBeUndefined();
    expect((result.current as any).currentTrainers).toBeUndefined();
  });
});
