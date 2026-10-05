/**
 * Hit Execution - Execute hit damage, momentum, and kill window logic
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '../../../types';
import type { ResolutionContext } from '../../../types';
import { resolveEffectiveTactics } from '../../../tactics';
import { getOffensiveTacticMods } from '../../../../mechanics/tacticResolution';
import { getStylePassive } from '@/engine/stylePassives';
import { Phase as StylePhase } from '@/engine/stylePassives';
import {
  computeHitDamage,
  rollHitLocation,
  applyProtectMod,
  applyArmorTypeMod,
} from '../../../../mechanics/combatDamage';
import { COMMIT_HP_THRESHOLD, COMMIT_KILL_DESIRE } from '@/constants/combat';
import { weaponDamageBonus } from '../../../../mechanics/weaponStats';
import { afterHitEvents } from './killWindow';
import { applyDamageMultipliers, applyHitAndCounters, computePreArmorDamage } from './damage';

interface HandleSurvivalStrikeArgs {
  events: CombatEvent[];
  rng: () => number;
  attacker: FighterState;
  defender: FighterState;
  attTactics: ReturnType<typeof resolveEffectiveTactics>;
  defPassive: ReturnType<typeof getStylePassive> | undefined;
  attLabel: 'A' | 'D';
  defLabel: 'A' | 'D';
}

function handleSurvivalStrike(args: HandleSurvivalStrikeArgs): boolean {
  const { events, rng, attacker, defender, attTactics } = args;
  const { defPassive, attLabel, defLabel } = args;
  if (!defender.survivalStrike) return false;
  defender.survivalStrike = false;
  const freeRipLoc = rollHitLocation(rng, attTactics.target, attacker.activePlan.protect);
  let freeRipDmg = computeHitDamage(
    rng,
    defender.derived.damage +
      (defPassive?.dmgBonus ?? 0) +
      weaponDamageBonus(defender.weaponId, defender.style),
    freeRipLoc
  );
  freeRipDmg = applyArmorTypeMod(freeRipDmg, defender.weaponId, attacker.armorId);
  freeRipDmg = applyProtectMod(freeRipDmg, freeRipLoc, attacker.activePlan.protect);
  events.push({ type: 'DEFENSE', actor: defLabel, result: 'RIPOSTE' });
  events.push({
    type: 'HIT',
    actor: defLabel,
    target: attLabel,
    location: freeRipLoc,
    value: freeRipDmg,
    metadata: { appliedDamage: freeRipDmg },
  });
  attacker.hp -= freeRipDmg;
  attacker.hitsTaken++;
  defender.hitsLanded++;
  if (attacker.hp <= 0) {
    events.push({
      type: 'BOUT_END',
      actor: defLabel,
      result: 'KO',
      metadata: { location: freeRipLoc, cause: 'SURVIVAL_STRIKE' },
    });
  }
  return true;
}

interface PreHitResolvedArgs {
  events: CombatEvent[];
  rng: () => number;
  attacker: FighterState;
  defender: FighterState;
  attTactics: ReturnType<typeof resolveEffectiveTactics>;
  defPassive: ReturnType<typeof getStylePassive> | undefined;
  attLabel: 'A' | 'D';
  defLabel: 'A' | 'D';
  attKD: number;
}

/**
 * Pre-damage pass: survival strike short-circuits the hit; otherwise the
 * commit mechanic fires (attacker at low HP with high kill desire commits).
 * Returns true when the exchange is fully resolved and the caller must return.
 */
function preHitResolved(args: PreHitResolvedArgs): boolean {
  const { events, rng, attacker, defender, attTactics } = args;
  const { defPassive, attLabel, defLabel, attKD } = args;
  if (
    handleSurvivalStrike(
      { events: events, rng: rng, attacker: attacker, defender: defender, attTactics: attTactics, defPassive: defPassive, attLabel: attLabel, defLabel: defLabel }
    )
  ) {
    return true;
  }

  const kdForCommit = attacker.activePlan.killDesire ?? attKD;
  const isAtLowHp = attacker.hp / attacker.maxHp < COMMIT_HP_THRESHOLD;
  if (!attacker.committed && isAtLowHp && kdForCommit >= COMMIT_KILL_DESIRE) {
    attacker.committed = true;
    events.push({ type: 'STATE_CHANGE', actor: attLabel, result: 'COMMIT' });
  }
  return false;
}

/**
 *
 */
interface ExecuteHitArgs {
  events: CombatEvent[];
  rng: () => number;
  attacker: FighterState;
  defender: FighterState;
  attTactics: ReturnType<typeof resolveEffectiveTactics>;
  attOffMods: ReturnType<typeof getOffensiveTacticMods>;
  attPassive: ReturnType<typeof getStylePassive>;
  attLabel: 'A' | 'D';
  defLabel: 'A' | 'D';
  stylePhase: StylePhase;
  phase: string;
  attKD: number;
  attOE: number;
  attAL: number;
  attMatchup: number;
  ctx?: ResolutionContext;
  defPassive?: ReturnType<typeof getStylePassive>;
}

/**
 * Execute hit.
 */
export function executeHit(args: ExecuteHitArgs) {
  const { events, rng, attacker, defender, attTactics } = args;
  const { attOffMods, attPassive, attLabel, defLabel, stylePhase } = args;
  const { phase, attKD, attOE, attAL, attMatchup } = args;
  const { ctx, defPassive } = args;
  if (
    preHitResolved(
      { events: events, rng: rng, attacker: attacker, defender: defender, attTactics: attTactics, defPassive: defPassive, attLabel: attLabel, defLabel: defLabel, attKD: attKD }
    )
  ) {
    return;
  }

  const { hitLoc, preArmor } = computePreArmorDamage(
    { rng: rng, attacker: attacker, defender: defender, attTactics: attTactics, attOffMods: attOffMods, attPassive: attPassive }
  );
  const rawDamagePreCrit = applyDamageMultipliers(preArmor, attacker, defender, ctx);
  const { damage, rawDamage } = applyHitAndCounters(
    { events: events, rng: rng, rawDamage: rawDamagePreCrit, hitLoc: hitLoc, attacker: attacker, defender: defender, attPassive: attPassive, attLabel: attLabel, defLabel: defLabel }
  );

  afterHitEvents(
    { events: events, rng: rng, attacker: attacker, defender: defender, hitLoc: hitLoc, damage: damage, rawDamage: rawDamage, attTactics: attTactics, attLabel: attLabel, defLabel: defLabel, stylePhase: stylePhase, phase: phase, attKD: attKD, attOE: attOE, attAL: attAL, attMatchup: attMatchup, ctx: ctx }
  );
}
