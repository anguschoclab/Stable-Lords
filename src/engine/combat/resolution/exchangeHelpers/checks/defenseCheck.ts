/**
 * Defense Check - Perform defense skill check (parry or dodge)
 */
import { skillCheck } from '../../../mechanics/combatMath';
import { oeDefMod } from '../../../mechanics/tacticResolution';
import { GLOBAL_PAR_PENALTY, KILL_DESIRE_WILD } from '@/constants/combat';
import type { FighterState } from '../../types';
import { getDefensiveTacticMods } from '../../../mechanics/tacticResolution';
import { getOffensiveTacticMods } from '../../../mechanics/tacticResolution';
import { getStylePassive } from '@/engine/stylePassives';
import { getStyleAntiSynergy } from '@/engine/stylePassives';

/**
 *
 */
interface PerformDefenseCheckArgs {
  rng: () => number;
  def: FighterState;
  curDefOE: number;
  matchup: number;
  fat: number;
  curDefMods: ReturnType<typeof getDefensiveTacticMods>;
  curPassD: ReturnType<typeof getStylePassive>;
  curBiasDef: number;
  overDef: number;
  isDodge: boolean;
  curAntiSynDef: ReturnType<typeof getStyleAntiSynergy>;
  curOffMods: ReturnType<typeof getOffensiveTacticMods>;
  ctx?: { weatherEffect?: { riposteMod: number } };
  attacker?: FighterState;
  /** Attacker kill desire — canon (Jest/Boyd): KD is "patience", and the
   *  high-KD band (≥8) swings wild, so they are easier to dodge and parry. */
  attKD?: number;
  extraDefPenalty?: number;
}

/**
 * Perform defense check.
 */
export function performDefenseCheck(args: PerformDefenseCheckArgs) {
  const { rng, def, curDefOE, matchup, fat } = args;
  const { curDefMods, curPassD, curBiasDef, overDef, isDodge } = args;
  const { curAntiSynDef, curOffMods, ctx, attacker, extraDefPenalty = 0 } = args;
  // Committed attacker is fully open — defender gets +15 on defense
  const commitPenalty = attacker?.committed ? 15 : 0;
  // Wild swings (KD ≥ threshold) are easier to read — defender bonus.
  const wildBonus = Math.max(0, (args.attKD ?? 0) - KILL_DESIRE_WILD.THRESHOLD + 1) *
    KILL_DESIRE_WILD.DEF_COEFF;
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
        commitPenalty +
        wildBonus -
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
        wildBonus +
        riposteMod -
        extraDefPenalty
    );
    return { success, type: 'PARRY' as const };
  }
}
