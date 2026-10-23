// @vitest-environment jsdom
/**
 * useRivalryAlerts — escalation toasts route through sonner: the bare
 * `toast(...)` for sub-Bitter jumps and `toast.error` for Bitter (4) and
 * Blood Feud (5). Escalation only fires when a prior snapshot recorded a
 * non-zero intensity, so each case mounts at intensity 2 then grows it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { useRivalryAlerts } from '@/hooks/useRivalryAlerts';

vi.mock('sonner', () => __SHARED_MOCKS.sonner);

let mockState: any;

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (state: any) => unknown) =>
    selector ? selector(mockState) : mockState,
  useWorldState: () => mockState,
}));

const bout = (by: 'Kill' | 'KO') => ({
  warriorIdA: 'p1',
  warriorIdD: 'r1',
  winner: 'A',
  by,
});

const baseState = (arenaHistory: any[]) => ({
  roster: [{ id: 'p1' }],
  graveyard: [],
  rivals: [{ owner: { id: 'o1', stableName: 'Doom' }, roster: [{ id: 'r1' }] }],
  arenaHistory,
});

describe('useRivalryAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // One kill bout → intensity 2 baseline snapshot.
    mockState = baseState([bout('Kill')]);
  });

  it('fires no toast on the first snapshot (escalation needs a prior reading)', () => {
    renderHook(() => useRivalryAlerts());
    expect(toast).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('posts a default toast when intensity rises below Bitter', () => {
    const { rerender } = renderHook(() => useRivalryAlerts());
    // 1 kill + 4 non-kill bouts → intensity 3 (<4 → default toast).
    mockState = baseState([bout('Kill'), bout('KO'), bout('KO'), bout('KO'), bout('KO')]);
    rerender();
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining('Rivalry Escalated: Doom'),
      expect.objectContaining({ description: expect.any(String) })
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('posts toast.error when intensity reaches Bitter (4)', () => {
    const { rerender } = renderHook(() => useRivalryAlerts());
    // Second kill → intensity 4 (destructive variant → toast.error).
    mockState = baseState([bout('Kill'), bout('Kill')]);
    rerender();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Rivalry Escalated: Doom'),
      expect.objectContaining({ description: expect.any(String) })
    );
    expect(toast).not.toHaveBeenCalled();
  });

  it('posts toast.error with the Blood Feud title at intensity 5', () => {
    const { rerender } = renderHook(() => useRivalryAlerts());
    // 2 kills + 5 bouts → min(4,4)+1 = 5.
    mockState = baseState([bout('Kill'), bout('Kill'), bout('KO'), bout('KO'), bout('KO')]);
    rerender();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('BLOOD FEUD: Doom'),
      expect.objectContaining({ description: expect.any(String) })
    );
    expect(toast).not.toHaveBeenCalled();
  });

  it('still posts the escalation toast when Web Audio is unavailable', () => {
    // playImpactSFX must fail silently — an AudioContext constructor that
    // throws (or its absence) can never eat the escalation toast.
    vi.stubGlobal(
      'AudioContext',
      function () {
        throw new Error('no audio');
      }
    );
    const { rerender } = renderHook(() => useRivalryAlerts());
    mockState = baseState([bout('Kill'), bout('Kill')]);
    rerender();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Rivalry Escalated: Doom'),
      expect.objectContaining({ description: expect.any(String) })
    );
  });
});
