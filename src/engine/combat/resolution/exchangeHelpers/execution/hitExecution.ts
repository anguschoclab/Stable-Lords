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
  applyFlatMitigation,
  applyShieldZoneMod,
  calculateKillWindow,
  HIT_LOCATIONS,
} from '../../../mechanics/combatDamage';
import type { HitLocation } from '../../../mechanics/combatDamage';
import { FightingStyle } from '@/types/shared.types';
import { SHIELD_COVERAGE } from '@/data/equipment';
import { weaponDamageBonus } from '../../../mechanics/weaponStats';
import {
  CRIT_DAMAGE_MULT,
  AB_ARMOR_BYPASS_MAX,
  AB_ARMOR_BYPASS_DF_DIVISOR,
  COMMIT_HP_THRESHOLD,
  COMMIT_KILL_DESIRE,
  COMMIT_DAMAGE_MULT,
  KNOCKDOWN_HP_RATIO,
  KNOCKDOWN_DAMAGE_RATIO,
  KNOCKDOWN_CHANCE_CAP,
  KNOCKDOWN_LEG_BONUS,
  INSIGHT_CHANCE,
  CRITICAL_CHAIN_HITS,
  ARMOR_FAILURE_DMG_THRESHOLD,
  MOMENTUM_CAP,
  MOMENTUM_FLOOR,
} from '@/constants/combat';
import { getStyleWeatherModifier } from '@/constants/arena';
import { accumulateGuardBreak } from '../../guardBreak';
import { accumulateBleed } from '../../bleed';
import { getMomentumDamageBonus, getWsAttritionBonus } from '../../tempoMechanics';
import {
  getFrontloadMult,
  getStCritChanceBonus,
  getStCritDamageBonus,
  getExecuteBonus,
} from '../../strikingAttack';

function handleSurvivalStrike(
  events: CombatEvent[],
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  attTactics: ReturnType<typeof resolveEffectiveTactics>,
  defPassive: ReturnType<typeof getStylePassive> | undefined,
  attLabel: 'A' | 'D',
  defLabel: 'A' | 'D'
): boolean {
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

function computePreArmorDamage(
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  attTactics: ReturnType<typeof resolveEffectiveTactics>,
  attOffMods: ReturnType<typeof getOffensiveTacticMods>,
  attPassive: ReturnType<typeof getStylePassive>
): { hitLoc: HitLocation; preArmor: number } {
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

function applyDamageMultipliers(
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

function applyHitAndCounters(
  events: CombatEvent[],
  rng: () => number,
  rawDamage: number,
  hitLoc: HitLocation,
  attacker: FighterState,
  defender: FighterState,
  attPassive: ReturnType<typeof getStylePassive>,
  attLabel: 'A' | 'D',
  defLabel: 'A' | 'D'
): { damage: number; isCrit: boolean; rawDamage: number } {
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

function checkKnockdown(
  events: CombatEvent[],
  rng: () => number,
  defender: FighterState,
  damage: number,
  defLabel: 'A' | 'D'
): void {
  const hpRatioAfterHit = defender.hp / defender.maxHp;
  const damageRatio = damage / defender.maxHp;
  if (
    !defender.knockedDown &&
    defender.hp > 0 &&
    hpRatioAfterHit < KNOCKDOWN_HP_RATIO &&
    damageRatio >= KNOCKDOWN_DAMAGE_RATIO &&
    rng() < Math.min(KNOCKDOWN_CHANCE_CAP, damageRatio + defender.legHits * KNOCKDOWN_LEG_BONUS)
  ) {
    defender.knockedDown = true;
    events.push({ type: 'KNOCKDOWN', actor: defLabel });
  }
}

function applyMomentumShift(
  events: CombatEvent[],
  attacker: FighterState,
  defender: FighterState,
  attLabel: 'A' | 'D',
  defLabel: 'A' | 'D'
): void {
  const prevAttMom = attacker.momentum;
  const prevDefMom = defender.momentum;
  attacker.momentum = Math.min(MOMENTUM_CAP, attacker.momentum + 1);
  defender.momentum = Math.max(MOMENTUM_FLOOR, defender.momentum - 1);
  if (attacker.momentum !== prevAttMom || defender.momentum !== prevDefMom) {
    events.push({
      type: 'MOMENTUM_SHIFT',
      actor: attLabel,
      target: defLabel,
      value: attacker.momentum,
      metadata: { prev: prevAttMom, oppPrev: prevDefMom, oppNew: defender.momentum },
    });
  }
}

function checkKillWindow(
  events: CombatEvent[],
  rng: () => number,
  attacker: FighterState,
  defender: FighterState,
  ctx: ResolutionContext | undefined,
  hitLoc: HitLocation,
  rawDamage: number,
  attTactics: ReturnType<typeof resolveEffectiveTactics>,
  attLabel: 'A' | 'D',
  stylePhase: StylePhase,
  phase: string,
  attKD: number,
  attOE: number,
  attAL: number,
  attMatchup: number
): void {
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
      if (attacker.consecutiveHits >= CRITICAL_CHAIN_HITS) {
        causeBucket = 'CRITICAL_CHAIN';
      } else {
        const wasCovered = !!defender.activePlan.protect && defender.activePlan.protect !== 'Any';
        if (wasCovered && rawDamage >= ARMOR_FAILURE_DMG_THRESHOLD) causeBucket = 'ARMOR_FAILURE';
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
  if (
    handleSurvivalStrike(
      events,
      rng,
      attacker,
      defender,
      attTactics,
      defPassive,
      attLabel,
      defLabel
    )
  ) {
    return;
  }

  // ── Commit mechanic: attacker at low HP with high kill desire commits ──
  const kdForCommit = attacker.activePlan.killDesire ?? attKD;
  const isAtLowHp = attacker.hp / attacker.maxHp < COMMIT_HP_THRESHOLD;
  if (!attacker.committed && isAtLowHp && kdForCommit >= COMMIT_KILL_DESIRE) {
    attacker.committed = true;
    events.push({ type: 'STATE_CHANGE', actor: attLabel, result: 'COMMIT' });
  }

  const { hitLoc, preArmor } = computePreArmorDamage(
    rng,
    attacker,
    defender,
    attTactics,
    attOffMods,
    attPassive
  );
  const rawDamagePreCrit = applyDamageMultipliers(preArmor, attacker, defender, ctx);
  const { damage, rawDamage } = applyHitAndCounters(
    events,
    rng,
    rawDamagePreCrit,
    hitLoc,
    attacker,
    defender,
    attPassive,
    attLabel,
    defLabel
  );

  checkKnockdown(events, rng, defender, damage, defLabel);
  applyMomentumShift(events, attacker, defender, attLabel, defLabel);

  // ── Survival Strike: committed attacker who doesn't kill enables defender counter ──
  if (attacker.committed && defender.hp > 0) {
    defender.survivalStrike = true;
    events.push({ type: 'STATE_CHANGE', actor: defLabel, result: 'SURVIVAL_STRIKE' });
  }

  if (damage > 0 && rng() < INSIGHT_CHANCE) {
    const attrs = ['ST', 'SP', 'DF', 'WL'];
    events.push({
      type: 'INSIGHT',
      actor: attLabel,
      metadata: { attribute: attrs[Math.floor(rng() * attrs.length)] },
    });
  }

  checkKillWindow(
    events,
    rng,
    attacker,
    defender,
    ctx,
    hitLoc,
    rawDamage,
    attTactics,
    attLabel,
    stylePhase,
    phase,
    attKD,
    attOE,
    attAL,
    attMatchup
  );
}
