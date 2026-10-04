/**
 * Trait Combat Mods - static and dynamic skill modifiers from traits.
 * Extracted from traits.ts for SRP separation.
 */
import { ATTRIBUTE_MAX, type Warrior } from '@/types/warrior.types';
import type { Attributes, FightPlan } from '@/types/shared.types';
import { TRAITS } from './registry';

/**
 * Per-trait effect entries, precomputed once at module load. TRAITS is a
 * static registry — rebuilding these entries arrays inside per-recruit /
 * per-fighter loops allocates the same tuples over and over.
 * fightPlanMod entries are restricted to numeric fields at build time,
 * preserving the runtime skip semantics the consumers relied on.
 */
const ATTR_BONUS_ENTRIES: Record<string, [keyof Attributes, number][]> = {};
const FIGHT_PLAN_MOD_ENTRIES: Record<string, [keyof FightPlan, number][]> = {};
for (const [id, def] of Object.entries(TRAITS)) {
  if (def.effect.attrBonus) {
    ATTR_BONUS_ENTRIES[id] = Object.entries(def.effect.attrBonus) as [
      keyof Attributes,
      number,
    ][];
  }
  if (def.effect.fightPlanMod) {
    FIGHT_PLAN_MOD_ENTRIES[id] = Object.entries(def.effect.fightPlanMod).filter(
      (e): e is [keyof FightPlan, number] => typeof e[1] === 'number'
    );
  }
}

/**
 * Applies trait attrBonus effects to an attribute block in place, clamped to
 * ATTRIBUTE_MAX. Intake-time counterpart to the combat mods below — used by
 * every recruit/orphan generation path so new warriors can't enter the world
 * over the attribute cap.
 */
export function applyTraitAttrBonuses(attrs: Attributes, traitIds: readonly string[]): void {
  for (const tid of traitIds) {
    const entries = ATTR_BONUS_ENTRIES[tid];
    if (!entries) continue;
    for (const [k, bonus] of entries) {
      attrs[k] = Math.min(ATTRIBUTE_MAX, attrs[k] + bonus);
    }
  }
}

/**
 * Sums static skill mods from a warrior's traits. Applied once at fighterState build.
 *
 * @param warrior - The warrior whose traits to evaluate
 * @returns Object containing cumulative static modifiers
 */
export function getStaticTraitMods(warrior?: Warrior): {
  attMod: number;
  parMod: number;
  defMod: number;
  iniMod: number;
  ripMod: number;
  decMod: number;
  dmgBonus: number;
  enduranceMult: number;
} {
  const acc = {
    attMod: 0,
    parMod: 0,
    defMod: 0,
    iniMod: 0,
    ripMod: 0,
    decMod: 0,
    dmgBonus: 0,
    enduranceMult: 1.0,
  };
  if (!warrior?.traits) return acc;
  for (const id of warrior.traits) {
    const t = TRAITS[id];
    if (!t) continue;
    acc.attMod += t.effect.attMod ?? 0;
    acc.parMod += t.effect.parMod ?? 0;
    acc.defMod += t.effect.defMod ?? 0;
    acc.iniMod += t.effect.iniMod ?? 0;
    acc.ripMod += t.effect.ripMod ?? 0;
    acc.decMod += t.effect.decMod ?? 0;
    acc.dmgBonus += t.effect.dmgBonus ?? 0;
    if (t.effect.enduranceMult != null) acc.enduranceMult *= t.effect.enduranceMult;
  }
  return acc;
}

/**
 * Defines the shape of dynamic trait context.
 */
export interface DynamicTraitContext {
  phase: 'OPENING' | 'MID' | 'LATE';
  hpRatio: number;
  endRatio: number;
  consecutiveHits: number;
}

/**
 * Sums conditional skill mods that depend on per-exchange combat context.
 * Called per exchange (matches the trainer-specialty pattern).
 *
 * @param warrior - The warrior whose traits to evaluate
 * @param ctx - The dynamic combat context (phase, HP, etc.)
 * @returns Object containing cumulative dynamic modifiers
 */
export type DynamicTraitMods = {
  attMod: number;
  parMod: number;
  defMod: number;
  iniMod: number;
  killWindowBonus: number;
};

/**
 *
 */
export function getDynamicTraitMods(
  warrior: { traits?: string[] } | undefined,
  ctx: DynamicTraitContext
): DynamicTraitMods {
  const acc = { attMod: 0, parMod: 0, defMod: 0, iniMod: 0, killWindowBonus: 0 };
  if (!warrior?.traits) return acc;
  for (const id of warrior.traits) {
    const t = TRAITS[id];
    if (!t) continue;
    const e = t.effect;
    if (e.attModLowHp != null && ctx.hpRatio < 0.5) acc.attMod += e.attModLowHp;
    if (e.defModLowHp != null && ctx.hpRatio < 0.5) acc.defMod += e.defModLowHp;
    if (e.parModHighHp != null && ctx.hpRatio > 0.75) acc.parMod += e.parModHighHp;
    if (e.defModEarly != null && ctx.phase === 'OPENING') acc.defMod += e.defModEarly;
    if (e.iniModEarly != null && ctx.phase === 'OPENING') acc.iniMod += e.iniModEarly;
    if (e.attModEarly != null && ctx.phase === 'OPENING') acc.attMod += e.attModEarly;
    if (e.attModLate != null && ctx.phase === 'LATE') acc.attMod += e.attModLate;
    if (e.defModLate != null && ctx.phase === 'LATE') acc.defMod += e.defModLate;
    if (e.parModLate != null && ctx.phase === 'LATE') acc.parMod += e.parModLate;
    if (e.iniModFresh != null && ctx.endRatio > 0.7) acc.iniMod += e.iniModFresh;
    if (e.attModConsecutiveHits != null && ctx.consecutiveHits >= 2)
      acc.attMod += e.attModConsecutiveHits;
    if (e.killWindowBonus != null) acc.killWindowBonus += e.killWindowBonus;
  }
  return acc;
}

/**
 * Combines personality/combat AI trait modifiers for a warrior's FightPlan.
 *
 * @param warrior - The warrior whose traits to evaluate
 * @returns Partial FightPlan containing cumulative AI modifiers
 */
export function getTraitFightPlanMods(warrior?: Warrior): Partial<FightPlan> {
  const mods: Partial<FightPlan> = {};
  if (!warrior?.traits) return mods;

  for (const id of warrior.traits) {
    const entries = FIGHT_PLAN_MOD_ENTRIES[id];
    if (!entries) continue;

    for (const [k, val] of entries) {
      (mods as Record<string, number>)[k] = ((mods[k] as number) || 0) + val;
    }
  }
  return mods;
}
