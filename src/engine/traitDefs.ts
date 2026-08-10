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
import type { FightingStyle } from '@/types/shared.types';
import type { Archetype } from '@/data/names/archetypeNames';

/**
 *
 */
export type TraitTier = 'Common' | 'Notable' | 'Exceptional' | 'Signature' | 'Flaw';
/**
 *
 */
export type TraitSign = 'positive' | 'negative';
export type TraitId = string;

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
  iniModEarly?: number; // OPENING phase
  attModEarly?: number; // OPENING phase
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
  /** Power-budget tier, mirroring potential's RecruitTier ladder. 'Flaw' ⇒ negative. */
  tier: TraitTier;
  /** Whether the net effect helps or hurts. Flaws are always 'negative'. */
  sign: TraitSign;
  /** If present, the trait is class-restricted: only warriors of these styles
   *  can roll/train it, and it only appears in matching trainers' pools. */
  styles?: FightingStyle[];
} /**
 * Traits.
 */

/**
 * Traits.
 */
export const TRAITS: Record<string, TraitDef> = {
// 5 New Personality/Lore Traits

  guttersnipe_cunning: {
    id: 'guttersnipe_cunning',
    name: 'Guttersnipe Cunning',
    description: 'Fights dirty and unpredictable. Harder to pin down in prolonged engagements.',
    effect: { defModLate: 1, iniMod: 1 },
    tier: 'Notable',
    sign: 'positive',
    weight: 0.6,
  },
  iron_stomach: {
    id: 'iron_stomach',
    name: 'Iron Stomach',
    description: 'Raised on garbage and sour water. Shrugs off stamina loss slightly better than most.',
    effect: { enduranceMult: 0.95 },
    tier: 'Common',
    sign: 'positive',
    weight: 0.8,
  },
  ashen_lung: {
    id: 'ashen_lung',
    name: 'Ashen Lung',
    description: 'Breathed the soot of the forges too long. Prone to coughing fits when exhausted.',
    effect: { enduranceMult: 1.1, attModLate: -1 },
    tier: 'Flaw',
    sign: 'negative',
    weight: 0.4,
  },
  wild_instinct: {
    id: 'wild_instinct',
    name: 'Wild Instinct',
    description: 'Reacts purely on survival instinct. Fast off the mark, but reckless.',
    effect: { iniMod: 2, parMod: -1 },
    tier: 'Notable',
    sign: 'positive',
    weight: 0.5,
  },

  shadow_watcher: {
    id: 'shadow_watcher',
    name: 'Shadow Watcher',
    description: 'Always keeps an eye on the unseen. Improved defense early in the fight.',
    effect: { defModEarly: 1, defMod: 1 },
    tier: 'Notable',
    sign: 'positive',
    weight: 1,
  },
  knife_juggler: {
    id: 'knife_juggler',
    name: 'Knife Juggler',
    description: 'Uncanny hand-eye coordination from youth.',
    effect: { attMod: 1 },
    tier: 'Common',
    sign: 'positive',
    weight: 1,
  },
  stone_skin_orphan: {
    id: 'stone_skin_orphan',
    name: 'Stone Skin',
    description: 'Beatings hardened their flesh.',
    effect: { defMod: 0.95 },
    tier: 'Notable',
    sign: 'positive',
    weight: 1,
  },
  starving_dog: {
    id: 'starving_dog',
    name: 'Starving Dog',
    description:
      'Fights like a cornered animal when heavily wounded. Bonus attack when at low health.',
    effect: { attModLowHp: 2, defModLowHp: -1 },
    tier: 'Notable',
    sign: 'positive',
    weight: 0.6,
  },
  iron_knuckles: {
    id: 'iron_knuckles',
    name: 'Iron Knuckles',
    description:
      'Calloused fists from countless street brawls. Bonus to unarmed strikes and disarms.',
    effect: { attModEarly: 1, ripMod: 1 },
    tier: 'Common',
    sign: 'positive',
    weight: 0.8,
  },
  jumpy: {
    id: 'jumpy',
    name: 'Jumpy',
    description: 'Always expects a knife in the back. Better defense and parry, but lower attack.',
    effect: { defMod: 1, parMod: 1, attMod: -1 },
    tier: 'Flaw',
    sign: 'negative',
    weight: 0.7,
  },
  gutter_ghost: {
    id: 'gutter_ghost',
    name: 'Gutter Ghost',
    description: 'Moves unseen in the shadows of the arena. High evasion when healthy.',
    effect: { defMod: 1, parModHighHp: 1 },
    tier: 'Notable',
    sign: 'positive',
    weight: 0.6,
  },
  workhouse_resilience: {
    id: 'workhouse_resilience',
    name: 'Workhouse Resilience',
    description: 'Bones hardened by endless grueling labor. Better endurance, defense, and parry.',
    effect: { defMod: 1, parMod: 1, enduranceMult: 0.9 },
    tier: 'Notable',
    sign: 'positive',
    weight: 0.6,
  },
  silent_stalker: {
    id: 'silent_stalker',
    name: 'Silent Stalker',
    description: 'Learned to move without a sound in the slums. Increased initiative early.',
    effect: { iniModEarly: 1 },
    tier: 'Notable',
    sign: 'positive',
    weight: 0.8,
  },
  gutters_edge: {
    id: 'gutters_edge',
    name: "Gutter's Edge",
    description:
      'A desperate, wild fighting style born from alleyway brawls. Bonus damage but lowered early defense.',
    effect: { dmgBonus: 1, defModEarly: -1 },
    tier: 'Exceptional',
    sign: 'positive',
    weight: 0.5,
  },
  feral_endurance: {
    id: 'feral_endurance',
    name: 'Feral Endurance',
    description: 'Used to surviving on nothing but scraps and spite. Reduced endurance drain.',
    effect: { enduranceMult: 0.9 },
    tier: 'Notable',
    sign: 'positive',
    weight: 0.8,
  },
  orphan_vengeance: {
    id: 'orphan_vengeance',
    name: 'Orphan Vengeance',
    description:
      'Driven by a dark past. Gains brutal offensive capability in the late stages of a fight.',
    effect: { attModLate: 2, killWindowBonus: 1 },
    tier: 'Exceptional',
    sign: 'positive',
    weight: 0.2,
  },
  orphan_fragility: {
    id: 'orphan_fragility',
    name: 'Orphan Fragility',
    description: 'Malnourished in youth. Susceptible to early damage.',
    effect: { defModEarly: -1, enduranceMult: 0.9 },
    tier: 'Flaw',
    sign: 'negative',
    weight: 0.1,
  },

  orphan_blood: {
    id: 'orphan_blood',
    name: 'Orphan Blood',
    description:
      'Raised in the gutters. Inured to early punishment and fiercely defensive when wounded.',
    effect: { defModEarly: 1, attModLowHp: 1 },
    tier: 'Exceptional',
    sign: 'positive',
    weight: 0.3,
  },
  shadow_walker: {
    id: 'shadow_walker',
    name: 'Shadow Walker',
    description: 'Learned to survive unseen. Swift reflexes and enhanced evasion when fresh.',
    effect: { iniModFresh: 1, decMod: 1 },
    tier: 'Exceptional',
    sign: 'positive',
    weight: 0.2,
  },
  orphan_instinct: {
    id: 'orphan_instinct',
    name: 'Orphan Instinct',
    description:
      '+1 defense in early phase — years of running from danger have sharpened their reflexes.',
    effect: { defModEarly: 1, iniMod: 1 },
    weight: 0.8,
    tier: 'Exceptional',
    sign: 'positive',
  },
  born_in_shadows: {
    id: 'born_in_shadows',
    name: 'Born in Shadows',
    description: '+1 initiative in OPENING phase — used to striking before being seen.',
    effect: { iniModEarly: 1 },
    weight: 0.8,
    tier: 'Exceptional',
    sign: 'positive',
  },
  orphan_shadow: {
    id: 'orphan_shadow',
    name: 'Orphan Shadow',
    description:
      '+1 initiative and +1 decisiveness — forged in the darkest corners of the undercity.',
    effect: { iniMod: 1, decMod: 1 },
    weight: 0.8,
    tier: 'Exceptional',
    sign: 'positive',
  },
  gutter_phantom: {
    id: 'gutter_phantom',
    name: 'Gutter Phantom',
    description: '+1 defense in the early phase and +1 attack when at low HP.',
    effect: { defModEarly: 1, attModLowHp: 1 },
    weight: 0.8,
    tier: 'Exceptional',
    sign: 'positive',
  },
  gutter_born: {
    id: 'gutter_born',
    name: 'Gutter Born',
    description:
      'Forged in the merciless streets. Increased decisiveness and attack in early rounds.',
    effect: { decMod: 1, attModEarly: 1 },
    tier: 'Exceptional',
    sign: 'positive',
    weight: 0.5,
  },
  beast_blood: {
    id: 'beast_blood',
    name: 'Beast Blood',
    description:
      '+1 attack when at low HP and +1 initiative while fresh — lashes out like a wounded animal but starts strong.',
    effect: { attModLowHp: 1, iniModFresh: 1 },
    weight: 0.7,
    tier: 'Signature',
    sign: 'positive',
  },
  rusted_resolve: {
    id: 'rusted_resolve',
    name: 'Rusted Resolve',
    description:
      '+1 defense when bloodied and +1 defense in LATE phase — pain only hardens them further.',
    effect: { defModLowHp: 1, defModLate: 1 },
    weight: 0.7,
    tier: 'Signature',
    sign: 'positive',
  },
  spore_kissed: {
    id: 'spore_kissed',
    name: 'Spore Kissed',
    description: 'Inhaled chaos spores. Improved endurance and decisiveness.',
    effect: { enduranceMult: 0.85, decMod: 1 },
    tier: 'Notable',
    sign: 'positive',
    weight: 0.5,
  },
  cornered_rat: {
    id: 'cornered_rat',
    name: 'Cornered Rat',
    description:
      '+1 attack and +1 defense in LATE phase — extremely dangerous when backed into a corner.',
    effect: { attModLate: 1, defModLate: 1 },
    weight: 0.7,
    tier: 'Notable',
    sign: 'positive',
  },
  orphan_fury: {
    id: 'orphan_fury',
    name: 'Orphan Fury',
    description: '+1 attack and +1 initiative when bloodied — fueled by a lifetime of rage.',
    effect: { attModLowHp: 1, iniMod: 1 },
    weight: 0.8,
    tier: 'Exceptional',
    sign: 'positive',
  },
  asylum_survivor: {
    id: 'asylum_survivor',
    name: 'Asylum Survivor',
    description: '+1 defense and +1 initiative during early phase — hardened by years of survival.',
    effect: { defModEarly: 1, iniMod: 1 },
    weight: 0.8,
    tier: 'Notable',
    sign: 'positive',
  },
  asylum_born: {
    id: 'asylum_born',
    name: 'Asylum Born',
    description: '+1 defense when at low HP — accustomed to surviving desperate situations.',
    effect: { defModLowHp: 1 },
    weight: 0.7,
    tier: 'Notable',
    sign: 'positive',
  },
  street_rat_cunning: {
    id: 'street_rat_cunning',
    name: 'Street Rat Cunning',
    description:
      '+1 initiative while fresh, +1 decisiveness — always ready to run or strike first.',
    effect: { iniModFresh: 1, decMod: 1 },
    weight: 0.7,
    tier: 'Notable',
    sign: 'positive',
  },
  street_scrapper: {
    id: 'street_scrapper',
    name: 'Street Scrapper',
    description: '+1 defense in LATE phase — they excel when things get dirty.',
    effect: { defModLate: 1 },
    weight: 0.7,
    tier: 'Notable',
    sign: 'positive',
  },
  gutter_cunning: {
    id: 'gutter_cunning',
    name: 'Gutter Cunning',
    description: '+1 attack during early phase — strikes fast before the guards arrive.',
    effect: { attModEarly: 1 },
    weight: 0.5,
    tier: 'Notable',
    sign: 'positive',
  },
  gutter_blood: {
    id: 'gutter_blood',
    name: 'Gutter Blood',
    description: '+1 attack against low HP opponents — they can smell the end.',
    effect: { attModLowHp: 1 },
    weight: 0.7,
    tier: 'Notable',
    sign: 'positive',
  },
  clutch_survivor: {
    id: 'clutch_survivor',
    name: 'Clutch Survivor',
    description: "+1 attack in LATE phase — they thrive when the crowd thinks it's over.",
    effect: { attModLate: 1 },
    weight: 0.6,
    tier: 'Exceptional',
    sign: 'positive',
  },
  adrenaline_surge: {
    id: 'adrenaline_surge',
    name: 'Adrenaline Surge',
    description: '+1 initiative while fresh — their adrenaline spikes right out of the gate.',
    effect: { iniModFresh: 1 },
    weight: 0.8,
    tier: 'Common',
    sign: 'positive',
  },
  feral_instinct: {
    id: 'feral_instinct',
    name: 'Feral Instinct',
    description:
      '+1 initiative and +1 attack when bloodied (HP < 50%) — reverting to survival instincts learned in the gutters.',
    effect: { iniMod: 1, attModLowHp: 1 },
    weight: 0.8,
    tier: 'Notable',
    sign: 'positive',
  },
  gutter_rat: {
    id: 'gutter_rat',
    name: 'Gutter Rat',
    description:
      '+2 defense in LATE phase — accustomed to outlasting stronger opponents in grueling street fights.',
    effect: { defModLate: 2 },
    weight: 0.8,
    tier: 'Notable',
    sign: 'positive',
  },
  quick: {
    id: 'quick',
    name: 'Quick',
    description: '+1 initiative — naturally fast on the draw.',
    effect: { iniMod: 1 },
    weight: 1.0,
    tier: 'Common',
    sign: 'positive',
  },
  patient: {
    id: 'patient',
    name: 'Patient',
    description: '+2 defense in OPENING phase — sizes up the foe before committing.',
    effect: { defModEarly: 2 },
    weight: 1.0,
    tier: 'Notable',
    sign: 'positive',
  },
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    description: '+2 attack when bloodied (HP < 50%).',
    effect: { attModLowHp: 2 },
    weight: 0.7,
    tier: 'Notable',
    sign: 'positive',
  },
  stalwart: {
    id: 'stalwart',
    name: 'Stalwart',
    description: '+2 parry while still strong (HP > 75%).',
    effect: { parModHighHp: 2 },
    weight: 0.8,
    tier: 'Notable',
    sign: 'positive',
  },
  heavy_handed: {
    id: 'heavy_handed',
    name: 'Heavy-Handed',
    description: '+1 damage on every successful hit.',
    effect: { dmgBonus: 1 },
    weight: 0.7,
    tier: 'Notable',
    sign: 'positive',
  },
  disciplined: {
    id: 'disciplined',
    name: 'Disciplined',
    description: '+1 attack in LATE phase — endurance discipline pays off.',
    effect: { attModLate: 1, parMod: 1 },
    weight: 0.7,
    tier: 'Notable',
    sign: 'positive',
  },
  ironlung: {
    id: 'ironlung',
    name: 'Iron Lung',
    description: '×0.92 endurance cost — efficient breathing.',
    effect: { enduranceMult: 0.92 },
    weight: 0.6,
    tier: 'Notable',
    sign: 'positive',
  },
  bloodthirsty: {
    id: 'bloodthirsty',
    name: 'Bloodthirsty',
    description: '+0.005 to kill window — hungrier for the finish.',
    effect: { killWindowBonus: 0.005 },
    weight: 0.5,
    tier: 'Common',
    sign: 'positive',
  },
  agile: {
    id: 'agile',
    name: 'Agile',
    description: '+1 defense baseline — light on the feet.',
    effect: { defMod: 1 },
    weight: 0.9,
    tier: 'Common',
    sign: 'positive',
  },
  precise: {
    id: 'precise',
    name: 'Precise',
    description: '+1 decisiveness baseline — picks the right opening.',
    effect: { decMod: 1 },
    weight: 0.7,
    tier: 'Common',
    sign: 'positive',
  },
  comboartist: {
    id: 'comboartist',
    name: 'Combo Artist',
    description: '+1 attack when on a hit-streak (≥2 consecutive hits).',
    effect: { attModConsecutiveHits: 1 },
    weight: 0.7,
    tier: 'Common',
    sign: 'positive',
  },
  fragile: {
    id: 'fragile',
    name: 'Fragile',
    description: '−2 defense baseline — drops guard easily.',
    effect: { defMod: -2 },
    weight: 0.4,
    tier: 'Flaw',
    sign: 'negative',
  },
  slow: {
    id: 'slow',
    name: 'Slow',
    description: '−1 initiative — late on the draw.',
    effect: { iniMod: -1 },
    weight: 0.4,
    tier: 'Flaw',
    sign: 'negative',
  },
  iron_grip: {
    id: 'iron_grip',
    name: 'Iron Grip',
    description: '+1 damage, −1 initiative — sacrifices speed for a crushing hold on their weapon.',
    effect: { dmgBonus: 1, iniMod: -1 },
    weight: 0.6,
    tier: 'Notable',
    sign: 'positive',
  },
  cornered_beast: {
    id: 'cornered_beast',
    name: 'Cornered Beast',
    description: '+2 defense when bloodied (HP < 50%) — fights harder when backed into a corner.',
    effect: { defModLowHp: 2 },
    weight: 0.6,
    tier: 'Notable',
    sign: 'positive',
  },
  vengeful: {
    id: 'vengeful',
    name: 'Vengeful',
    description: '+1 damage when bloodied (HP < 50%) — pain only makes them angrier.',
    effect: { attModLowHp: 1, dmgBonus: 1 },
    weight: 0.6,
    tier: 'Notable',
    sign: 'positive',
  },
  stoic: {
    id: 'stoic',
    name: 'Stoic',
    description: '+1 defense in LATE phase — ignores mounting fatigue and pain.',
    effect: { defModLate: 1, parModLate: 1 },
    weight: 0.7,
    tier: 'Notable',
    sign: 'positive',
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
    tier: 'Exceptional',
    sign: 'positive',
  },
  disciplined_mind: {
    id: 'disciplined_mind',
    name: 'Disciplined',
    description: 'Calm and focused, waiting for the perfect moment to strike.',
    effect: { fightPlanMod: { AL: 3, OE: -1, feintTendency: 5 }, attrBonus: { DF: 1, WL: 1 } },
    weight: 1.0,
    synergy: ['cunning', 'tank'],
    tier: 'Exceptional',
    sign: 'positive',
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
    tier: 'Exceptional',
    sign: 'positive',
  },
  sturdy: {
    id: 'sturdy',
    name: 'Sturdy',
    description: 'An unbreakable wall that outlasts any opponent.',
    effect: { fightPlanMod: { AL: -3, OE: -2, killDesire: -5 }, attrBonus: { CN: 1, SZ: 1 } },
    weight: 1.0,
    synergy: ['tank'],
    antiSynergy: ['agile'],
    tier: 'Exceptional',
    sign: 'positive',
  },
  feral: {
    id: 'feral',
    name: 'Feral',
    description: 'Fights with a savage, unpredictable intensity.',
    effect: { fightPlanMod: { OE: 6, AL: -4, killDesire: 10 }, attrBonus: { ST: 1, SP: 1 } },
    weight: 0.6,
    synergy: ['brutal', 'agile'],
    antiSynergy: ['tank', 'cunning'],
    tier: 'Signature',
    sign: 'positive',
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
    tier: 'Signature',
    sign: 'positive',
  },
  calculated: {
    id: 'calculated',
    name: 'Calculated',
    description: 'Every move is a deliberate setup for a final strike.',
    effect: { fightPlanMod: { feintTendency: 8, AL: 4, OE: -3 }, attrBonus: { SP: 1, DF: 1 } },
    weight: 0.8,
    synergy: ['cunning'],
    antiSynergy: ['brutal'],
    tier: 'Exceptional',
    sign: 'positive',
  },
  resilient: {
    id: 'resilient',
    name: 'Resilient',
    description: 'Absorbs punishment that would fell a lesser warrior.',
    effect: { fightPlanMod: { AL: -2, killDesire: -8 }, attrBonus: { CN: 2 } },
    weight: 0.8,
    synergy: ['tank'],
    antiSynergy: ['agile'],
    tier: 'Exceptional',
    sign: 'positive',
  },
  evasive: {
    id: 'evasive',
    name: 'Evasive',
    description: 'A ghost on the sand, near-impossible to pin down.',
    effect: { fightPlanMod: { AL: 10, OE: -5, feintTendency: 5 }, attrBonus: { SP: 2 } },
    weight: 0.8,
    synergy: ['agile'],
    antiSynergy: ['brutal', 'tank'],
    tier: 'Signature',
    sign: 'positive',
  },
  brutal: {
    id: 'brutal',
    name: 'Brutal',
    description: 'Values raw power and crushing impact above all else.',
    effect: { fightPlanMod: { OE: 8, killDesire: 5, AL: -5 }, attrBonus: { ST: 2 } },
    weight: 0.8,
    synergy: ['brutal'],
    antiSynergy: ['cunning', 'tank'],
    tier: 'Signature',
    sign: 'positive',
  },
  // ── New Lore/Personality Traits ──

  // ── New Lore/Personality Traits ──
  silent_one: {
    id: 'silent_one',
    name: 'Silent One',
    description:
      '+1 defense, +1 decisiveness — unnervingly quiet, they waste no breath on roars or taunts.',
    effect: { defMod: 1, decMod: 1, fightPlanMod: { feintTendency: -2 } },
    weight: 0.6,
    synergy: ['cunning'],
    antiSynergy: ['brutal'],
    tier: 'Notable',
    sign: 'positive',
  },
  blood_drunk: {
    id: 'blood_drunk',
    name: 'Blood Drunk',
    description:
      '+2 attack and −2 defense when bloodied (HP < 50%) — loses all sense of self-preservation once injured.',
    effect: { attModLowHp: 2, defModLowHp: -2, fightPlanMod: { killDesire: 3 } },
    weight: 0.6,
    synergy: ['brutal', 'agile'],
    antiSynergy: ['tank'],
    tier: 'Signature',
    sign: 'positive',
  },
  paranoid: {
    id: 'paranoid',
    name: 'Paranoid',
    description:
      '+2 defense in OPENING phase, but −1 decisiveness overall — constantly expects ambushes.',
    effect: { defModEarly: 2, decMod: -1, fightPlanMod: { AL: -2 } },
    weight: 0.6,
    synergy: ['cunning'],
    tier: 'Notable',
    sign: 'positive',
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
    tier: 'Notable',
    sign: 'positive',
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
    tier: 'Exceptional',
    sign: 'positive',
  },
  shadow_step: {
    id: 'shadow_step',
    name: 'Shadow Step',
    description: '+1 defense, −1 damage — favors elusive positioning over heavy strikes.',
    effect: { defMod: 1, dmgBonus: -1 },
    weight: 0.5,
    tier: 'Common',
    sign: 'positive',
  },
  ashen_lungs: {
    id: 'ashen_lungs',
    name: 'Ashen Lungs',
    description:
      '−10% Endurance, +1 Damage — hacking coughs hide a desperate, brutal strength honed in the soot mines.',
    effect: { enduranceMult: 0.9, dmgBonus: 1 },
    weight: 0.6,
    synergy: ['brutal'],
    tier: 'Notable',
    sign: 'positive',
  },
  alley_stalker: {
    id: 'alley_stalker',
    name: 'Alley Stalker',
    description:
      '+1 Initiative, +1 Kill Window Bonus — honed senses from a life of ambushing marks in the shadowed alleys.',
    effect: { iniMod: 1, killWindowBonus: 1, fightPlanMod: { AL: 2 } },
    weight: 0.6,
    synergy: ['agile', 'cunning'],
    antiSynergy: ['tank'],
    tier: 'Notable',
    sign: 'positive',
  },
  iron_vein: {
    id: 'iron_vein',
    name: 'Iron Vein',
    description:
      '+1 Defense, +10% Endurance — raised in the deep mines, with bones hardened by labor and scarcity.',
    effect: { defMod: 1, enduranceMult: 0.9, fightPlanMod: { OE: -1 } },
    weight: 0.6,
    synergy: ['tank', 'brutal'],
    antiSynergy: ['agile'],
    tier: 'Notable',
    sign: 'positive',
  },
  gallows_humor: {
    id: 'gallows_humor',
    name: 'Gallows Humor',
    description:
      '+1 Decisiveness, +1 Defense in the LATE phase — laughs in the face of exhaustion and death.',
    effect: { decMod: 1, defModLate: 1 },
    weight: 0.5,
    synergy: ['tank'],
    tier: 'Notable',
    sign: 'positive',
  },
  chaos_touched: {
    id: 'chaos_touched',
    name: 'Chaos Touched',
    description:
      'Touched by strange forces, their strikes grow stronger and wilder as the fight drags on.',
    effect: { dmgBonus: 1, attModLate: 1 },
    weight: 0.1,
    tier: 'Exceptional',
    sign: 'positive',
  },
};

// Merge bulk data modules.
import { NEW_FLAWS } from '@/engine/traitData/flaws';
import { CLASS_TRAITS } from '@/engine/traitData/classTraits';
Object.assign(TRAITS, NEW_FLAWS);
Object.assign(TRAITS, CLASS_TRAITS);
