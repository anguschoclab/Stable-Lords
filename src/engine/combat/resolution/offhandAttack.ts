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
import { contestCheck } from '../mechanics/combatMath';
import { getShieldModifiers } from '@/data/equipment';
import {
  DUAL_VHC_SUM_MIN,
  DUAL_VHC_STAT_MIN,
  DUAL_OFFHAND_DAMAGE_MULT,
  OFFHAND_AMBI_GATE,
} from '@/constants/combat';
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState, ResolutionContext } from './types';

/**
 * True when the fighter meets the Very High Coordination gate for the free
 * off-hand shot: SP+DF ≥ DUAL_VHC_SUM_MIN with both ≥ DUAL_VHC_STAT_MIN.
 */
export function isVeryHighlyCoordinated(f: FighterState): boolean {
  const { SP, DF } = f.attributes;
  return SP + DF >= DUAL_VHC_SUM_MIN && SP >= DUAL_VHC_STAT_MIN && DF >= DUAL_VHC_STAT_MIN;
}

/**
 * Attempt the free off-hand attack after the attacker's primary swing
 * resolves. Gates: off-hand weapon held, VHC profile, both fighters alive,
 * attacker not knocked down. On a won contest the off-hand weapon deals a
 * reduced-weight hit (DUAL_OFFHAND_DAMAGE_MULT) — no kill-window, a free
 * swing isn't a death intent.
 *
 * @returns true when the off-hand swing happened (hit OR miss — the swing itself).
 */
export function tryOffhandAttack(args: {
  ctx: ResolutionContext;
  attacker: FighterState;
  defender: FighterState;
  events: CombatEvent[];
}): boolean {
  const { ctx, attacker, defender, events } = args;
  const offId = attacker.offhandWeaponId;
  if (!offId) return false;
  // Smithy (V24 canon): the off-hand shot comes from the highly coordinated
  // OR the ambidextrous — handedness bypasses the VHC stat profile.
  const ambidextrous =
    OFFHAND_AMBI_GATE &&
    (attacker.handedness === 'ambidextrous' || attacker.handedness === 'ambi-reversed');
  if (!ambidextrous && !isVeryHighlyCoordinated(attacker)) return false;
  if (attacker.hp <= 0 || defender.hp <= 0 || attacker.knockedDown) return false;

  // The off-hand weapon's parry-side mods (usually {def:0,att:0} — a weapon
  // only contributes what its item data declares, no fabricated bonus).
  const offMods = getShieldModifiers(offId);

  // Light contest: attacker ATT + off-hand attMod vs defender DEF+PAR.
  const hit = contestCheck(
    ctx.rng,
    attacker.skills.ATT + offMods.att,
    defender.skills.DEF + defender.skills.PAR
  );
  const damage = hit
    ? Math.max(1, Math.round(attacker.derived.damage * DUAL_OFFHAND_DAMAGE_MULT))
    : 0;
  if (hit) defender.hp = Math.max(0, defender.hp - damage);

  events.push({
    type: 'OFFHAND_ATTACK',
    actor: attacker.label,
    metadata: { weaponId: offId, hit, damage },
  });
  return true;
}
