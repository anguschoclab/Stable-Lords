/**
 * Riposte Check - Perform riposte skill check
 */
import { skillCheck } from '../../../mechanics/combatMath';
import type { FighterState } from '../../types';
import { getStylePassive } from '@/engine/stylePassives';
import { getStyleAntiSynergy } from '@/engine/stylePassives';

/**
 *
 */
interface PerformRiposteCheckArgs {
  rng: () => number;
  def: FighterState;
  matchup: number;
  fat: number;
  penaltyOrBonus: number;
  curPass: ReturnType<typeof getStylePassive>;
  curAntiSynDef?: ReturnType<typeof getStyleAntiSynergy>;
}

/**
 * Perform riposte check.
 */
export function performRiposteCheck(args: PerformRiposteCheckArgs) {
  const { rng, def, matchup, fat, penaltyOrBonus } = args;
  const { curPass, curAntiSynDef } = args;
  const antiSyn = curAntiSynDef ? Math.round((curAntiSynDef.defMult - 1) * 3) : 0;
  return skillCheck(
    rng,
    def.skills.RIP,
    matchup + fat + penaltyOrBonus + curPass.ripBonus + antiSyn
  );
}
