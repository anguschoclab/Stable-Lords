import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/engine/bout/core/pairings', () => ({
  generatePairings: vi.fn(() => [{ a: { id: 'w1' }, d: { id: 'w2' }, isRivalry: false }]),
}));

vi.mock('@/engine/warriorStatus', () => ({
  isFightReady: vi.fn(() => true),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    // Support toast() function call for death notifications
    default: vi.fn(),
  },
}));

vi.mock('@/engine/workerProxy', () => ({
  engineProxy: {
    runAutosim: vi.fn(),
  },
}));

vi.mock('@/state/useGameStore', () => {

  const doAdvanceWeek = vi.fn().mockResolvedValue(undefined);
  const doAdvanceDay = vi.fn().mockResolvedValue(undefined);
  const setSimulating = vi.fn();
  const loadGame = vi.fn();

  const store = {
    week: 3,
    day: 0,
    isTournamentWeek: false,
    isSimulating: false,
    activeSlotId: 'slot-1',
    roster: [],
    rivals: [],
    boutOffers: {},
    lastWeekBoutDisplay: {
      results: [{ a: { id: 'w1', name: 'Alpha' }, d: { id: 'w2', name: 'Beta' }, outcome: { winner: 'w1', by: 'KO', rounds: 3 }, isRivalry: false }],
      deathNames: [],
      injuryNames: [],
    },
    doAdvanceWeek,
    doAdvanceDay,
    setSimulating,
    loadGame,
  };

  const useGameStore = vi.fn((selector?: (s: typeof store) => unknown) => {
    if (typeof selector === 'function') return selector(store);
    return store;
  }) as unknown as typeof vi.fn & { getState: () => typeof store };

  (useGameStore as any).getState = () => store;

  return {
    useGameStore,
    reconstructGameState: vi.fn((s) => ({
      ...s,
      week: s.week,
      day: s.day,
      isTournamentWeek: s.isTournamentWeek,
      roster: s.roster ?? [],
      rivals: s.rivals ?? [],
      boutOffers: s.boutOffers ?? {},
    })),
  };
});

import { renderHook, act } from '@testing-library/react';
import { useWeekExecution } from '@/hooks/useWeekExecution';
import { generatePairings } from '@/engine/bout/core/pairings';
import { toast } from 'sonner';
import { engineProxy } from '@/engine/workerProxy';
import { useGameStore } from '@/state/useGameStore';

describe('useWeekExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore store action mocks to working defaults after clearAllMocks wipes them
    const store = useGameStore() as any;
    store.doAdvanceWeek.mockResolvedValue(undefined);
    store.doAdvanceDay.mockResolvedValue(undefined);
  });

  it('calls doAdvanceWeek when not tournament week', async () => {
    const store = useGameStore() as any;
    const { result } = renderHook(() => useWeekExecution());
    await act(async () => {
      await result.current.executeWeek();
    });
    expect(store.doAdvanceWeek).toHaveBeenCalledOnce();
    expect(store.doAdvanceDay).not.toHaveBeenCalled();
  });

  it('calls doAdvanceDay when isTournamentWeek=true', async () => {
    const store = useGameStore() as any;
    vi.mocked(useGameStore).mockImplementation((selector?: any) => {
      const s = { ...store, isTournamentWeek: true };
      if (typeof selector === 'function') return selector(s);
      return s;
    });
    const { result } = renderHook(() => useWeekExecution());
    await act(async () => {
      await result.current.executeWeek();
    });
    expect(store.doAdvanceDay).toHaveBeenCalledOnce();
  });

  it('running is false before and after execution completes', async () => {
    const { result } = renderHook(() => useWeekExecution());
    expect(result.current.running).toBe(false);
    await act(async () => {
      await result.current.executeWeek();
    });
    // doAdvanceWeek was called — execution ran
    const store = useGameStore() as any;
    expect(store.doAdvanceWeek).toHaveBeenCalledOnce();
    // running resets to false when done
    expect(result.current.running).toBe(false);
  });

  it('is a no-op if already running', async () => {
    let resolveAdvance: () => void = () => {};
    const pendingPromise = new Promise<void>((resolve) => {
      resolveAdvance = resolve;
    });
    const store = useGameStore() as any;
    store.doAdvanceWeek.mockReturnValue(pendingPromise);

    const { result } = renderHook(() => useWeekExecution());
    await act(async () => {
      // Fire two concurrent calls
      const p1 = result.current.executeWeek();
      const p2 = result.current.executeWeek();
      resolveAdvance();
      await Promise.all([p1, p2]);
    });
    expect(store.doAdvanceWeek).toHaveBeenCalledOnce();
  });

  it('posts error toast when 0 eligible fighters (matchCard=0, fightReady<2)', async () => {
    vi.mocked(generatePairings).mockReturnValueOnce([]);
    const { result } = renderHook(() => useWeekExecution());
    await act(async () => {
      await result.current.executeWeek();
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it('posts success toast with week number on completion', async () => {
    const { result } = renderHook(() => useWeekExecution());
    await act(async () => {
      await result.current.executeWeek();
    });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('3'));
  });

  it('populates results from store after advance completes', async () => {
    const { result } = renderHook(() => useWeekExecution());
    await act(async () => {
      await result.current.executeWeek();
    });
    // Results come from store.lastWeekBoutDisplay.results
    expect(result.current.results).toHaveLength(1);
  });

  it('clears results when clearResults is called', async () => {
    const { result } = renderHook(() => useWeekExecution());
    await act(async () => {
      await result.current.executeWeek();
    });
    expect(result.current.results).toHaveLength(1);
    act(() => {
      result.current.clearResults();
    });
    expect(result.current.results).toHaveLength(0);
  });

  it('handleStartAutosim calls engineProxy.runAutosim with correct params', async () => {
    vi.mocked(engineProxy.runAutosim).mockResolvedValue({
      finalState: {} as any,
      weeksSimmed: 4,
      stopReason: 'max_weeks',
      stopDetail: 'done',
      weekSummaries: [],
    });
    const { result } = renderHook(() => useWeekExecution());
    await act(async () => {
      await result.current.handleStartAutosim(4);
    });
    expect(engineProxy.runAutosim).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ weeksToSim: 4 })
    );
  });

  it('handleStartAutosim calls loadGame with finalState on success', async () => {
    const finalState = { week: 7 } as any;
    vi.mocked(engineProxy.runAutosim).mockResolvedValue({
      finalState,
      weeksSimmed: 4,
      stopReason: 'max_weeks',
      stopDetail: 'done',
      weekSummaries: [],
    });
    const store = useGameStore() as any;
    const { result } = renderHook(() => useWeekExecution());
    await act(async () => {
      await result.current.handleStartAutosim(4);
    });
    expect(store.loadGame).toHaveBeenCalledWith('slot-1', finalState);
  });

  it('handleStartAutosim is guarded against concurrent calls', async () => {
    vi.mocked(engineProxy.runAutosim).mockResolvedValue({
      finalState: {} as any,
      weeksSimmed: 4,
      stopReason: 'max_weeks',
      stopDetail: 'done',
      weekSummaries: [],
    });
    const { result } = renderHook(() => useWeekExecution());
    await act(async () => {
      const p1 = result.current.handleStartAutosim(4);
      const p2 = result.current.handleStartAutosim(4);
      await Promise.all([p1, p2]);
    });
    expect(engineProxy.runAutosim).toHaveBeenCalledOnce();
  });
});
