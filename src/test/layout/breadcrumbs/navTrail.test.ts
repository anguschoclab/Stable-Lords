/**
 * navTrail — module-level visit ring buffer backing the breadcrumb's
 * referrer chip. Dedupes consecutive visits, caps history, and resolves
 * the last distinct page as the referrer.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordVisit,
  getReferrer,
  getNavTrailSnapshot,
  resetNavTrail,
  subscribeNavTrail,
} from '@/components/layout/breadcrumbs/navTrail';
import { vi } from 'vitest';

describe('navTrail', () => {
  beforeEach(() => resetNavTrail());

  it('records visits and dedupes consecutive identical paths', () => {
    recordVisit('/stable/roster', 'Roster');
    recordVisit('/stable/roster', 'Roster');
    recordVisit('/warrior/w-1', 'Alice');
    expect(getNavTrailSnapshot()).toHaveLength(2);
  });

  it('getReferrer returns the last visit distinct from the current path', () => {
    recordVisit('/bookmarks', 'Bookmarks');
    recordVisit('/warrior/w-1', 'Alice');
    expect(getReferrer(getNavTrailSnapshot(), '/warrior/w-1')?.pathname).toBe('/bookmarks');
  });

  it('getReferrer skips entries that equal the current path', () => {
    recordVisit('/warrior/w-1', 'Alice');
    recordVisit('/warrior/w-2', 'Bob');
    // referrer to w-2 is w-1, even though a stale w-2 record might exist
    recordVisit('/warrior/w-1', 'Alice');
    expect(getReferrer(getNavTrailSnapshot(), '/warrior/w-2')?.pathname).toBe('/warrior/w-1');
  });

  it('caps the trail at 10 entries', () => {
    for (let i = 0; i < 15; i++) recordVisit(`/page-${i}`, `Page ${i}`);
    expect(getNavTrailSnapshot().length).toBeLessThanOrEqual(10);
  });

  it('notifies subscribers on record', () => {
    const listener = vi.fn();
    const unsub = subscribeNavTrail(listener);
    recordVisit('/stable', 'Stable');
    expect(listener).toHaveBeenCalled();
    unsub();
  });

  it('returns undefined referrer when the trail is empty', () => {
    expect(getReferrer(getNavTrailSnapshot(), '/warrior/w-1')).toBeUndefined();
  });
});
