// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Warrior, GameState } from '@/types/game';
import { FightingStyle } from '@/types/game';
import '@/test/_setup/setup';

import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

let storeState: any = {};
const setStateSpy = vi.fn();

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (state: any) => any) => {
    const state = { ...storeState, setState: setStateSpy };
    return selector ? selector(state) : state;
  },
  useWorldState: () => storeState,
}));

function createMockWarrior(id: string, overrides?: Partial<Warrior>): Warrior {
  return {
    id,
    name: `Warrior ${id}`,
    status: 'Active',
    fame: 0,
    popularity: 0,
    style: FightingStyle.StrikingAttack,
    champion: false,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    potential: undefined,
    traits: [],
    fatigue: 0,
    ...overrides,
  } as Warrior;
}

function setStore(overrides: Partial<GameState> = {}) {
  storeState = {
    ftueComplete: true,
    coachDismissed: [],
    roster: [],
    arenaHistory: [],
    boutOffers: {},
    retired: [],
    trainers: [],
    tournaments: [],
    graveyard: [],
    ...overrides,
  };
}

// Import after mocks are declared
import { useCoachTip } from '@/hooks/useCoachTip';

describe('useCoachTip', () => {
  beforeEach(() => {
    (toast as any).mockClear();
    setStateSpy.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves warrior context via rosterMap for /warrior/:id routes', async () => {
    const w50 = createMockWarrior('w50', { name: 'Fiftieth' });
    setStore({ roster: [createMockWarrior('w1'), w50] });

    renderHook(() => useCoachTip('/warrior/w50'));
    vi.advanceTimersByTime(1100);
    await Promise.resolve();

    // The warrior-equipment tip should fire because w50 has no equipment
    expect(toast).toHaveBeenCalled();
    const message = (toast as any).mock.calls[0]?.[0];
    expect(message).toContain('Equip');
  });

  it('resolves correct warrior from a large roster (O(1) Map lookup)', async () => {
    const roster: Warrior[] = [];
    for (let i = 0; i < 100; i++) {
      roster.push(createMockWarrior(`w${i}`));
    }
    const target = createMockWarrior('w50', { name: 'Target Warrior' });
    roster[50] = target;
    setStore({ roster });

    renderHook(() => useCoachTip('/warrior/w50'));
    vi.advanceTimersByTime(1100);
    await Promise.resolve();

    expect(toast).toHaveBeenCalled();
  });

  it('falls through when warrior ID is not found in roster', async () => {
    setStore({ roster: [createMockWarrior('w1')] });

    renderHook(() => useCoachTip('/warrior/nonexistent'));
    vi.advanceTimersByTime(1100);
    await Promise.resolve();

    // warrior-equipment and warrior-strategy conditions fail (no warrior),
    // but warrior-first-visit has no condition and should fire
    expect(toast).toHaveBeenCalled();
    const message = (toast as any).mock.calls[0]?.[0];
    expect(message).toContain("warrior's detail page");
  });

  it('does not attempt warrior lookup for non-warrior routes', async () => {
    setStore({ roster: [createMockWarrior('w1')] });

    renderHook(() => useCoachTip('/stable'));
    vi.advanceTimersByTime(1100);
    await Promise.resolve();

    // /stable route has stable-first-round tip, but it requires boutOffers
    // With empty boutOffers, no tip fires
    expect(toast).not.toHaveBeenCalled();
  });

  it('rebuilds rosterMap when roster reference changes', async () => {
    const roster1 = [createMockWarrior('w1')];
    setStore({ roster: roster1 });

    const { rerender } = renderHook(({ path }) => useCoachTip(path), {
      initialProps: { path: '/warrior/w1' },
    });

    vi.advanceTimersByTime(1100);
    await Promise.resolve();
    expect(toast).toHaveBeenCalled();

    // Change roster reference — new array with same warrior
    (toast as any).mockClear();
    const roster2 = [createMockWarrior('w1', { name: 'Updated' })];
    setStore({ roster: roster2 });
    rerender({ path: '/warrior/w1' });

    vi.advanceTimersByTime(1100);
    await Promise.resolve();
    // Should fire again with the new roster
    expect(toast).toHaveBeenCalled();
  });

  it('does not fire tips when ftueComplete is false', async () => {
    setStore({ ftueComplete: false, roster: [createMockWarrior('w1')] });

    renderHook(() => useCoachTip('/warrior/w1'));
    vi.advanceTimersByTime(1100);
    await Promise.resolve();

    expect(toast).not.toHaveBeenCalled();
  });
});
