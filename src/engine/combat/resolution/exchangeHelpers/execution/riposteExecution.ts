/**
 * Riposte Execution - Execute riposte damage and momentum
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '../../types';
import { resolveEffectiveTactics } from '../../tactics';
import { getStylePassive } from '@/engine/stylePassives';
import {
  computeHitDamage,
  rollHitLocation,
  applyProtectMod,
  applyArmorTypeMod,
} from '../../../mechanics/combatDamage';
import { weaponDamageBonus } from '../../../mechanics/weaponStats';

/**
 * Execute riposte.
 */
export function executeRiposte(
  events: CombatEvent[],
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  defTactics: ReturnType<typeof resolveEffectiveTactics>,
  defPassive: ReturnType<typeof getStylePassive>,
  attLabel: 'A' | 'D',
  defLabel: 'A' | 'D',
  specialtyRiposteMult: number = 1.0,
  extraDmg: number = 0
) {
  const ripLoc = rollHitLocation(rng, defTactics.target, attacker.activePlan.protect);
  let ripDmgRaw = computeHitDamage(
    rng,
    defender.derived.damage +
      defPassive.dmgBonus +
      weaponDamageBonus(defender.weaponId, defender.style),
    ripLoc
  );
  ripDmgRaw = applyArmorTypeMod(ripDmgRaw, defender.weaponId, attacker.armorId);
  ripDmgRaw = Math.round(ripDmgRaw * specialtyRiposteMult);
  const ripDmg = applyProtectMod(ripDmgRaw, ripLoc, attacker.activePlan.protect) + Math.round(extraDmg);

  events.push({ type: 'DEFENSE', actor: defLabel, result: 'RIPOSTE' });
  events.push({ type: 'HIT', actor: defLabel, target: attLabel, location: ripLoc, value: ripDmg });

  attacker.hp -= ripDmg;
  attacker.hitsTaken++;
  defender.hitsLanded++;
  defender.ripostes++;
  defender.consecutiveHits++;
  attacker.consecutiveHits = 0;

  // Riposte swings momentum decisively
  const prevDefMom = defender.momentum;
  const prevAttMom = attacker.momentum;
  defender.momentum = Math.min(3, defender.momentum + 1);
  attacker.momentum = Math.max(-3, attacker.momentum - 1);
  if (defender.momentum !== prevDefMom || attacker.momentum !== prevAttMom) {
    events.push({
      type: 'MOMENTUM_SHIFT',
      actor: defLabel,
      target: attLabel,
      value: defender.momentum,
      metadata: { prev: prevDefMom, oppPrev: prevAttMom, oppNew: attacker.momentum },
    });
  }
}
