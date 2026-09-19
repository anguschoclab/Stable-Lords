import { FightingStyle } from '@/types/shared.types';
import type { Trainer } from '@/types/state.types';
import type { ResolutionContext, FighterState } from '@/engine/combat/resolution/types';
import { getTrainingBonus } from '@/engine/trainers';
import { getSpecialtyMods } from '@/engine/trainerSpecialties';

/**
 * Get trainer mods.
 * @param trainers -
 * @param style -
 * @param fighter -
 * @param opponent -
 * @param ctx -
 */
export function getTrainerMods(
  trainers: Trainer[] | undefined,
  style: FightingStyle,
  fighter?: FighterState,
  opponent?: FighterState,
  ctx?: ResolutionContext
) {
  if (!trainers) {
    return {
      attMod: 0,
      defMod: 0,
      iniMod: 0,
      parMod: 0,
      decMod: 0,
      endMod: 0,
      healMod: 0,
      killWindowBonus: 0,
      damageReceivedMult: 1.0,
      riposteDamageMult: 1.0,
      fatiguePenaltyReduction: 0,
    };
  }
  const bonus = getTrainingBonus(trainers, style);
  const base = {
    attMod: bonus.Aggression,
    parMod: Math.floor(bonus.Defense * 0.6),
    defMod: Math.floor(bonus.Defense * 0.4),
    iniMod: Math.floor(bonus.Mind * 0.6),
    decMod: Math.floor(bonus.Mind * 0.4),
    endMod: bonus.Endurance * 2,
    healMod: bonus.Healing,
  };

  if (fighter && opponent && ctx) {
    const spec = getSpecialtyMods(trainers, fighter, opponent, ctx);
    return {
      attMod: base.attMod + spec.attMod,
      parMod: base.parMod + spec.parMod,
      defMod: base.defMod + spec.defMod,
      iniMod: base.iniMod + spec.iniMod,
      decMod: base.decMod + spec.decMod,
      endMod: base.endMod + spec.endMod,
      healMod: base.healMod,
      killWindowBonus: spec.killWindowBonus,
      damageReceivedMult: spec.damageReceivedMult,
      riposteDamageMult: spec.riposteDamageMult,
      fatiguePenaltyReduction: spec.fatiguePenaltyReduction,
    };
  }

  return {
    ...base,
    killWindowBonus: 0,
    damageReceivedMult: 1.0,
    riposteDamageMult: 1.0,
    fatiguePenaltyReduction: 0,
  };
}



