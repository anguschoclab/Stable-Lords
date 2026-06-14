// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoutPlayback } from '@/hooks/useBoutPlayback';
import { audioManager } from '@/lib/AudioManager';
import type { MinuteEvent } from '@/types/game';
import '@/test/_setup/setup';

vi.mock('@/lib/AudioManager', () => ({
  audioManager: {
    play: vi.fn(),
  },
}));

function createMockLog(overrides?: Partial<MinuteEvent>[]): MinuteEvent[] {
  const base: MinuteEvent[] = [
    { minute: 1, text: 'Warrior A strikes Warrior B for 5 damage' },
    { minute: 2, text: 'Warrior B lands a devastating blow' },
    { minute: 3, text: 'Warrior A is slain' },
    { minute: 4, text: 'Warrior B executes a riposte' },
    { minute: 5, text: 'The crowd roars' },
  ];
  return overrides ? (overrides.map((o, i) => ({ ...base[i], ...o })) as MinuteEvent[]) : base;
}

describe('useBoutPlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(audioManager.play).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns correct initial state', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    expect(result.current.visibleCount).toBe(0);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.totalEvents).toBe(5);
    expect(result.current.speed).toBe(1);
  });

  it('togglePlay starts playback', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.togglePlay();
    });

    expect(result.current.isPlaying).toBe(true);
  });

  it('auto-advances after speedMs and plays correct SFX', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.togglePlay();
    });

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.visibleCount).toBe(1);
    expect(audioManager.play).toHaveBeenCalledWith('hit');

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.visibleCount).toBe(2);
    expect(audioManager.play).toHaveBeenCalledWith('crit');
  });

  it('advances at speed 2 (400ms)', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.setSpeed(2);
      result.current.togglePlay();
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.visibleCount).toBe(1);
  });

  it('advances at speed 3 (150ms)', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.setSpeed(3);
      result.current.togglePlay();
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.visibleCount).toBe(1);
  });

  it('pauses playback when togglePlay is called again', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.togglePlay();
    });

    act(() => {
      result.current.togglePlay();
    });

    expect(result.current.isPlaying).toBe(false);

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.visibleCount).toBe(0);
  });

  it('auto-stops when all events are revealed', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.togglePlay();
    });

    for (let i = 0; i < 5; i++) {
      act(() => {
        vi.advanceTimersByTime(800);
      });
    }

    expect(result.current.visibleCount).toBe(5);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.isPlaying).toBe(false);
  });

  it('restarts from beginning when togglePlay is called at completion', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.skipToEnd();
    });

    expect(result.current.isComplete).toBe(true);

    act(() => {
      result.current.togglePlay();
    });

    expect(result.current.visibleCount).toBe(0);
    expect(result.current.isPlaying).toBe(true);
  });

  it('advanceOne increments count and plays SFX without isPlaying', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.advanceOne();
    });

    expect(result.current.visibleCount).toBe(1);
    expect(audioManager.play).toHaveBeenCalledWith('hit');
  });

  it('skipToEnd reveals all events and stops playback', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.togglePlay();
    });

    act(() => {
      result.current.skipToEnd();
    });

    expect(result.current.visibleCount).toBe(5);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isComplete).toBe(true);
  });

  it('reset returns to initial state', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.setVisibleCount(3);
      result.current.setIsPlaying(true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.visibleCount).toBe(0);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isComplete).toBe(false);
  });

  it('does not play audio for status events', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.advanceOne();
    });
    act(() => {
      result.current.advanceOne();
    });
    act(() => {
      result.current.advanceOne();
    });
    act(() => {
      result.current.advanceOne();
    });

    vi.mocked(audioManager.play).mockClear();

    act(() => {
      result.current.advanceOne();
    });

    expect(result.current.visibleCount).toBe(5);
    expect(audioManager.play).not.toHaveBeenCalled();
  });

  it('plays death SFX for death events', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.advanceOne();
    });
    act(() => {
      result.current.advanceOne();
    });

    vi.mocked(audioManager.play).mockClear();

    act(() => {
      result.current.advanceOne();
    });

    expect(audioManager.play).toHaveBeenCalledWith('death');
  });

  it('plays clash SFX for riposte events', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.advanceOne();
    });
    act(() => {
      result.current.advanceOne();
    });
    act(() => {
      result.current.advanceOne();
    });

    vi.mocked(audioManager.play).mockClear();

    act(() => {
      result.current.advanceOne();
    });

    expect(audioManager.play).toHaveBeenCalledWith('clash');
  });

  it('handles empty log without error', () => {
    const { result } = renderHook(() => useBoutPlayback([]));

    expect(result.current.visibleCount).toBe(0);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.totalEvents).toBe(0);

    act(() => {
      result.current.togglePlay();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('does not advance beyond totalEvents', () => {
    const log = createMockLog();
    const { result } = renderHook(() => useBoutPlayback(log));

    act(() => {
      result.current.skipToEnd();
    });

    expect(result.current.visibleCount).toBe(5);

    act(() => {
      result.current.advanceOne();
    });

    expect(result.current.visibleCount).toBe(5);
  });

  it('clears timer on unmount', () => {
    const log = createMockLog();
    const { unmount } = renderHook(() => useBoutPlayback(log));

    // Unmounting should not throw; effect cleanup clears timerRef
    expect(() => unmount()).not.toThrow();
  });
});
