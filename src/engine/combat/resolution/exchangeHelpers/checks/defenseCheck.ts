/**
 * Defense Check - Perform defense skill check (parry or dodge)
 */
import { skillCheck } from '../../../mechanics/combatMath';
import { oeDefMod } from '../../../mechanics/tacticResolution';
import { GLOBAL_PAR_PENALTY } from '@/constants/combat';
import type { FighterState } from '../../types';
import { getDefensiveTacticMods } from '../../../mechanics/tacticResolution';
import { getOffensiveTacticMods } from '../../../mechanics/tacticResolution';
import { getStylePassive } from '@/engine/stylePassives';
import { getStyleAntiSynergy } from '@/engine/stylePassives';

/**
 * Perform defense check.
 */
export function performDefenseCheck(
  rng: () => number,
  def: FighterState,
  curDefOE: number,
  matchup: number,
  fat: number,
  curDefMods: ReturnType<typeof getDefensiveTacticMods>,
  curPassD: ReturnType<typeof getStylePassive>,
  curBiasDef: number,
  overDef: number,
  isDodge: boolean,
  curAntiSynDef: ReturnType<typeof getStyleAntiSynergy>,
  curOffMods: ReturnType<typeof getOffensiveTacticMods>,
  ctx?: { weatherEffect?: { riposteMod: number } },
  attacker?: FighterState,
  extraDefPenalty: number = 0
) {
  // Committed attacker is fully open — defender gets +15 on defense
  const commitPenalty = attacker?.committed ? 15 : 0;
  if (isDodge) {
    const success = skillCheck(
      rng,
      def.skills.DEF,
      oeDefMod(curDefOE) +
        matchup +
        fat +
        curDefMods.defBonus +
        curPassD.defBonus +
        curBiasDef -
        overDef -
        def.legHits +
        commitPenalty -
        extraDefPenalty
    );
    return { success, type: 'DODGE' as const };
  } else {
    const riposteMod = ctx?.weatherEffect?.riposteMod ?? 0;
    const success = skillCheck(
      rng,
      def.skills.PAR,
      oeDefMod(curDefOE) +
        matchup +
        fat +
        curDefMods.parBonus +
        curPassD.parBonus +
        Math.round((curAntiSynDef.defMult - 1) * 3) -
        curOffMods.defPenalty -
        curOffMods.parryBypass +
        GLOBAL_PAR_PENALTY +
        curBiasDef -
        overDef -
        def.armHits +
        commitPenalty +
        riposteMod -
        extraDefPenalty
    );
    return { success, type: 'PARRY' as const };
  }
}
