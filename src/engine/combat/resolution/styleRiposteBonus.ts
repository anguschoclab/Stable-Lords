/**
 * Style-specific riposte bonus calculations.
 * Extracted from resolution.ts for SRP separation.
 */
import type { CommitLevel } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';
import {
  TP_FATIGUE_SEVERE_RATIO,
  TP_FATIGUE_MODERATE_RATIO,
  TP_FATIGUE_SEVERE_RIP,
  TP_FATIGUE_SEVERE_DMG,
  TP_FATIGUE_MODERATE_RIP,
  TP_FATIGUE_MODERATE_DMG,
  PL_MOMENTUM_RIPOSTE_DMG_COEFF,
  PR_COUNTER_ON_PARRY,
  PR_COMMIT_PUNISH,
  PR_CHAIN_STEP,
  PR_CHAIN_CAP,
} from '@/constants/combat';
import type { FighterState } from './types';

export function styleRiposteBonus(
  def: FighterState,
  att: FighterState,
  opts: { afterParry?: boolean; attCommitLevel?: CommitLevel; riposteStreak?: number } = {}
): { ripBonus: number; dmgBonus: number } {
  let ripBonus = 0;
  let dmgBonus = 0;

  // TP: fatigue-exploit counter — opponent's exhaustion feeds riposte chance and damage
  if (def.style === FightingStyle.TotalParry) {
    const endRatio = att.endurance / Math.max(1, att.maxEndurance);
    if (endRatio < TP_FATIGUE_SEVERE_RATIO) {
      ripBonus += TP_FATIGUE_SEVERE_RIP;
      dmgBonus += TP_FATIGUE_SEVERE_DMG;
    } else if (endRatio < TP_FATIGUE_MODERATE_RATIO) {
      ripBonus += TP_FATIGUE_MODERATE_RIP;
      dmgBonus += TP_FATIGUE_MODERATE_DMG;
    }
  }

  // PL: momentum-based riposte pressure (reactive tempo, not raw attack damage).
  // Negated when the target is Wall of Steel — WS is immovable to tempo snowballs.
  if (
    def.style === FightingStyle.ParryLunge &&
    def.momentum > 0 &&
    att.style !== FightingStyle.WallOfSteel
  ) {
    ripBonus += def.momentum;
    dmgBonus += def.momentum * PL_MOMENTUM_RIPOSTE_DMG_COEFF;
  }

  // PR: riposte master — counter-on-parry (frequency), punish-commitment (damage), light chain
  if (def.style === FightingStyle.ParryRiposte) {
    if (opts.afterParry) ripBonus += PR_COUNTER_ON_PARRY;
    dmgBonus += PR_COMMIT_PUNISH[opts.attCommitLevel ?? 'Standard'];
    dmgBonus += Math.min(PR_CHAIN_CAP, (opts.riposteStreak ?? 0) * PR_CHAIN_STEP);
  }

  return { ripBonus, dmgBonus };
}
