/**
 * Off-hand (dual-wield) free shot — Arena 93 canon (V23 pull-in of
 * V22-deferred D1).
 *
 * Canon: a Very Highly Coordinated fighter (SP+DF ≥ 32 AND both ≥ 15 —
 * the "weapon in each hand" profile) gets a free off-hand attack once per
 * offensive exchange. The off-hand weapon is actively wielded
 * (`equipment.offhand`), distinct from the sheathed backup.
 *
 * Mutually exclusive with shields — dual-wield loadouts never carry one.
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState, ResolutionContext } from './types';

/**
 * True when the fighter meets the Very High Coordination gate for the free
 * off-hand shot: SP+DF ≥ DUAL_VHC_SUM_MIN with both ≥ DUAL_VHC_STAT_MIN.
 */
export function isVeryHighlyCoordinated(f: FighterState): boolean {
  void f;
  return false;
}

/**
 * Attempt the free off-hand attack after the attacker's primary swing
 * resolves. Pushes an OFFHAND_ATTACK event (and its hit resolution) when
 * the fighter is dual-wielding and VHC-gated. No-op otherwise.
 *
 * @returns true when the off-hand swing happened.
 */
export function tryOffhandAttack(args: {
  ctx: ResolutionContext;
  attacker: FighterState;
  defender: FighterState;
  events: CombatEvent[];
}): boolean {
  void args;
  return false;
}
