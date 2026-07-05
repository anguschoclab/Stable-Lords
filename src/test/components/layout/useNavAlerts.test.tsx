// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dumbbell } from 'lucide-react';
import type { TacticalAlert } from '@/hooks/useTacticalAlerts';

let mockStore: any = { week: 5, isTournamentWeek: false, bookmarks: [] };
let mockAlerts: TacticalAlert[] = [];
let mockPathname = '/world';

vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    useGameStore: vi.fn((selector?: any) => (selector ? selector(mockStore) : mockStore)),
  };
});

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}));

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: mockPathname }),
}));

vi.mock('@/hooks/useTacticalAlerts', () => ({
  useTacticalAlerts: vi.fn(() => mockAlerts),
}));

import { useNavAlerts } from '@/components/layout/navigationShared';
import { useTacticalAlerts } from '@/hooks/useTacticalAlerts';

function makeAlert(id: string, message: string): TacticalAlert {
  return {
    id,
    type: 'warning',
    icon: Dumbbell,
    message,
  };
}

describe('useNavAlerts', () => {
  beforeEach(() => {
    mockStore = { week: 5, isTournamentWeek: false, bookmarks: [] };
    mockAlerts = [];
    mockPathname = '/world';
    vi.mocked(useTacticalAlerts).mockImplementation(() => mockAlerts);
  });

  it('returns zero counts when no alerts, no tournament, no bookmarks', () => {
    const { result } = renderHook(() => useNavAlerts());
    expect(result.current.counts.stable).toBe(0);
    expect(result.current.counts.world).toBe(0);
    expect(result.current.counts.bookmarks).toBe(0);
  });

  it('returns counts.world = 1 when isTournamentWeek = true', () => {
    mockStore = { ...mockStore, isTournamentWeek: true };
    const { result } = renderHook(() => useNavAlerts());
    expect(result.current.counts.world).toBe(1);
  });

  it('returns counts.bookmarks = N matching bookmarkCount', () => {
    mockStore = { ...mockStore, bookmarks: Array(7) };
    const { result } = renderHook(() => useNavAlerts());
    expect(result.current.counts.bookmarks).toBe(7);
  });

  it('parses untrained count from unassigned-training alert message', () => {
    mockAlerts = [makeAlert('unassigned-training', '3 warriors need training assignment')];
    vi.mocked(useTacticalAlerts).mockImplementation(() => mockAlerts);
    const { result } = renderHook(() => useNavAlerts());
    expect(result.current.counts.stable).toBe(3);
  });

  it('parses pending offers count from pending-offers alert message', () => {
    mockAlerts = [makeAlert('pending-offers', '2 bout offers pending response')];
    vi.mocked(useTacticalAlerts).mockImplementation(() => mockAlerts);
    const { result } = renderHook(() => useNavAlerts());
    expect(result.current.counts.stable).toBe(2);
  });

  it('returns counts.stable = untrainedCount + pendingOffers when alerts exist (no trackWeek)', () => {
    mockAlerts = [
      makeAlert('unassigned-training', '3 warriors need training assignment'),
      makeAlert('pending-offers', '2 bout offers pending response'),
    ];
    vi.mocked(useTacticalAlerts).mockImplementation(() => mockAlerts);
    const { result } = renderHook(() => useNavAlerts());
    expect(result.current.counts.stable).toBe(5);
  });

  it('returns counts.stable = 0 when no training/offer alerts (no trackWeek)', () => {
    mockAlerts = [makeAlert('combat-ready', '5 warriors ready for combat')];
    vi.mocked(useTacticalAlerts).mockImplementation(() => mockAlerts);
    const { result } = renderHook(() => useNavAlerts());
    expect(result.current.counts.stable).toBe(0);
  });

  it('with trackWeek=true: shows stable alert when NOT on /stable section', () => {
    mockPathname = '/world';
    mockAlerts = [makeAlert('unassigned-training', '3 warriors need training assignment')];
    vi.mocked(useTacticalAlerts).mockImplementation(() => mockAlerts);
    const { result } = renderHook(() => useNavAlerts({ trackWeek: true }));
    expect(result.current.counts.stable).toBe(3);
  });

  it('with trackWeek=true: hides stable alert when ON /stable section', () => {
    mockPathname = '/stable';
    mockAlerts = [makeAlert('unassigned-training', '3 warriors need training assignment')];
    vi.mocked(useTacticalAlerts).mockImplementation(() => mockAlerts);
    const { result } = renderHook(() => useNavAlerts({ trackWeek: true }));
    expect(result.current.counts.stable).toBe(0);
  });

  it('with trackWeek=true: hides stable alert when week has not advanced past lastSeenWeek', () => {
    // On /stable, lastSeenWeek gets set to current week (5).
    // If we're still on week 5 and navigate away, week is not > lastSeenWeek, so no alert.
    mockStore = { ...mockStore, week: 5, bookmarks: [] };
    mockAlerts = [makeAlert('unassigned-training', '3 warriors need training assignment')];
    vi.mocked(useTacticalAlerts).mockImplementation(() => mockAlerts);
    // First render on /world (lastSeenStableWeek initializes to -1)
    mockPathname = '/world';
    const { result, rerender } = renderHook(() => useNavAlerts({ trackWeek: true }));
    // Navigate to /stable — useEffect sets lastSeenStableWeek to 5
    mockPathname = '/stable';
    rerender();
    // Navigate back to /world — week is still 5, not > lastSeenStableWeek (5)
    mockPathname = '/world';
    rerender();
    expect(result.current.counts.stable).toBe(0);
  });

  it('returns correct links object (stable→/stable, world→/world/tournaments, bookmarks→/bookmarks)', () => {
    const { result } = renderHook(() => useNavAlerts());
    expect(result.current.links.stable).toBe('/stable');
    expect(result.current.links.world).toBe('/world/tournaments');
    expect(result.current.links.bookmarks).toBe('/bookmarks');
  });

  it('handles malformed alert message (no number) — defaults to 0', () => {
    mockAlerts = [makeAlert('unassigned-training', 'warriors need training')];
    vi.mocked(useTacticalAlerts).mockImplementation(() => mockAlerts);
    const { result } = renderHook(() => useNavAlerts());
    expect(result.current.counts.stable).toBe(0);
  });
});
