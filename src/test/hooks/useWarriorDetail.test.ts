// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import '@/test/_setup/setup';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ id: 'w2' }),
  useNavigate: () => mockNavigate,
}));

import { useWarriorDetail } from '@/pages/WarriorDetail/hooks/useWarriorDetail';
import { useGameStore } from '@/state/useGameStore';
import type { Warrior } from '@/types/state.types';

const makeWarrior = (id: string): Warrior =>
  ({
    id,
    name: `Warrior ${id}`,
    style: 'SlashingAttack',
    status: 'Active',
    fame: 10,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
  }) as unknown as Warrior;

describe('useWarriorDetail', () => {
  beforeEach(() => {
    useGameStore.setState({
      roster: [makeWarrior('w1'), makeWarrior('w2')],
      graveyard: [],
      retired: [],
      rivals: [],
      arenaHistory: [],
      insightTokens: [],
    } as never);
  });

  it('handlePlanChange mutates only the matching roster warrior', () => {
    const { result } = renderHook(() => useWarriorDetail());
    const plan = { strategy: 'defensive' } as never;

    result.current.handlePlanChange(plan);

    const roster = useGameStore.getState().roster;
    expect(roster.find((w) => w.id === 'w2')?.plan).toBe(plan);
    expect(roster.find((w) => w.id === 'w1')?.plan).toBeUndefined();
  });

  it('handleEquipmentChange mutates only the matching roster warrior', () => {
    const { result } = renderHook(() => useWarriorDetail());
    const loadout = { weapon: 'war_axe' } as never;

    result.current.handleEquipmentChange(loadout);

    const roster = useGameStore.getState().roster;
    expect(roster.find((w) => w.id === 'w2')?.equipment).toBe(loadout);
    expect(roster.find((w) => w.id === 'w1')?.equipment).toBeUndefined();
  });

  it('is a no-op when the viewed warrior is not in the player roster', () => {
    useGameStore.setState({ roster: [makeWarrior('w1')] } as never);
    const { result } = renderHook(() => useWarriorDetail());
    const plan = { strategy: 'defensive' } as never;

    result.current.handlePlanChange(plan);

    const roster = useGameStore.getState().roster;
    expect(roster.every((w) => w.plan === undefined)).toBe(true);
  });
});
