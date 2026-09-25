/**
 * Endurance Costs - Apply endurance costs and check for exhaustion
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from '../../types';
import type { ResolutionContext } from '../../types';
import { enduranceCost } from '../../../mechanics/combatFatigue';
import { PSYCH_STATE_MODS } from '../../../mechanics/conditionEngine';
import { getEnduranceMult } from '@/engine/stylePassives';
import { DEFENDER_ENDURANCE_DISCOUNT, EXHAUSTION_STOP_HP_RATIO } from '@/constants/combat';
import { getItemById } from '@/data/equipment/equipment.utils';

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

  // Equipment endurance cost modifiers (armor + helm)
  const attArmor = att.armorId ? getItemById(att.armorId) : undefined;
  const attHelm = att.helmId ? getItemById(att.helmId) : undefined;
  const attEquipEndMult = (attArmor?.enduranceCostMod ?? 1.0) * (attHelm?.enduranceCostMod ?? 1.0);
  const defArmor = def.armorId ? getItemById(def.armorId) : undefined;
  const defHelm = def.helmId ? getItemById(def.helmId) : undefined;
  const defEquipEndMult = (defArmor?.enduranceCostMod ?? 1.0) * (defHelm?.enduranceCostMod ?? 1.0);

  att.endurance -= Math.round(
    enduranceCost(curAttOE, curAttAL, ctx.weather) *
      getEnduranceMult(att.style) *
      curAttWepReq.endurancePenalty *
      (att.encumbrancePenalty?.enduranceMult ?? 1) *
      attEquipEndMult *
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
        defEquipEndMult *
        arenaEndMult *
        (aGoesFirst ? psychEndMultD : psychEndMultA) *
        traitEndMultDef
    )
  );

  const collapsedA = fA.endurance <= 0;
  const collapsedD = fD.endurance <= 0;
  if (
    (collapsedA || collapsedD) &&
    !events.some((e) => e.result === 'Kill' || e.result === 'KO')
  ) {
    // Exhaustion/stoppage is a *safety* rule, not a win condition: a collapsed
    // fighter is only stopped when they are also hurt enough that they can no
    // longer defend themselves. A fighter who merely gassed out keeps fighting
    // under the existing heavy fatigue penalties until hurt, KO'd, or decided
    // by the judges.
    const hurtA = collapsedA && fA.hp < fA.maxHp * EXHAUSTION_STOP_HP_RATIO;
    const hurtD = collapsedD && fD.hp < fD.maxHp * EXHAUSTION_STOP_HP_RATIO;
    if (hurtA && hurtD) {
      // Double collapse of two already-beaten fighters — the rare mutual draw.
      events.push({
        type: 'BOUT_END',
        actor: 'A',
        result: 'Exhaustion',
        metadata: { cause: 'FATIGUE_COLLAPSE' },
      });
    } else if (hurtA || hurtD) {
      const collapsed = hurtA ? fA : fD;
      const cause = collapsed.hp < collapsed.maxHp * 0.15 ? 'FATIGUE_COLLAPSE' : undefined;
      events.push({
        type: 'BOUT_END',
        actor: hurtA ? 'A' : 'D',
        result: 'Stoppage',
        metadata: cause ? { cause } : undefined,
      });
    }
  }
}
