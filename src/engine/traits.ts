/**
 * Warrior Traits - re-export barrel for backward compatibility.
 *
 * SRP split:
 * - traitDefs.ts: Type definitions + TRAITS record
 * - traitGeneration.ts: Birth trait rolling (generateTraits, traitsForStyle, traitsByTier)
 * - traitMods.ts: Combat modifiers (getStaticTraitMods, getDynamicTraitMods, getTraitFightPlanMods)
 */
export {
  TRAITS,
  type TraitDef,
  type TraitEffect,
  type TraitTier,
  type TraitSign,
  type TraitId,
} from './traitDefs';

export { traitsForStyle, traitsByTier, generateTraits } from './traitGeneration';

export {
  getStaticTraitMods,
  getDynamicTraitMods,
  getTraitFightPlanMods,
  type DynamicTraitContext,
  type DynamicTraitMods,
} from './traitMods';
