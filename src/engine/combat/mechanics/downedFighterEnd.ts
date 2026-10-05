/**
 * Downed-fighter bout termination — the shared "someone can no longer
 * continue" end-of-exchange check.
 *
 * Weapon hits end bouts through their own kill-window/BOUT_END path; this
 * helper covers damage that bypasses that path — bleed ticks, arena hazards,
 * anything that subtracts hp outside the attack pipeline. It emits exactly
 * one BOUT_END, attributed to a `cause` ('BLEED', 'ARENA_HAZARD', …), and
 * never stacks a second end on an exchange that already decided the bout.
 *
 * Both fighters down = mutual incapacitation → 'Exhaustion' (the event
 * result downstream code maps to winner=null, i.e. a draw).
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '../resolution/types';

/**
 * Append a BOUT_END when at least one fighter is at ≤0 hp. No-op when both
 * fighters are standing or the bout already ended this exchange.
 */
export function emitDownedBoutEnd(
  fA: FighterState,
  fD: FighterState,
  events: CombatEvent[],
  cause: string
): void {
  if (fA.hp > 0 && fD.hp > 0) return;
  if (events.some((e) => e.type === 'BOUT_END')) return;
  if (fA.hp <= 0 && fD.hp <= 0) {
    events.push({ type: 'BOUT_END', actor: 'A', result: 'Exhaustion', metadata: { cause } });
  } else if (fA.hp <= 0) {
    events.push({ type: 'BOUT_END', actor: 'D', result: 'KO', metadata: { cause } });
  } else {
    events.push({ type: 'BOUT_END', actor: 'A', result: 'KO', metadata: { cause } });
  }
}
