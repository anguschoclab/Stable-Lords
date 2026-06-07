/**
 * Endurance Costs - Apply endurance costs and check for exhaustion
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '../../types';
import type { ResolutionContext } from '../../types';
import { enduranceCost } from '../../../mechanics/combatFatigue';
import { PSYCH_STATE_MODS } from '../../../mechanics/conditionEngine';
import { getEnduranceMult } from '@/engine/stylePassives';
import { DEFENDER_ENDURANCE_DISCOUNT } from '@/constants/combat';

/**
 * Apply endurance costs.
 */
export function applyEnduranceCosts(
  events: CombatEvent[],
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState,
  aGoesFirst: boolean,
  curAttOE: number,
  curAttAL: number,
  curAttWepReq: { endurancePenalty: number },
  curDefWepReq: { endurancePenalty: number },
  OE_D: number,
  AL_D: number,
  OE_A: number,
  AL_A: number
) {
  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;

  const arenaEndMult = ctx.surfaceMod?.enduranceMult ?? 1;
  const psychEndMultA = PSYCH_STATE_MODS[fA.psychState]?.enduranceCostMult ?? 1;
  const psychEndMultD = PSYCH_STATE_MODS[fD.psychState]?.enduranceCostMult ?? 1;
  const traitEndMultAtt = att.staticEnduranceMult ?? 1;
  const traitEndMultDef = def.staticEnduranceMult ?? 1;

  att.endurance -= Math.round(
    enduranceCost(curAttOE, curAttAL, ctx.weather) *
      getEnduranceMult(att.style) *
      curAttWepReq.endurancePenalty *
      (att.encumbrancePenalty?.enduranceMult ?? 1) *
      arenaEndMult *
      (aGoesFirst ? psychEndMultA : psychEndMultD) *
      traitEndMultAtt
  );

  def.endurance -= Math.max(
    1,
    Math.round(
      enduranceCost(aGoesFirst ? OE_D : OE_A, aGoesFirst ? AL_D : AL_A, ctx.weather) *
        DEFENDER_ENDURANCE_DISCOUNT *
        getEnduranceMult(def.style) *
        curDefWepReq.endurancePenalty *
        (def.encumbrancePenalty?.enduranceMult ?? 1) *
        arenaEndMult *
        (aGoesFirst ? psychEndMultD : psychEndMultA) *
        traitEndMultDef
    )
  );

  if (
    (fA.endurance <= 0 || fD.endurance <= 0) &&
    !events.some((e) => e.result === 'Kill' || e.result === 'KO')
  ) {
    if (fA.endurance <= 0 && fD.endurance <= 0) {
      events.push({
        type: 'BOUT_END',
        actor: 'A',
        result: 'Exhaustion',
        metadata: { cause: 'FATIGUE_COLLAPSE' },
      });
    } else {
      const collapsed = fA.endurance <= 0 ? fA : fD;
      const cause = collapsed.hp < collapsed.maxHp * 0.15 ? 'FATIGUE_COLLAPSE' : undefined;
      events.push({
        type: 'BOUT_END',
        actor: fA.endurance <= 0 ? 'A' : 'D',
        result: 'Stoppage',
        metadata: cause ? { cause } : undefined,
      });
    }
  }
}
