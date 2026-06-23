// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

interface MockMQL {
  matches: boolean;
  addEventListener: (event: string, cb: (e: { matches: boolean }) => void) => void;
  removeEventListener: (event: string, cb: (e: { matches: boolean }) => void) => void;
}

function createMockMQL(matches: boolean): MockMQL {
  const listeners: Record<string, Array<(e: { matches: boolean }) => void>> = {};
  return {
    matches,
    addEventListener: (event, cb) => {
      (listeners[event] ||= []).push(cb);
    },
    removeEventListener: (event, cb) => {
      listeners[event] = (listeners[event] || []).filter((l) => l !== cb);
    },
  };
}

describe('useColumns', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mdMQL: MockMQL;
  let lgMQL: MockMQL;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    } else {
      delete (window as any).matchMedia;
    }
    vi.restoreAllMocks();
  });

  it('returns 1 by default when matchMedia unavailable', async () => {
    delete (window as any).matchMedia;
    const { useColumns } = await import('@/hooks/useColumns');
    const { result } = renderHook(() => useColumns());
    expect(result.current).toBe(1);
  });

  it('returns 1 when viewport < 768px', async () => {
    mdMQL = createMockMQL(false);
    lgMQL = createMockMQL(false);
    window.matchMedia = vi.fn((query: string) => {
      if (query.includes('768')) return mdMQL;
      if (query.includes('1024')) return lgMQL;
      return createMockMQL(false);
    }) as any;
    const { useColumns } = await import('@/hooks/useColumns');
    const { result } = renderHook(() => useColumns());
    expect(result.current).toBe(1);
  });

  it('returns 2 when viewport >= 768px but < 1024px', async () => {
    mdMQL = createMockMQL(true);
    lgMQL = createMockMQL(false);
    window.matchMedia = vi.fn((query: string) => {
      if (query.includes('768')) return mdMQL;
      if (query.includes('1024')) return lgMQL;
      return createMockMQL(false);
    }) as any;
    const { useColumns } = await import('@/hooks/useColumns');
    const { result } = renderHook(() => useColumns());
    expect(result.current).toBe(2);
  });

  it('returns 3 when viewport >= 1024px', async () => {
    mdMQL = createMockMQL(true);
    lgMQL = createMockMQL(true);
    window.matchMedia = vi.fn((query: string) => {
      if (query.includes('768')) return mdMQL;
      if (query.includes('1024')) return lgMQL;
      return createMockMQL(true);
    }) as any;
    const { useColumns } = await import('@/hooks/useColumns');
    const { result } = renderHook(() => useColumns());
    expect(result.current).toBe(3);
  });

  it('re-renders on breakpoint change', async () => {
    const mqlStore: Record<string, MockMQL> = {};
    const listeners: Record<string, Array<(e: { matches: boolean }) => void>> = {};
    window.matchMedia = vi.fn((query: string) => {
      const key = query.includes('1024') ? 'lg' : 'md';
      if (!mqlStore[key]) {
        const mql = createMockMQL(false);
        const origAdd = mql.addEventListener;
        mql.addEventListener = (event, cb) => {
          (listeners[event] ||= []).push(cb);
          origAdd(event, cb);
        };
        mqlStore[key] = mql;
      }
      return mqlStore[key]!;
    }) as any;
    const { useColumns } = await import('@/hooks/useColumns');
    const { result } = renderHook(() => useColumns());
    expect(result.current).toBe(1);

    // Simulate crossing md breakpoint
    mqlStore['md']!.matches = true;
    const changeListeners = listeners['change'] || [];
    act(() => {
      changeListeners.forEach((cb) => cb({ matches: true }));
    });

    expect(result.current).toBe(2);
  });

  it('cleans up listeners on unmount', async () => {
    const removeSpy = vi.fn();
    mdMQL = createMockMQL(false);
    lgMQL = createMockMQL(false);
    const origRemoveMd = mdMQL.removeEventListener;
    mdMQL.removeEventListener = (event, cb) => {
      removeSpy();
      origRemoveMd(event, cb);
    };
    window.matchMedia = vi.fn((query: string) => {
      if (query.includes('768')) return mdMQL;
      if (query.includes('1024')) return lgMQL;
      return createMockMQL(false);
    }) as any;
    const { useColumns } = await import('@/hooks/useColumns');
    const { unmount } = renderHook(() => useColumns());
    unmount();
    expect(removeSpy).toHaveBeenCalled();
  });
});
