/**
 * Attack Check - Perform attack skill check
 */
import { skillCheck } from '../../../mechanics/combatMath';
import { oeAttMod } from '../../../mechanics/tacticResolution';
import { INITIATIVE_PRESS_BONUS, GLOBAL_ATT_BONUS } from '@/constants/combat';
import type { FighterState } from '../../types';
import { getOffensiveTacticMods } from '../../../mechanics/tacticResolution';
import { getStylePassive } from '@/engine/stylePassives';
import { getStyleAntiSynergy } from '@/engine/stylePassives';

/**
 *
 */
export interface PerformAttackCheckArgs {
  rng: () => number;
  att: FighterState;
  curAttOE: number;
  matchup: number;
  fat: number;
  curOffMods: ReturnType<typeof getOffensiveTacticMods>;
  curPass: ReturnType<typeof getStylePassive>;
  curAntiSyn: ReturnType<typeof getStyleAntiSynergy>;
  curBiasAtt: number;
  overAtt: number;
  _curAttWepReq: { attPenalty: number };
  extraBonus?: number;
}

/**
 * Perform attack check.
 */
export function performAttackCheck(args: PerformAttackCheckArgs) {
  const { rng, att, curAttOE, matchup, fat } = args;
  const { curOffMods, curPass, curAntiSyn, curBiasAtt, overAtt } = args;
  const {extraBonus = 0 } = args;
  // Commit mode: attacker throws caution aside — +10 ATT bonus but defender gets compensating bonus in defense
  const commitBonus = att.committed ? 10 : 0;
  return skillCheck(
    rng,
    att.skills.ATT,
    oeAttMod(curAttOE, att.style) +
      matchup +
      fat +
      curOffMods.attBonus +
      curPass.attBonus +
      Math.round((curAntiSyn.offMult - 1) * 5) +
      INITIATIVE_PRESS_BONUS +
      GLOBAL_ATT_BONUS +
      curBiasAtt -
      overAtt -
      att.armHits +
      extraBonus +
      commitBonus
  );
}
