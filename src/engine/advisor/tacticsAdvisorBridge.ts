/**
 * Tactics & Loadout Advisor Bridge
 * Recommends optimal offensive and defensive tactics, fatigue-adjusted pacing (OE/AL),
 * life-preserving surrender thresholds (YIELD), and equipment encumbrance audits.
 */
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import type { CampaignFocus, WarriorTacticsAdvice } from './types';
import type { PlanCondition } from '@/types/shared.types';
import type { FightPlan } from '@/types/combat.types';
import { getBestOffensiveTactic, getBestDefensiveTactic } from '@/engine/ai/plan/tacticAdvisor';
import { defaultStylePreset } from '@/engine/bout/stylePresets';
import { deriveHeadToHead, getOpponentIntel } from './intelAdvisor';
import { clamp } from '@/utils/math';
import { warriorDisplayName } from '@/utils/warriorDisplay';

const AGILE_STYLES = new Set([
  FightingStyle.SlashingAttack,
  FightingStyle.LungingAttack,
  FightingStyle.AimedBlow,
]);

const bounded = (v: number, delta: number) => clamp(v + delta, 1, 10);

/** Working plan accumulators mutated by the opponent-intel pass. */
interface MutableTacticsPlan {
  suggestedOE: number;
  suggestedAL: number;
  gearNotes: string[];
  suggestedConditions: PlanCondition[];
}

/**
 * Opponent-specific adaptation: a losing record vs this specific opponent
 * shifts the plan patient — mirrors the G11 deltas applied to NPC stables
 * (lower OE, higher AL, scaled by how lopsided the record is, capped at ±2).
 */
function applyOpponentIntel(
  plan: MutableTacticsPlan,
  warrior: Warrior,
  opponent: Warrior,
  state: GameState,
  preservational: boolean
): void {
  const h2h = deriveHeadToHead(state, warrior.id, opponent.id);
  const losingRematch = h2h.meetings >= 2 && h2h.losses > h2h.wins;
  if (losingRematch) {
    const delta = Math.min(2, h2h.losses - h2h.wins);
    plan.suggestedOE = clamp(plan.suggestedOE - delta, 1, 10);
    plan.suggestedAL = clamp(plan.suggestedAL + delta, 1, 10);
    plan.gearNotes.push(
      `Rematch adjustment: ${h2h.wins}-${h2h.losses} recent record vs ${warriorDisplayName(opponent)} — fight more patiently.`
    );
  }

  // Tempo shield — mirrors the dossier counter-condition rival AI pushes
  // when the opponent has killed or beaten them before: shell up the moment
  // the opponent seizes tempo.
  if ((opponent.career?.kills ?? 0) > 0 || losingRematch) {
    plan.suggestedConditions.push({
      trigger: { type: 'OPPONENT_MOMENTUM_LEAD', value: 2 },
      override: { AL: bounded(plan.suggestedAL, +2), OE: bounded(plan.suggestedOE, -1) },
      label: `Shell up when ${warriorDisplayName(opponent)} seizes tempo`,
    });
  }

  // Kill-window press — unless the council is preserving this fighter.
  if (!preservational) {
    plan.suggestedConditions.push({
      trigger: { type: 'OPPONENT_HP_BELOW', value: 30 },
      override: {
        killDesire: clamp((warrior.plan?.killDesire ?? 5) + 2, 1, 10),
        OE: bounded(plan.suggestedOE, +1),
      },
      label: 'Press the kill window when they are hurt',
    });
  }

  // Counter-tempo: a 'Tactic' dossier token (Expert scouting) reads the
  // opponent's suspected plan. Meet a high-OE aggressor with patience;
  // press a passive opponent before they can settle in.
  const tacticIntel = getOpponentIntel(state, opponent.id).find((t) => t.type === 'Tactic');
  const suspected = tacticIntel?.detail.match(/Suspected OE: (\w+), AL: (\w+)/);
  if (suspected?.[1] === 'High') {
    plan.suggestedOE = clamp(plan.suggestedOE - 1, 1, 10);
    plan.suggestedAL = clamp(plan.suggestedAL + 1, 1, 10);
    plan.gearNotes.push(
      `Counter-tempo: scouts report ${warriorDisplayName(opponent)} fights at high offensive eagerness — absorb and counter.`
    );
  } else if (suspected?.[1] === 'Low') {
    plan.suggestedOE = clamp(plan.suggestedOE + 1, 1, 10);
    plan.suggestedAL = clamp(plan.suggestedAL - 1, 1, 10);
    plan.gearNotes.push(
      `Scouts report ${warriorDisplayName(opponent)} fights passively — press the tempo.`
    );
    plan.suggestedConditions.push({
      trigger: { type: 'OPPONENT_ENDURANCE_BELOW', value: 40 },
      override: { OE: bounded(plan.suggestedOE, +2) },
      label: 'Swarm when they gas out',
    });
  }
}

/**
 * Fallback threshold plus labelled conditional plan recommendations — the
 * same opponent-state triggers the rival AI emits for its own fighters.
 */
function fallbackAndSurvivalPlan(
  defaultPlan: FightPlan,
  preservational: boolean,
  fatigue: number,
  suggestedOE: number,
  suggestedAL: number
): {
  fallbackCondition: 'FLEE' | 'TURTLE' | 'BERZERK' | 'YIELD' | 'None';
  suggestedConditions: PlanCondition[];
} {
  // Surrender / Fallback Threshold: Cautious preservation for wounded or aging veterans
  const fallbackCondition: 'FLEE' | 'TURTLE' | 'BERZERK' | 'YIELD' | 'None' = preservational
    ? 'YIELD'
    : (defaultPlan.fallbackCondition ?? 'TURTLE');

  const suggestedConditions: PlanCondition[] = [];
  // Survival ramp — mirrors the universal AI safety condition.
  if (preservational || fatigue >= 30) {
    suggestedConditions.push({
      trigger: { type: 'ENDURANCE_BELOW', value: 30 },
      override: { OE: bounded(suggestedOE, -2), AL: bounded(suggestedAL, +2) },
      label: 'Conserve energy when gassed',
    });
  }
  return { fallbackCondition, suggestedConditions };
}

/**
 * Evaluate and recommend optimal battle plan tactics and loadout audit for a warrior.
 */
export function evaluateTacticsAdvice(
  warrior: Warrior,
  campaignFocus: CampaignFocus,
  ctx?: { opponent?: Warrior; state?: GameState }
): WarriorTacticsAdvice {
  const bestOffensiveTactic = getBestOffensiveTactic(warrior.style);
  const bestDefensiveTactic = getBestDefensiveTactic(warrior.style);

  const defaultPlan = defaultStylePreset(warrior.style).plan;
  let suggestedOE = defaultPlan.OE;
  let suggestedAL = defaultPlan.AL;

  // 1. Fatigue Moderation: Exhausted fighters must lower tempo to prevent stamina collapse
  const fatigue = warrior.fatigue ?? 0;
  if (fatigue >= 30) {
    suggestedOE = Math.min(suggestedOE, 5);
    suggestedAL = Math.min(suggestedAL, 5);
  }

  const preservational = campaignFocus === 'REHABILITATION' || campaignFocus === 'VETERAN_TWILIGHT';
  const { fallbackCondition, suggestedConditions } = fallbackAndSurvivalPlan(
    defaultPlan,
    preservational,
    fatigue,
    suggestedOE,
    suggestedAL
  );

  // 3. Equipment & Loadout Audit
  const gearNotes: string[] = [
    `Optimal synergy: ${bestOffensiveTactic} offense paired with ${bestDefensiveTactic} defense.`,
  ];

  const eq = warrior.equipment;
  if (eq) {
    const armorId = (eq.armor as unknown as string) || '';
    const helmId = (eq.helm as unknown as string) || '';

    if (AGILE_STYLES.has(warrior.style)) {
      const isHeavyPlate =
        armorId.toLowerCase().includes('plate') || helmId.toLowerCase().includes('full_helm');
      if (isHeavyPlate) {
        gearNotes.push(
          'Encumbrance warning: Heavy plate armor imposes severe mobility and defense penalties on agile styles. Consider chainmail or leather.'
        );
      }
    }
  }

  // 4. Opponent-specific adaptation (rematch record, tempo shield, kill
  // window, counter-tempo intel) — mutates the working plan.
  const plan: MutableTacticsPlan = { suggestedOE, suggestedAL, gearNotes, suggestedConditions };
  if (ctx?.opponent && ctx.state) {
    applyOpponentIntel(plan, warrior, ctx.opponent, ctx.state, preservational);
  }
  suggestedOE = plan.suggestedOE;
  suggestedAL = plan.suggestedAL;

  return {
    bestOffensiveTactic,
    bestDefensiveTactic,
    suggestedOE,
    suggestedAL,
    fallbackCondition,
    suggestedConditions: suggestedConditions.length ? suggestedConditions : undefined,
    gearNotes,
  };
}
