/**
 * Specialty Mods - Per-exchange trainer specialty calculations
 */
import { getSpecialtyMods } from '../../trainerSpecialties';
import type { FighterState } from './types';
import type { ResolutionContext } from './types';

/**
 * Apply per-exchange specialty mods.
 * Specialties like KillerInstinct/Finisher/IronGuard depend on live HP/momentum/endurance.
 * We snapshot the static base mods on exchange 0 and always diff from that snapshot,
 * so each exchange gets a fresh specialty computation without compounding.
 */
export function applySpecialtyMods(ctx: ResolutionContext, fA: FighterState, fD: FighterState): void {
  if (ctx.trainers?.length) {
    if (!ctx.baseTrainerModsA) ctx.baseTrainerModsA = { ...ctx.trainerModsA };
    if (!ctx.baseTrainerModsD) ctx.baseTrainerModsD = { ...ctx.trainerModsD };
    const specA = getSpecialtyMods(ctx.trainers, fA, fD, ctx);
    const specD = getSpecialtyMods(ctx.trainers, fD, fA, ctx);
    const baseA = ctx.baseTrainerModsA;
    const baseD = ctx.baseTrainerModsD;
    ctx.trainerModsA = {
      attMod: (baseA.attMod ?? 0) + specA.attMod,
      parMod: (baseA.parMod ?? 0) + specA.parMod,
      defMod: (baseA.defMod ?? 0) + specA.defMod,
      iniMod: (baseA.iniMod ?? 0) + specA.iniMod,
      decMod: (baseA.decMod ?? 0) + specA.decMod,
      endMod: (baseA.endMod ?? 0) + specA.endMod,
      healMod: baseA.healMod ?? 0,
      killWindowBonus: specA.killWindowBonus,
      damageReceivedMult: specA.damageReceivedMult,
      riposteDamageMult: specA.riposteDamageMult,
      fatiguePenaltyReduction: specA.fatiguePenaltyReduction,
    };
    ctx.trainerModsD = {
      attMod: (baseD.attMod ?? 0) + specD.attMod,
      parMod: (baseD.parMod ?? 0) + specD.parMod,
      defMod: (baseD.defMod ?? 0) + specD.defMod,
      iniMod: (baseD.iniMod ?? 0) + specD.iniMod,
      decMod: (baseD.decMod ?? 0) + specD.decMod,
      endMod: (baseD.endMod ?? 0) + specD.endMod,
      healMod: baseD.healMod ?? 0,
      killWindowBonus: specD.killWindowBonus,
      damageReceivedMult: specD.damageReceivedMult,
      riposteDamageMult: specD.riposteDamageMult,
      fatiguePenaltyReduction: specD.fatiguePenaltyReduction,
    };
  }
}
