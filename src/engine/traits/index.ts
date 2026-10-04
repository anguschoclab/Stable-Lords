/**
 * Warrior Traits — small inherent quirks that shift combat numbers slightly.
 *
 * Until 2026-04 the `warrior.traits: string[]` field existed in the schema
 * but was never read in combat — pure decoration. This module wires traits
 * into the combat path so they actually matter.
 *
 * Design:
 * - Each trait has a `TraitEffect` with optional skill mods + conditional mods.
 * - Static mods (att/par/def/ini/rip/dec) are applied once at fighterState build.
 * - Conditional mods (low-HP, late-phase, on-kill, etc.) are evaluated each
 *   exchange via `getDynamicTraitMods` and added on top of the base mods,
 *   matching the same pattern trainer specialties already use.
 * - Effects are intentionally small (±1, ±2) so a warrior with 1-2 traits
 *   shifts win rate by a few percentage points, not by 30+.
 *
 * Generation: each warrior rolls 0-2 traits at creation, weighted toward 1.
 */
export type { TraitDef, TraitEffect, TraitTier, TraitSign, TraitId } from './types';
export { TRAITS } from './registry';
export { COMMON_TRAITS } from './defs/common';
export { NOTABLE_TRAITS } from './defs/notable';
export { EXCEPTIONAL_TRAITS } from './defs/exceptional';
export { SIGNATURE_TRAITS } from './defs/signature';
export { FLAWS_TRAITS } from './defs/flaws';
export { CLASS_TRAITS } from './defs/classTraits';

export { traitsForStyle, traitsByTier, generateTraits } from './generation';

export {
  applyTraitAttrBonuses,
  getStaticTraitMods,
  getDynamicTraitMods,
  getTraitFightPlanMods,
  type DynamicTraitContext,
  type DynamicTraitMods,
} from './mods';
