/**
 * V24 per-fighter tactic adjustments — the double-tactic "very limiting"
 * shell tax, the hidden favorite-tactic bonus, and the KD 9-10 "fights
 * strangely" flat tax. Extracted from exchangePrep for the S6 budget guard.
 *
 * Always returns FRESH mod objects — downstream writes (`iniBonus =`,
 * `attBonus +=`) must never touch the shared ZERO_* singletons.
 */
import type { WarriorFavorites } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';
import type { OffensiveTactic, DefensiveTactic } from '@/types/shared.types';
import {
  doubleTacticEffectiveness,
  killDesirePenalty,
  type OffensiveMods,
  type DefensiveMods,
} from '../../mechanics/tacticResolution';
import { getFavoriteTacticBonus } from '@/engine/favorites/favorites';

export function applyPairAdjustments(
  off: OffensiveMods,
  def: DefensiveMods,
  fighter: { favorites?: WarriorFavorites; activePlan: FightPlan },
  offTactic: OffensiveTactic,
  defTactic: DefensiveTactic
): { off: OffensiveMods; def: DefensiveMods } {
  // Canon (Consortium): the pairing's "very limiting value" lands on the
  // secondary defensive shell — the offensive plan keeps its punch.
  const mult = doubleTacticEffectiveness(offTactic, defTactic);
  const scale = (v: number) => (mult !== 1 && v > 0 ? Math.floor(v * mult) : v);
  const out = {
    off: { ...off },
    def: {
      ...def,
      parBonus: scale(def.parBonus),
      defBonus: scale(def.defBonus),
      iniBonus: scale(def.iniBonus),
      ripBonus: scale(def.ripBonus),
    },
  };

  // V24 canon: the hidden favorite tactic fires like the favorite weapon —
  // a flat bonus onto the favored tactic's primary area, discovered or not.
  out.off.attBonus += getFavoriteTacticBonus(fighter, offTactic);
  out.def.parBonus += getFavoriteTacticBonus(fighter, defTactic);

  // V24 canon (Assur): KD 9-10 "fights somewhat strangely" — flat tax.
  const kd = killDesirePenalty(fighter.activePlan.killDesire);
  out.off.attBonus += kd.attBonus;
  out.def.iniBonus += kd.iniBonus;

  return out;
}
