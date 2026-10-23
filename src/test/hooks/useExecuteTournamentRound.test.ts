// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@/test/_setup/setup';
import { useExecuteTournamentRound } from '@/hooks/useExecuteTournamentRound';
import { useGameStore } from '@/state/useGameStore';
import { engineProxy } from '@/engine/runtime/workerProxy';
import { bumpEngineEpoch } from '@/engine/runtime/session';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { audioManager } from '@/lib/AudioManager';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import type { TournamentEntry } from '@/types/state.types';

vi.mock('@/engine/runtime/workerProxy', () => ({
  engineProxy: {
    advanceDay: vi.fn(async (s: { day?: number }) => ({ ...s, day: (s.day ?? 0) + 1 })),
    advanceWeek: vi.fn(async (s: unknown) => s),
    resolveTournamentRound: vi.fn(async (s: unknown) => ({
      updatedState: s,
      roundResults: [],
      isComplete: false,
    })),
  },
}));

vi.mock('@/engine/storage/archiveService', () => ({
  archiveService: { archiveHotState: vi.fn(async () => undefined) },
}));

vi.mock('sonner', () => __SHARED_MOCKS.sonner);

vi.mock('@/lib/AudioManager', () => ({
  audioManager: { play: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

/**
 * The Tournaments page "ADVANCE BRACKET" CTA must route through the canonical
 * day-tick path (`doAdvanceDay` → engineSession epoch guard → worker
 * advanceDay with tournamentDaySeed), not a bespoke `resolveTournamentRound`
 * call that bypasses the session guard and diverges on seeds.
 */
describe('useExecuteTournamentRound', () => {
  const tournament = {
    id: 'tour-1',
    completed: false,
    bracket: [],
  } as unknown as TournamentEntry;

  beforeEach(() => {
    const state = createFreshState('exec-round');
    useGameStore.getState().loadGame('slot-1', {
      ...state,
      week: 9,
      year: 3,
      day: 2,
      isTournamentWeek: true,
      activeTournamentId: 'tour-1' as never,
      tournaments: [tournament],
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('advances the canonical day tick instead of a bespoke round call', async () => {
    const { result } = renderHook(() => useExecuteTournamentRound({ tournament }));

    await act(async () => {
      await result.current();
    });

    // Routed through the serialized/epoch-guarded worker day advance — never
    // the unguarded bespoke round entry.
    expect(engineProxy.advanceDay).toHaveBeenCalledTimes(1);
    expect(engineProxy.resolveTournamentRound).not.toHaveBeenCalled();
    expect(useGameStore.getState().day).toBe(3);
    expect(useGameStore.getState().isSimulating).toBe(false);
  });

  it('returns early while another simulation is in flight', async () => {
    useGameStore.setState({ isSimulating: true } as never);
    const { result } = renderHook(() => useExecuteTournamentRound({ tournament }));

    await act(async () => {
      await result.current();
    });

    expect(engineProxy.advanceDay).not.toHaveBeenCalled();
    expect(engineProxy.resolveTournamentRound).not.toHaveBeenCalled();
    expect(useGameStore.getState().day).toBe(2);
  });

  it('discards a stale result when a loadGame lands mid-advance', async () => {
    vi.mocked(engineProxy.advanceDay).mockImplementationOnce(
      (s: { day?: number }) =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ...s, day: (s.day ?? 0) + 1 } as never), 0)
        )
    );
    const { result } = renderHook(() => useExecuteTournamentRound({ tournament }));

    await act(async () => {
      const pending = result.current();
      // A load/reset landing while the worker computes must null the result.
      bumpEngineEpoch();
      await pending;
    });

    expect(useGameStore.getState().day).toBe(2);
  });

  it('no-ops without a live tournament', async () => {
    const { result } = renderHook(() => useExecuteTournamentRound({ tournament: null }));

    await act(async () => {
      await result.current();
    });

    expect(engineProxy.advanceDay).not.toHaveBeenCalled();
  });

  it('logs and posts "Resolution failed." when the day tick throws', async () => {
    const boom = new Error('engine died');
    useGameStore.setState({ doAdvanceDay: vi.fn().mockRejectedValue(boom) } as never);
    const { result } = renderHook(() => useExecuteTournamentRound({ tournament }));

    await act(async () => {
      await result.current();
    });

    expect(logger.error).toHaveBeenCalledWith('Tournament resolution failed:', boom);
    expect(toast.error).toHaveBeenCalledWith('Resolution failed.');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('logs and posts "Resolution failed." when audio playback throws after a successful advance', async () => {
    const boom = new Error('audio device gone');
    vi.mocked(audioManager.play).mockImplementation(() => {
      throw boom;
    });
    const { result } = renderHook(() => useExecuteTournamentRound({ tournament }));

    await act(async () => {
      await result.current();
    });

    // The advance committed (day ticked) but the catch boundary still owns the
    // user-visible outcome — no success toast may follow a thrown post-step.
    expect(useGameStore.getState().day).toBe(3);
    expect(logger.error).toHaveBeenCalledWith('Tournament resolution failed:', boom);
    expect(toast.error).toHaveBeenCalledWith('Resolution failed.');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
