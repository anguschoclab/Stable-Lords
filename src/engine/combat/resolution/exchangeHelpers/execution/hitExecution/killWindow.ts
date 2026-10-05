/**
 * Post-hit event chain — knockdown, momentum, survival-strike arm, insight
 * roll, and the kill-window check, in that exact RNG order.
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '../../../types';
import type { ResolutionContext } from '../../../types';
import { resolveEffectiveTactics } from '../../../tactics';
import { getKillMechanic, Phase as StylePhase } from '@/engine/stylePassives';
import { getDynamicTraitMods } from '@/engine/traits';
import { calculateKillWindow } from '../../../../mechanics/combatDamage';
import type { HitLocation } from '../../../../mechanics/combatDamage';
import {
  KILL_WINDOW,
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
import { addCapped } from '@/utils/math';

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
  attacker.momentum = addCapped(attacker.momentum, 1, MOMENTUM_CAP);
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

interface CheckKillWindowArgs {
  events: CombatEvent[];
  rng: () => number;
  attacker: FighterState;
  defender: FighterState;
  ctx: ResolutionContext | undefined;
  hitLoc: HitLocation;
  rawDamage: number;
  attTactics: ReturnType<typeof resolveEffectiveTactics>;
  attLabel: 'A' | 'D';
  stylePhase: StylePhase;
  phase: string;
  attKD: number;
  attOE: number;
  attAL: number;
  attMatchup: number;
}

function checkKillWindow(args: CheckKillWindowArgs): void {
  const { events, rng, attacker, defender, ctx } = args;
  const { hitLoc, rawDamage, attTactics, attLabel, stylePhase } = args;
  const { phase, attKD, attOE, attAL, attMatchup } = args;
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
    const killThreshold = gatherKillThreshold(
      { attacker: attacker, defender: defender, ctx: ctx, hitLoc: hitLoc, killMech: killMech, phase: phase, attKD: attKD, attOE: attOE, attAL: attAL, attMatchup: attMatchup }
    );
    if (rng() < killThreshold * KILL_WINDOW.SCALE * (ctx?.deathRateMult ?? 1)) {
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

interface GatherKillThresholdArgs {
  attacker: FighterState;
  defender: FighterState;
  ctx: ResolutionContext | undefined;
  hitLoc: HitLocation;
  killMech: ReturnType<typeof getKillMechanic>;
  phase: string;
  attKD: number;
  attOE: number;
  attAL: number;
  attMatchup: number;
}

/** Gather all modifiers feeding `calculateKillWindow` — pure math, no RNG. */
function gatherKillThreshold(args: GatherKillThresholdArgs): number {
  const { attacker, defender, ctx, hitLoc, killMech } = args;
  const { phase, attKD, attOE, attAL, attMatchup } = args;
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
  return calculateKillWindow(
    { hpRatio: defender.hp / defender.maxHp, enduranceRatio: defender.endurance / defender.maxEndurance, location: hitLoc, killDesire: attKD + killMech.killBonus, phaseLevel: killPos, attOE: attOE, attAL: attAL, matchupBonus: attMatchup, decSkill: effectiveDec, momentum: attacker.momentum, specialtyBonus: specKillBonus + attackerTraitKill, crowdKillBonus: crowdKillBonus }
  );
}

/**
 *
 */
interface AfterHitEventsArgs {
  events: CombatEvent[];
  rng: () => number;
  attacker: FighterState;
  defender: FighterState;
  hitLoc: HitLocation;
  damage: number;
  rawDamage: number;
  attTactics: ReturnType<typeof resolveEffectiveTactics>;
  attLabel: 'A' | 'D';
  defLabel: 'A' | 'D';
  stylePhase: StylePhase;
  phase: string;
  attKD: number;
  attOE: number;
  attAL: number;
  attMatchup: number;
  ctx?: ResolutionContext;
}

/**
 * Post-damage event chain: knockdown, momentum, survival-strike counter arm,
 * insight roll, and kill-window check — in that exact RNG order.
 */
export function afterHitEvents(args: AfterHitEventsArgs) {
  const { events, rng, attacker, defender, hitLoc } = args;
  const { damage, rawDamage, attTactics, attLabel, defLabel } = args;
  const { stylePhase, phase, attKD, attOE, attAL } = args;
  const { attMatchup, ctx } = args;
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
    { events: events, rng: rng, attacker: attacker, defender: defender, ctx: ctx, hitLoc: hitLoc, rawDamage: rawDamage, attTactics: attTactics, attLabel: attLabel, stylePhase: stylePhase, phase: phase, attKD: attKD, attOE: attOE, attAL: attAL, attMatchup: attMatchup }
  );
}
