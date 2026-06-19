/**
 * Hit Execution - Execute hit damage, momentum, and kill window logic
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '../../types';
import type { ResolutionContext } from '../../types';
import { resolveEffectiveTactics } from '../../tactics';
import { getOffensiveTacticMods } from '../../../mechanics/tacticResolution';
import { getStylePassive } from '@/engine/stylePassives';
import { getKillMechanic, Phase as StylePhase } from '@/engine/stylePassives';
import { getDynamicTraitMods } from '@/engine/traits';
import {
  computeHitDamage,
  rollHitLocation,
  applyProtectMod,
  applyArmorTypeMod,
  applyShieldZoneMod,
  calculateKillWindow,
  HIT_LOCATIONS,
} from '../../../mechanics/combatDamage';
import type { HitLocation } from '../../../mechanics/combatDamage';
import { FightingStyle } from '@/types/shared.types';
import { SHIELD_COVERAGE } from '@/data/equipment';
import { weaponDamageBonus } from '../../../mechanics/weaponStats';
import { CRIT_DAMAGE_MULT } from '@/constants/combat';
import { getStyleWeatherModifier } from '@/constants/arena';
import { accumulateGuardBreak } from '../../guardBreak';
import { getMomentumDamageBonus, getWsAttritionBonus } from '../../tempoMechanics';

/**
 * Execute hit.
 */
export function executeHit(
  events: CombatEvent[],
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  attTactics: ReturnType<typeof resolveEffectiveTactics>,
  attOffMods: ReturnType<typeof getOffensiveTacticMods>,
  attPassive: ReturnType<typeof getStylePassive>,
  attLabel: 'A' | 'D',
  defLabel: 'A' | 'D',
  stylePhase: StylePhase,
  phase: string,
  attKD: number,
  attOE: number,
  attAL: number,
  attMatchup: number,
  ctx?: ResolutionContext,
  defPassive?: ReturnType<typeof getStylePassive>
) {
  // ── Survival Strike: defender has earned a free counter — skip this attack ──
  if (defender.survivalStrike) {
    defender.survivalStrike = false;
    // Defender fires back as a free riposte — re-use executeRiposte logic inline
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
      // survival strike has no shield/protect mitigation, so raw = applied
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
    return;
  }

  // ── Commit mechanic: attacker at low HP with high kill desire commits ──
  const kdForCommit = attacker.activePlan.killDesire ?? attKD;
  const isAtLowHp = attacker.hp / attacker.maxHp < 0.35;
  if (!attacker.committed && isAtLowHp && kdForCommit >= 7) {
    attacker.committed = true;
    events.push({ type: 'STATE_CHANGE', actor: attLabel, result: 'COMMIT' });
  }

  let hitLoc = rollHitLocation(rng, attTactics.target, defender.activePlan.protect);

  // AB: precision targeting — shift one step toward higher-value locations (head side)
  if (attacker.style === FightingStyle.AimedBlow) {
    const locIdx = HIT_LOCATIONS.indexOf(hitLoc as HitLocation);
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

  // Tempo: LU momentum damage — negated when the defender is Wall of Steel (immovable)
  preArmor += getMomentumDamageBonus(attacker.style, attacker.momentum, defender.style);
  // WS: immovable — steady attrition floor so the brick still closes fights
  preArmor += getWsAttritionBonus(attacker.style);

  // BA: guard-break — each landed hit erodes the defender's guard for the rest of the fight
  if (attacker.style === FightingStyle.BashingAttack) {
    defender.parDegrade = accumulateGuardBreak(defender.parDegrade ?? 0);
  }

  const postArmor = applyArmorTypeMod(preArmor, attacker.weaponId, defender.armorId);

  // AB: armor bypass — ignore DF-scaled fraction of armor mitigation
  let rawDamage: number;
  if (attacker.style === FightingStyle.AimedBlow) {
    const bypass = Math.max(0, Math.min(0.4, attacker.attributes.DF / 50));
    rawDamage = Math.round(postArmor + bypass * (preArmor - postArmor));
  } else {
    rawDamage = postArmor;
  }

  // Apply weather damage multiplier
  const weatherDamageMult = ctx?.weatherEffect?.damageMult ?? 1.0;

  // Apply style-weather and arena-tag damage multipliers
  const styleWeatherMod = ctx?.arenaConfig
    ? getStyleWeatherModifier(attacker.style, ctx.weather, ctx.arenaConfig.tags)
    : { damageMult: 1.0 };

  const totalDamageMult = weatherDamageMult * styleWeatherMod.damageMult;
  rawDamage = Math.round(rawDamage * totalDamageMult);

  // Commit: +20% damage
  if (attacker.committed) {
    rawDamage = Math.round(rawDamage * 1.2);
  }

  // Apply specialty damage received reduction on the defender
  const defSpecDamageMult = ctx
    ? defender.label === 'A'
      ? (ctx.trainerModsA.damageReceivedMult ?? 1.0)
      : (ctx.trainerModsD.damageReceivedMult ?? 1.0)
    : 1.0;
  rawDamage = Math.round(rawDamage * defSpecDamageMult);

  const isCrit = attPassive.critChance > 0 && rng() < attPassive.critChance;
  if (isCrit) {
    rawDamage = Math.round(rawDamage * CRIT_DAMAGE_MULT);
  }

  // Shield-zone mitigation is applied AFTER the event is pushed so that
  // event.value always reflects the raw (pre-mitigation) hit — used for
  // visual severity. The post-mitigation figure is in metadata.appliedDamage.
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

  // ── Knockdown check: heavy hits can knock the defender down ──
  const hpRatioAfterHit = defender.hp / defender.maxHp;
  const damageRatio = damage / defender.maxHp;
  if (
    !defender.knockedDown &&
    defender.hp > 0 &&
    hpRatioAfterHit < 0.4 &&
    damageRatio >= 0.12 &&
    rng() < Math.min(0.35, damageRatio + defender.legHits * 0.05)
  ) {
    defender.knockedDown = true;
    events.push({ type: 'KNOCKDOWN', actor: defLabel });
  }

  // ── Momentum: hit shifts momentum toward attacker ──
  const prevAttMom = attacker.momentum;
  const prevDefMom = defender.momentum;
  attacker.momentum = Math.min(3, attacker.momentum + 1);
  defender.momentum = Math.max(-3, defender.momentum - 1);
  if (attacker.momentum !== prevAttMom || defender.momentum !== prevDefMom) {
    events.push({
      type: 'MOMENTUM_SHIFT',
      actor: attLabel,
      target: defLabel,
      value: attacker.momentum,
      metadata: { prev: prevAttMom, oppPrev: prevDefMom, oppNew: defender.momentum },
    });
  }

  // ── Survival Strike: committed attacker who doesn't kill enables defender counter ──
  if (attacker.committed && defender.hp > 0) {
    defender.survivalStrike = true;
    events.push({ type: 'STATE_CHANGE', actor: defLabel, result: 'SURVIVAL_STRIKE' });
  }

  if (damage > 0 && rng() < 0.2) {
    const attrs = ['ST', 'SP', 'DF', 'WL'];
    events.push({
      type: 'INSIGHT',
      actor: attLabel,
      metadata: { attribute: attrs[Math.floor(rng() * attrs.length)] },
    });
  }

  const killMech = getKillMechanic(attacker.style, {
    phase: stylePhase,
    hitsLanded: attacker.hitsLanded,
    consecutiveHits: attacker.consecutiveHits,
    targetedLocation: attTactics.target,
    hitLocation: hitLoc,
  });

  let didKill = false;
  let causeBucket: string = 'EXECUTION';

  if (defender.hp <= defender.maxHp * killMech.killWindowHpMult) {
    const killPos = phase === 'LATE' ? 2 : phase === 'MID' ? 1 : 0;
    const effectiveDec = attacker.skills.DEC + killMech.decBonus;
    const specKillBonus = ctx
      ? attacker.label === 'A'
        ? (ctx.trainerModsA.killWindowBonus ?? 0)
        : (ctx.trainerModsD.killWindowBonus ?? 0)
      : 0;
    const attackerTraitKill = attacker.traits
      ? getDynamicTraitMods(attacker, {
          phase: phase as 'OPENING' | 'MID' | 'LATE',
          hpRatio: attacker.hp / attacker.maxHp,
          endRatio: attacker.endurance / attacker.maxEndurance,
          consecutiveHits: attacker.consecutiveHits,
        }).killWindowBonus
      : 0;
    const crowdKillBonus = ctx?.crowdKillBonus ?? 0;
    const killThreshold = calculateKillWindow(
      defender.hp / defender.maxHp,
      defender.endurance / defender.maxEndurance,
      hitLoc,
      attKD + killMech.killBonus,
      killPos,
      attOE,
      attAL,
      attMatchup,
      effectiveDec,
      attacker.momentum,
      specKillBonus + attackerTraitKill,
      crowdKillBonus
    );
    if (rng() < killThreshold) {
      defender.hp = 0;
      didKill = true;
      if (attacker.consecutiveHits >= 3) {
        causeBucket = 'CRITICAL_CHAIN';
      } else {
        const wasCovered = !!defender.activePlan.protect && defender.activePlan.protect !== 'Any';
        if (wasCovered && rawDamage >= 20) causeBucket = 'ARMOR_FAILURE';
      }
    }
  }

  if (defender.hp <= 0) {
    if (didKill) {
      events.push({
        type: 'BOUT_END',
        actor: attLabel,
        result: 'Kill',
        metadata: { location: hitLoc, cause: causeBucket },
      });
    } else {
      events.push({
        type: 'BOUT_END',
        actor: attLabel,
        result: 'KO',
        metadata: { location: hitLoc, cause: 'FATAL_DAMAGE' },
      });
    }
  }
}
