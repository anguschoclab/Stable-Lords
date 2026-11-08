/**
 * In-bout endurance recovery (canon — Arena 93): a fighter who runs a quiet
 * beat catches their breath. Low combined offensive/activity effort restores
 * a trickle of endurance instead of the meter only ever draining.
 */
import type { FighterState } from '../../types';

/** OE+AL at or below this counts as a rest beat. */
export const RECOVERY_ACTIVITY_CAP = 4;

/** Endurance restored on a rest beat. */
export const RECOVERY_PER_BEAT = 1;

/**
 * Apply one recovery tick — restores endurance when the fighter's own
 * activity for the beat is low. Never exceeds maxEndurance.
 * @param f - Fighter to recover.
 * @param oe - Fighter's effective offensive effort this exchange.
 * @param al - Fighter's effective activity level this exchange.
 */
export function applyEnduranceRecovery(f: FighterState, oe: number, al: number): void {
  if (oe + al > RECOVERY_ACTIVITY_CAP) return;
  f.endurance = Math.min(f.maxEndurance, f.endurance + RECOVERY_PER_BEAT);
}
