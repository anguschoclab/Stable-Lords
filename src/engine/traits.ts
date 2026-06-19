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
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Archetype } from '@/data/names/archetypeNames';
import { TRAIT_SYNERGY_MULTIPLIER, TRAIT_ANTI_SYNERGY_MULTIPLIER } from '@/constants/combat/combat'; /**
 * Defines the shape of trait effect.
 */

/**
 * Defines the shape of trait effect.
 */
export interface TraitEffect {
  // Static skill mods (applied at fighterState build)
  attMod?: number;
  parMod?: number;
  defMod?: number;
  iniMod?: number;
  ripMod?: number;
  decMod?: number;
  dmgBonus?: number;
  enduranceMult?: number;

  // Conditional mods (evaluated each exchange against context)
  attModLowHp?: number; // attacker HP < 0.5
  defModLowHp?: number; // defender HP < 0.5
  parModHighHp?: number; // own HP > 0.75
  defModEarly?: number; // OPENING phase
  defModLate?: number; // LATE phase
  attModLate?: number; // LATE phase
  parModLate?: number; // LATE phase
  iniModFresh?: number; // own endurance > 0.7
  killWindowBonus?: number; // adds directly to kill threshold

  // Special: kill-streak / hit-streak based
  attModConsecutiveHits?: number; // when consecutiveHits >= 2

  // Personality / Combat AI modifiers (from FTUE)
  fightPlanMod?: Partial<import('@/types/shared.types').FightPlan>;
  attrBonus?: Partial<import('@/types/shared.types').Attributes>;
} /**
 * Defines the shape of trait def.
 */

/**
 * Defines the shape of trait def.
 */
export interface TraitDef {
  id: string;
  name: string;
  description: string;
  effect: TraitEffect;
  /** 0-1; lower = rarer. Weighted random pool. */
  weight: number;
  /** Archetypes this trait synergizes with (2× pick weight). */
  synergy?: Archetype[];
  /** Archetypes this trait clashes with (0.3× pick weight). */
  antiSynergy?: Archetype[];
} /**
 * Traits.
 */

/**
 * Traits.
 */
export const TRAITS: Record<string, TraitDef> = {
  feral_instinct: {
    id: 'feral_instinct',
    name: 'Feral Instinct',
    description:
      '+1 initiative and +1 attack when bloodied (HP < 50%) — reverting to survival instincts learned in the gutters.',
    effect: { iniMod: 1, attModLowHp: 1 },
    weight: 0.8,
  },
  gutter_rat: {
    id: 'gutter_rat',
    name: 'Gutter Rat',
    description:
      '+2 defense in LATE phase — accustomed to outlasting stronger opponents in grueling street fights.',
    effect: { defModLate: 2 },
    weight: 0.8,
  },
  quick: {
    id: 'quick',
    name: 'Quick',
    description: '+1 initiative — naturally fast on the draw.',
    effect: { iniMod: 1 },
    weight: 1.0,
  },
  patient: {
    id: 'patient',
    name: 'Patient',
    description: '+2 defense in OPENING phase — sizes up the foe before committing.',
    effect: { defModEarly: 2 },
    weight: 1.0,
  },
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    description: '+2 attack when bloodied (HP < 50%).',
    effect: { attModLowHp: 2 },
    weight: 0.7,
  },
  stalwart: {
    id: 'stalwart',
    name: 'Stalwart',
    description: '+2 parry while still strong (HP > 75%).',
    effect: { parModHighHp: 2 },
    weight: 0.8,
  },
  heavy_handed: {
    id: 'heavy_handed',
    name: 'Heavy-Handed',
    description: '+1 damage on every successful hit.',
    effect: { dmgBonus: 1 },
    weight: 0.7,
  },
  disciplined: {
    id: 'disciplined',
    name: 'Disciplined',
    description: '+1 attack in LATE phase — endurance discipline pays off.',
    effect: { attModLate: 1, parMod: 1 },
    weight: 0.7,
  },
  ironlung: {
    id: 'ironlung',
    name: 'Iron Lung',
    description: '×0.92 endurance cost — efficient breathing.',
    effect: { enduranceMult: 0.92 },
    weight: 0.6,
  },
  bloodthirsty: {
    id: 'bloodthirsty',
    name: 'Bloodthirsty',
    description: '+0.005 to kill window — hungrier for the finish.',
    effect: { killWindowBonus: 0.005 },
    weight: 0.5,
  },
  agile: {
    id: 'agile',
    name: 'Agile',
    description: '+1 defense baseline — light on the feet.',
    effect: { defMod: 1 },
    weight: 0.9,
  },
  precise: {
    id: 'precise',
    name: 'Precise',
    description: '+1 decisiveness baseline — picks the right opening.',
    effect: { decMod: 1 },
    weight: 0.7,
  },
  comboartist: {
    id: 'comboartist',
    name: 'Combo Artist',
    description: '+1 attack when on a hit-streak (≥2 consecutive hits).',
    effect: { attModConsecutiveHits: 1 },
    weight: 0.7,
  },
  riposte_natural: {
    id: 'riposte_natural',
    name: 'Natural Riposte',
    description: '+1 riposte skill — counters come naturally.',
    effect: { ripMod: 1 },
    weight: 0.7,
  },
  fragile: {
    id: 'fragile',
    name: 'Fragile',
    description: '−2 defense baseline — drops guard easily.',
    effect: { defMod: -2 },
    weight: 0.4,
  },
  slow: {
    id: 'slow',
    name: 'Slow',
    description: '−1 initiative — late on the draw.',
    effect: { iniMod: -1 },
    weight: 0.4,
  },
  iron_grip: {
    id: 'iron_grip',
    name: 'Iron Grip',
    description: '+1 damage, −1 initiative — sacrifices speed for a crushing hold on their weapon.',
    effect: { dmgBonus: 1, iniMod: -1 },
    weight: 0.6,
  },
  cornered_beast: {
    id: 'cornered_beast',
    name: 'Cornered Beast',
    description: '+2 defense when bloodied (HP < 50%) — fights harder when backed into a corner.',
    effect: { defModLowHp: 2 },
    weight: 0.6,
  },
  perceptive: {
    id: 'perceptive',
    name: 'Perceptive',
    description: '+1 decisiveness, +1 initiative — reads the subtle tells of an opponent.',
    effect: { decMod: 1, iniMod: 1 },
    weight: 0.5,
  },
  vengeful: {
    id: 'vengeful',
    name: 'Vengeful',
    description: '+1 damage when bloodied (HP < 50%) — pain only makes them angrier.',
    effect: { attModLowHp: 1, dmgBonus: 1 },
    weight: 0.6,
  },
  stoic: {
    id: 'stoic',
    name: 'Stoic',
    description: '+1 defense in LATE phase — ignores mounting fatigue and pain.',
    effect: { defModLate: 1, parModLate: 1 },
    weight: 0.7,
  },
  // ── Personality / Combat AI Traits ──
  aggressive: {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Fights with reckless abandon, favoring strength over defense.',
    effect: { fightPlanMod: { OE: 4, AL: -1, killDesire: 5 }, attrBonus: { ST: 1, WL: 1 } },
    weight: 1.0,
    synergy: ['brutal'],
    antiSynergy: ['tank'],
  },
  disciplined_mind: {
    id: 'disciplined_mind',
    name: 'Disciplined',
    description: 'Calm and focused, waiting for the perfect moment to strike.',
    effect: { fightPlanMod: { AL: 3, OE: -1, feintTendency: 5 }, attrBonus: { DF: 1, WL: 1 } },
    weight: 1.0,
    synergy: ['cunning', 'tank'],
  },
  cunning: {
    id: 'cunning',
    name: 'Cunning',
    description: 'Favors trickery and misdirection to find the killing blow.',
    effect: {
      fightPlanMod: { feintTendency: 10, AL: 2, killDesire: -2 },
      attrBonus: { SP: 1, DF: 1 },
    },
    weight: 1.0,
    synergy: ['cunning', 'agile'],
    antiSynergy: ['brutal'],
  },
  sturdy: {
    id: 'sturdy',
    name: 'Sturdy',
    description: 'An unbreakable wall that outlasts any opponent.',
    effect: { fightPlanMod: { AL: -3, OE: -2, killDesire: -5 }, attrBonus: { CN: 1, SZ: 1 } },
    weight: 1.0,
    synergy: ['tank'],
    antiSynergy: ['agile'],
  },
  feral: {
    id: 'feral',
    name: 'Feral',
    description: 'Fights with a savage, unpredictable intensity.',
    effect: { fightPlanMod: { OE: 6, AL: -4, killDesire: 10 }, attrBonus: { ST: 1, SP: 1 } },
    weight: 0.6,
    synergy: ['brutal', 'agile'],
    antiSynergy: ['tank', 'cunning'],
  },
  merciless: {
    id: 'merciless',
    name: 'Merciless',
    // killDesire 12 stays the highest single-trait source (Feral=10, Aggressive=5);
    // pulled back from 15 to prevent Merciless+Bloodthirsty tripling base kill rate.
    description: 'Relentlessly pursues the kill, ignoring all distractions.',
    effect: { fightPlanMod: { killDesire: 12, OE: 2 }, attrBonus: { ST: 1, WL: 1 } },
    weight: 0.6,
    synergy: ['brutal'],
  },
  calculated: {
    id: 'calculated',
    name: 'Calculated',
    description: 'Every move is a deliberate setup for a final strike.',
    effect: { fightPlanMod: { feintTendency: 8, AL: 4, OE: -3 }, attrBonus: { SP: 1, DF: 1 } },
    weight: 0.8,
    synergy: ['cunning'],
    antiSynergy: ['brutal'],
  },
  resilient: {
    id: 'resilient',
    name: 'Resilient',
    description: 'Absorbs punishment that would fell a lesser warrior.',
    effect: { fightPlanMod: { AL: -2, killDesire: -8 }, attrBonus: { CN: 2 } },
    weight: 0.8,
    synergy: ['tank'],
    antiSynergy: ['agile'],
  },
  evasive: {
    id: 'evasive',
    name: 'Evasive',
    description: 'A ghost on the sand, near-impossible to pin down.',
    effect: { fightPlanMod: { AL: 10, OE: -5, feintTendency: 5 }, attrBonus: { SP: 2 } },
    weight: 0.8,
    synergy: ['agile'],
    antiSynergy: ['brutal', 'tank'],
  },
  brutal: {
    id: 'brutal',
    name: 'Brutal',
    description: 'Values raw power and crushing impact above all else.',
    effect: { fightPlanMod: { OE: 8, killDesire: 5, AL: -5 }, attrBonus: { ST: 2 } },
    weight: 0.8,
    synergy: ['brutal'],
    antiSynergy: ['cunning', 'tank'],
  },
  // ── New Lore/Personality Traits ──
  blood_drunk: {
    id: 'blood_drunk',
    name: 'Blood Drunk',
    description:
      '+2 attack and −2 defense when bloodied (HP < 50%) — loses all sense of self-preservation once injured.',
    effect: { attModLowHp: 2, defModLowHp: -2, fightPlanMod: { killDesire: 3 } },
    weight: 0.6,
    synergy: ['brutal', 'agile'],
    antiSynergy: ['tank'],
  },
  paranoid: {
    id: 'paranoid',
    name: 'Paranoid',
    description:
      '+2 defense in OPENING phase, but −1 decisiveness overall — constantly expects ambushes.',
    effect: { defModEarly: 2, decMod: -1, fightPlanMod: { AL: -2 } },
    weight: 0.6,
    synergy: ['cunning'],
  },
  cold_eyed: {
    id: 'cold_eyed',
    name: 'Cold-Eyed',
    description:
      '+1 initiative, +1 decisiveness — unnervingly calm, viewing combat purely as geometry and physics.',
    effect: { iniMod: 1, decMod: 1, fightPlanMod: { feintTendency: 4, AL: 2 } },
    weight: 0.6,
    synergy: ['cunning', 'tank'],
    antiSynergy: ['brutal'],
  },
  survivalist: {
    id: 'survivalist',
    name: 'Survivalist',
    description: '+2 defense and +2 parry when bloodied (HP < 50%) — fights hardest when cornered.',
    effect: { defModLowHp: 2, parModHighHp: 0, fightPlanMod: { AL: -2 } },
    weight: 0.7,
    synergy: ['tank', 'agile'],
  },
  death_marked: {
    id: 'death_marked',
    name: 'Death-Marked',
    description:
      '+2 kill window bonus and +1 decisiveness — an eerie aura that makes their lethal strikes more likely to finish the job.',
    effect: { killWindowBonus: 2, decMod: 1, fightPlanMod: { killDesire: 4 } },
    weight: 0.5,
    synergy: ['brutal', 'cunning'],
    antiSynergy: ['tank'],
  },
  blood_scent: {
    id: 'blood_scent',
    name: 'Blood Scent',
    description: '+1 attack when opponent is bloodied (HP < 50%).',
    effect: { attModLowHp: 1 },
    weight: 0.6,
  },
  shadow_step: {
    id: 'shadow_step',
    name: 'Shadow Step',
    description: '+1 defense, −1 damage — favors elusive positioning over heavy strikes.',
    effect: { defMod: 1, dmgBonus: -1 },
    weight: 0.5,
  },
};

export type TraitId = keyof typeof TRAITS;
const TRAIT_IDS = Object.keys(TRAITS) as TraitId[];

/**
 * Roll 0-2 traits at warrior creation, weighted by trait rarity.
 * Distribution targets ~25% no traits, ~55% one trait, ~20% two traits.
 */
/**
 * Roll 0-2 traits at warrior creation, weighted by trait rarity.
 * Distribution targets ~25% no traits, ~55% one trait, ~20% two traits.
 *
 * When an archetype is provided, traits with matching synergy get 3× weight
 * and traits with matching antiSynergy get 0.10× weight. This makes thematic
 * fits ~60-70% likely while still allowing interesting against-type warriors.
 * Traits amplify a fighter's identity and minimise cross-style swings that
 * the balance matrix cannot see.
 *
 * @param rng - RNG service
 * @param archetype - Optional archetype to bias trait generation
 * @returns An array of trait IDs
 */
export function generateTraits(rng: IRNGService, archetype?: Archetype): string[] {
  const r1 = rng.next();
  const numTraits = r1 < 0.25 ? 0 : r1 < 0.8 ? 1 : 2;
  if (numTraits === 0) return [];

  const picked: string[] = [];

  for (let i = 0; i < numTraits; i++) {
    // Compute archetype-adjusted weights
    let totalWeight = 0;
    const weights: { id: string; w: number }[] = [];
    for (const id of TRAIT_IDS) {
      const t = TRAITS[id];
      if (!t || picked.includes(id)) continue;
      let w = t.weight;
      if (archetype) {
        if (t.synergy?.includes(archetype)) w *= TRAIT_SYNERGY_MULTIPLIER;
        if (t.antiSynergy?.includes(archetype)) w *= TRAIT_ANTI_SYNERGY_MULTIPLIER;
      }
      weights.push({ id, w });
      totalWeight += w;
    }

    let target = rng.next() * totalWeight;
    for (const { id, w } of weights) {
      target -= w;
      if (target <= 0) {
        picked.push(id);
        break;
      }
    }
  }
  return picked;
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
} /**
 * Defines the shape of dynamic trait context.
 */

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
export function getTraitFightPlanMods(
  warrior?: Warrior
): Partial<import('@/types/shared.types').FightPlan> {
  const mods: Partial<import('@/types/shared.types').FightPlan> = {};
  if (!warrior?.traits) return mods;

  for (const id of warrior.traits) {
    const t = TRAITS[id];
    if (!t?.effect.fightPlanMod) continue;

    for (const [key, val] of Object.entries(t.effect.fightPlanMod)) {
      const k = key as keyof import('@/types/shared.types').FightPlan;
      if (typeof val === 'number') {
        (mods as Record<string, number>)[k] = ((mods[k] as number) || 0) + val;
      }
    }
  }
  return mods;
}
