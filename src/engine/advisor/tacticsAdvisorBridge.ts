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
import { getBestOffensiveTactic, getBestDefensiveTactic } from '@/engine/ai/plan/tacticAdvisor';
import { defaultStylePreset } from '@/engine/bout/stylePresets';
import { deriveHeadToHead, getOpponentIntel } from './intelAdvisor';
import { clamp } from '@/utils/math';

const AGILE_STYLES = new Set([
  FightingStyle.SlashingAttack,
  FightingStyle.LungingAttack,
  FightingStyle.AimedBlow,
]);

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

  // 2. Surrender / Fallback Threshold: Cautious preservation for wounded or aging veterans
  let fallbackCondition: 'FLEE' | 'TURTLE' | 'BERZERK' | 'YIELD' | 'None' =
    defaultPlan.fallbackCondition ?? 'TURTLE';

  const preservational =
    campaignFocus === 'REHABILITATION' || campaignFocus === 'VETERAN_TWILIGHT';
  if (preservational) {
    fallbackCondition = 'YIELD';
  }

  // Conditional plan recommendations — the same opponent-state triggers the
  // rival AI emits for its own fighters, offered to the player. Each is
  // labelled so the editor/debug surfaces show it as council advice.
  const bounded = (v: number, delta: number) => clamp(v + delta, 1, 10);
  const suggestedConditions: PlanCondition[] = [];

  // Survival ramp — mirrors the universal AI safety condition.
  if (preservational || fatigue >= 30) {
    suggestedConditions.push({
      trigger: { type: 'ENDURANCE_BELOW', value: 30 },
      override: { OE: bounded(suggestedOE, -2), AL: bounded(suggestedAL, +2) },
      label: 'Conserve energy when gassed',
    });
  }

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

  // 4. Rematch adaptation: a losing record vs this specific opponent shifts the
  // plan patient — mirrors the G11 deltas applied to NPC stables (lower OE,
  // higher AL, scaled by how lopsided the record is, capped at ±2).
  if (ctx?.opponent && ctx.state) {
    const h2h = deriveHeadToHead(ctx.state, warrior.id, ctx.opponent.id);
    const losingRematch = h2h.meetings >= 2 && h2h.losses > h2h.wins;
    if (losingRematch) {
      const delta = Math.min(2, h2h.losses - h2h.wins);
      suggestedOE = clamp(suggestedOE - delta, 1, 10);
      suggestedAL = clamp(suggestedAL + delta, 1, 10);
      gearNotes.push(
        `Rematch adjustment: ${h2h.wins}-${h2h.losses} recent record vs ${ctx.opponent.name} — fight more patiently.`
      );
    }

    // Tempo shield — mirrors the dossier counter-condition rival AI pushes
    // when the opponent has killed or beaten them before: shell up the moment
    // the opponent seizes tempo.
    if ((ctx.opponent.career?.kills ?? 0) > 0 || losingRematch) {
      suggestedConditions.push({
        trigger: { type: 'OPPONENT_MOMENTUM_LEAD', value: 2 },
        override: { AL: bounded(suggestedAL, +2), OE: bounded(suggestedOE, -1) },
        label: `Shell up when ${ctx.opponent.name} seizes tempo`,
      });
    }

    // Kill-window press — unless the council is preserving this fighter.
    if (!preservational) {
      suggestedConditions.push({
        trigger: { type: 'OPPONENT_HP_BELOW', value: 30 },
        override: {
          killDesire: clamp((warrior.plan?.killDesire ?? 5) + 2, 1, 10),
          OE: bounded(suggestedOE, +1),
        },
        label: 'Press the kill window when they are hurt',
      });
    }

    // Counter-tempo: a 'Tactic' dossier token (Expert scouting) reads the
    // opponent's suspected plan. Meet a high-OE aggressor with patience;
    // press a passive opponent before they can settle in.
    const tacticIntel = getOpponentIntel(ctx.state, ctx.opponent.id).find(
      (t) => t.type === 'Tactic'
    );
    const suspected = tacticIntel?.detail.match(/Suspected OE: (\w+), AL: (\w+)/);
    if (suspected?.[1] === 'High') {
      suggestedOE = clamp(suggestedOE - 1, 1, 10);
      suggestedAL = clamp(suggestedAL + 1, 1, 10);
      gearNotes.push(
        `Counter-tempo: scouts report ${ctx.opponent.name} fights at high offensive eagerness — absorb and counter.`
      );
    } else if (suspected?.[1] === 'Low') {
      suggestedOE = clamp(suggestedOE + 1, 1, 10);
      suggestedAL = clamp(suggestedAL - 1, 1, 10);
      gearNotes.push(
        `Scouts report ${ctx.opponent.name} fights passively — press the tempo.`
      );
      suggestedConditions.push({
        trigger: { type: 'OPPONENT_ENDURANCE_BELOW', value: 40 },
        override: { OE: bounded(suggestedOE, +2) },
        label: 'Swarm when they gas out',
      });
    }
  }

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
