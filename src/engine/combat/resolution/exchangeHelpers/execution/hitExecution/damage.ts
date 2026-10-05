/**
 * Hit damage pipeline — pre-armor roll, armor/multiplier chain, and the
 * shield/protect landing-damage application with its event emit.
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '../../../types';
import type { ResolutionContext } from '../../../types';
import { resolveEffectiveTactics } from '../../../tactics';
import { getOffensiveTacticMods } from '../../../../mechanics/tacticResolution';
import { getStylePassive } from '@/engine/stylePassives';
import {
  computeHitDamage,
  rollHitLocation,
  applyProtectMod,
  applyArmorTypeMod,
  applyFlatMitigation,
  applyShieldZoneMod,
  HIT_LOCATIONS,
} from '../../../../mechanics/combatDamage';
import type { HitLocation } from '../../../../mechanics/combatDamage';
import { FightingStyle } from '@/types/shared.types';
import { SHIELD_COVERAGE } from '@/data/equipment';
import { weaponDamageBonus } from '../../../../mechanics/weaponStats';
import {
  CRIT_DAMAGE_MULT,
  AB_ARMOR_BYPASS_MAX,
  AB_ARMOR_BYPASS_DF_DIVISOR,
  COMMIT_DAMAGE_MULT,
} from '@/constants/combat';
import { getStyleWeatherModifier } from '@/constants/arena';
import { accumulateGuardBreak } from '../../../guardBreak';
import { accumulateBleed } from '../../../bleed';
import { getMomentumDamageBonus, getWsAttritionBonus } from '../../../tempoMechanics';
import {
  getFrontloadMult,
  getStCritChanceBonus,
  getStCritDamageBonus,
  getExecuteBonus,
} from '../../../strikingAttack';

/**
 *
 */
interface ComputePreArmorDamageArgs {
  rng: () => number;
  attacker: FighterState;
  defender: FighterState;
  attTactics: ReturnType<typeof resolveEffectiveTactics>;
  attOffMods: ReturnType<typeof getOffensiveTacticMods>;
  attPassive: ReturnType<typeof getStylePassive>;
}

/**
 *
 */
export function computePreArmorDamage(args: ComputePreArmorDamageArgs): { hitLoc: HitLocation; preArmor: number } {
  const { rng, attacker, defender, attTactics, attOffMods } = args;
  const { attPassive } = args;
  let hitLoc: HitLocation = rollHitLocation(rng, attTactics.target, defender.activePlan.protect);

  if (attacker.style === FightingStyle.AimedBlow) {
    const locIdx = HIT_LOCATIONS.indexOf(hitLoc);
    if (locIdx > 0) hitLoc = HIT_LOCATIONS[locIdx - 1] as HitLocation;
  }

  let preArmor = computeHitDamage(
    rng,
    attacker.derived.damage +
      attOffMods.dmgBonus +
      attPassive.dmgBonus +
      weaponDamageBonus(attacker.weaponId, attacker.style),
    hitLoc
  );

  preArmor += getMomentumDamageBonus(attacker.style, attacker.momentum, defender.style);
  preArmor += getWsAttritionBonus(attacker.style);

  if (attacker.style === FightingStyle.BashingAttack) {
    defender.parDegrade = accumulateGuardBreak(defender.parDegrade ?? 0);
  }

  if (attacker.style === FightingStyle.SlashingAttack) {
    defender.bleedStacks = accumulateBleed(defender.bleedStacks ?? 0);
  }

  return { hitLoc, preArmor };
}

/**
 *
 */
export function applyDamageMultipliers(
  preArmor: number,
  attacker: FighterState,
  defender: FighterState,
  ctx: ResolutionContext | undefined
): number {
  const postArmor = applyArmorTypeMod(preArmor, attacker.weaponId, defender.armorId);
  const postFlat = applyFlatMitigation(postArmor, defender.armorId, defender.helmId);

  let rawDamage: number;
  if (attacker.style === FightingStyle.AimedBlow) {
    const bypass = Math.max(
      0,
      Math.min(AB_ARMOR_BYPASS_MAX, attacker.attributes.DF / AB_ARMOR_BYPASS_DF_DIVISOR)
    );
    rawDamage = Math.round(postFlat + bypass * (preArmor - postFlat));
  } else {
    rawDamage = postFlat;
  }

  const weatherDamageMult = ctx?.weatherEffect?.damageMult ?? 1.0;
  const styleWeatherMod = ctx?.arenaConfig
    ? getStyleWeatherModifier(attacker.style, ctx.weather, ctx.arenaConfig.tags)
    : { damageMult: 1.0 };

  const totalDamageMult = weatherDamageMult * styleWeatherMod.damageMult;
  rawDamage = Math.round(rawDamage * totalDamageMult);

  if (attacker.committed) {
    rawDamage = Math.round(rawDamage * COMMIT_DAMAGE_MULT);
  }

  const defSpecDamageMult = ctx
    ? defender.label === 'A'
      ? (ctx.trainerModsA.damageReceivedMult ?? 1.0)
      : (ctx.trainerModsD.damageReceivedMult ?? 1.0)
    : 1.0;
  rawDamage = Math.round(rawDamage * defSpecDamageMult);

  rawDamage = Math.round(rawDamage * getFrontloadMult(attacker.style, ctx?.exchange ?? 0));
  rawDamage += getExecuteBonus(attacker.style, defender.hp, defender.maxHp);

  return rawDamage;
}

/**
 *
 */
interface ApplyHitAndCountersArgs {
  events: CombatEvent[];
  rng: () => number;
  rawDamage: number;
  hitLoc: HitLocation;
  attacker: FighterState;
  defender: FighterState;
  attPassive: ReturnType<typeof getStylePassive>;
  attLabel: 'A' | 'D';
  defLabel: 'A' | 'D';
}

/**
 *
 */
export function applyHitAndCounters(args: ApplyHitAndCountersArgs): { damage: number; isCrit: boolean; rawDamage: number } {
  const { events, rng, hitLoc, attacker } = args;
  let { rawDamage } = args;
  const { defender, attPassive, attLabel, defLabel } = args;
  const effectiveCritChance = attPassive.critChance + getStCritChanceBonus(attacker.style);
  const isCrit = effectiveCritChance > 0 && rng() < effectiveCritChance;
  if (isCrit) {
    rawDamage = Math.round(rawDamage * (CRIT_DAMAGE_MULT + getStCritDamageBonus(attacker.style)));
  }

  const defShieldCov =
    SHIELD_COVERAGE[defender.shieldId ?? ''] ?? SHIELD_COVERAGE[defender.weaponId ?? ''];
  const postShieldDamage = applyShieldZoneMod(rawDamage, hitLoc, defShieldCov);
  const damage = applyProtectMod(postShieldDamage, hitLoc, defender.activePlan.protect);

  if (isCrit) {
    events.push({
      type: 'HIT',
      actor: attLabel,
      target: defLabel,
      location: hitLoc,
      value: rawDamage,
      metadata: { crit: true, appliedDamage: damage },
    });
  } else {
    events.push({
      type: 'HIT',
      actor: attLabel,
      target: defLabel,
      location: hitLoc,
      value: rawDamage,
      metadata: { appliedDamage: damage },
    });
  }

  defender.hp -= damage;
  defender.hitsTaken++;
  attacker.hitsLanded++;
  attacker.consecutiveHits++;
  defender.consecutiveHits = 0;
  if (hitLoc.includes('arm')) defender.armHits++;
  if (hitLoc.includes('leg')) defender.legHits++;

  return { damage, isCrit, rawDamage };
}
