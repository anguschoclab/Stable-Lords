import { describe, expect, it } from 'vitest';
import { resolveEventLogRouteState } from '@/components/layout/eventLogRoutePolicy';

describe('resolveEventLogRouteState', () => {
  it('opens the feed on high-context desktop routes without hijacking compact shells', () => {
    expect(resolveEventLogRouteState('/stable/arena', true, false)).toBe(false);
    expect(resolveEventLogRouteState('/stable/planner', false, false)).toBe(true);
  });

  it('closes the mobile sheet after navigating away from an auto-open route', () => {
    expect(resolveEventLogRouteState('/help', true, true)).toBe(false);
    expect(resolveEventLogRouteState('/world/chronicle', true, true)).toBe(false);
  });

  it('preserves the desktop rail on neutral routes and closes management routes', () => {
    expect(resolveEventLogRouteState('/help', false, true)).toBe(true);
    expect(resolveEventLogRouteState('/stable/roster', false, true)).toBe(false);
    expect(resolveEventLogRouteState('/world/history', false, true)).toBe(false);
  });
});
