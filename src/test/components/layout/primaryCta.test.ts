import { describe, expect, it, vi } from 'vitest';
import {
  PRIMARY_CTA_BY_ROUTE,
  resolvePrimaryCta,
  resolvePrimaryCtaKey,
  useCtaRegistry,
} from '@/components/layout/primaryCta';

describe('primary CTA registry and route resolution', () => {
  it('resolves the longest registered route prefix', () => {
    expect(resolvePrimaryCtaKey('/stable/training/week-3')).toBe('/stable/training');
    expect(resolvePrimaryCta('/stable/training/week-3')).toEqual(
      PRIMARY_CTA_BY_ROUTE['/stable/training']
    );
  });

  it('suppresses CTAs on detail routes with two trailing segments', () => {
    expect(resolvePrimaryCta('/stable/promoter/promoter-1')).toBeNull();
    expect(resolvePrimaryCta('/world/stable/stable-1')).toBeNull();
  });

  it('keeps navigation CTAs honest by carrying their destination', () => {
    expect(resolvePrimaryCta('/world/scouting')).toEqual({
      label: 'SIGN CONTRACT',
      intent: 'navigate',
      to: '/stable/recruit',
    });
  });

  it('registers and unregisters one page action per route key', () => {
    const first = vi.fn();
    const replacement = vi.fn();
    const route = '/stable/arena';

    useCtaRegistry.getState().register(route, { enabled: true, run: first });
    useCtaRegistry.getState().register(route, { enabled: true, run: replacement });
    void useCtaRegistry.getState().actions[route]?.run();
    expect(first).not.toHaveBeenCalled();
    expect(replacement).toHaveBeenCalledOnce();

    useCtaRegistry.getState().unregister(route);
    expect(useCtaRegistry.getState().actions[route]).toBeUndefined();
  });
});
