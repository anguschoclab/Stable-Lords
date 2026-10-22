import { describe, it, expect } from 'vitest';
import { getInjuryBadge } from '@/pages/BookingOffice/hooks/useOfferActions';
import type { InjuryData } from '@/types/warrior.types';

/** Pins severity ranking — the `order.indexOf` scan → rank-map refactor. */
describe('getInjuryBadge', () => {
  const inj = (severity: string) => ({ severity }) as InjuryData;

  it('returns null for no injuries or non-blocking severities', () => {
    expect(getInjuryBadge([])).toBeNull();
    expect(getInjuryBadge([inj('Minor'), inj('Bruise')])).toBeNull();
  });

  it('reports the severest blocking injury, not the first', () => {
    const badge = getInjuryBadge([inj('Moderate'), inj('Permanent'), inj('Severe')])!;
    expect(badge.label).toBe('Permanent');
    expect(badge.count).toBe(3);
  });

  it('ranks Critical above Severe above Moderate', () => {
    expect(getInjuryBadge([inj('Moderate'), inj('Severe')])!.label).toBe('Severe');
    expect(getInjuryBadge([inj('Severe'), inj('Critical')])!.label).toBe('Critical');
  });
});
