/**
 * Canon in-bout endurance recovery (Arena 93): a fighter running a low
 * OE/AL beat catches their breath — endurance ticks back up instead of
 * only ever draining. RED until Phase-4 lands applyEnduranceRecovery.
 */
import { describe, it, expect } from 'vitest';
import { applyEnduranceRecovery, RECOVERY_ACTIVITY_CAP } from '@/engine/combat/resolution/exchangeHelpers/mechanics/enduranceRecovery';
import { makeFighterState } from '@/test/_fixtures/factories';

const gassed = () =>
  makeFighterState({ endurance: 5, maxEndurance: 40 });

describe('applyEnduranceRecovery', () => {
  it('a low-activity beat (OE+AL under cap) restores endurance', () => {
    const f = gassed();
    applyEnduranceRecovery(f, 1, 1);
    expect(f.endurance).toBeGreaterThan(5);
  });

  it('an aggressive beat (OE+AL over cap) restores nothing', () => {
    const f = gassed();
    applyEnduranceRecovery(f, 9, 9);
    expect(f.endurance).toBe(5);
  });

  it('recovery never exceeds max endurance', () => {
    const f = makeFighterState({ endurance: 39, maxEndurance: 40 });
    applyEnduranceRecovery(f, 0, 0);
    expect(f.endurance).toBe(40);
  });

  it('RECOVERY_ACTIVITY_CAP is exported and sane', () => {
    expect(RECOVERY_ACTIVITY_CAP).toBeGreaterThanOrEqual(2);
    expect(RECOVERY_ACTIVITY_CAP).toBeLessThanOrEqual(8);
  });
});
