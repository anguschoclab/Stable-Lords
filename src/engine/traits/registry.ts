/**
 * TRAITS registry — assembled from the tier shards. Spread order preserves
 * the former bottom-of-file Object.assign merge (flaw pool, then
 * class-restricted traits win on key collisions), and LEGACY_TRAIT_ORDER
 * restores the pre-split key enumeration order (which is observable via
 * seeded trait picks).
 */
import type { TraitDef } from './types';
import { COMMON_TRAITS } from './defs/common';
import { NOTABLE_TRAITS } from './defs/notable';
import { EXCEPTIONAL_TRAITS } from './defs/exceptional';
import { SIGNATURE_TRAITS } from './defs/signature';
import { FLAWS_TRAITS } from './defs/flaws';
import { CLASS_TRAITS } from './defs/classTraits';

/**
 * Trait ids in their pre-split enumeration order. Object key order of TRAITS
 * is observable — generation picks `Object.keys(TRAITS)[rng()]` — so the
 * merged record must enumerate exactly like the old traitDefs.ts literal
 * (literal keys, then NEW_FLAWS, then CLASS_TRAITS via Object.assign).
 */
const LEGACY_TRAIT_ORDER = [
  'survivalist',
  'orphan_street_rat',
  'orphan_pit_fighter',
  'orphan_survivor',
  'iron_orphan',
  'orphan_resilience',
  'hollow_gaze',
  'scab_survivor',
  'gutter_shadow',
  'guttersnipe_cunning',
  'iron_stomach',
  'ashen_lung',
  'wild_instinct',
  'shadow_watcher',
  'knife_juggler',
  'stone_skin_orphan',
  'starving_dog',
  'iron_knuckles',
  'jumpy',
  'gutter_ghost',
  'workhouse_resilience',
  'silent_stalker',
  'gutters_edge',
  'feral_endurance',
  'orphan_vengeance',
  'orphan_fragility',
  'orphan_blood',
  'shadow_walker',
  'orphan_instinct',
  'born_in_shadows',
  'orphan_shadow',
  'gutter_phantom',
  'gutter_born',
  'beast_blood',
  'rusted_resolve',
  'spore_kissed',
  'cornered_rat',
  'orphan_fury',
  'asylum_survivor',
  'asylum_born',
  'street_rat_cunning',
  'street_scrapper',
  'gutter_cunning',
  'gutter_blood',
  'clutch_survivor',
  'adrenaline_surge',
  'feral_instinct',
  'gutter_rat',
  'quick',
  'patient',
  'berserker',
  'stalwart',
  'heavy_handed',
  'disciplined',
  'ironlung',
  'bloodthirsty',
  'agile',
  'precise',
  'comboartist',
  'fragile',
  'slow',
  'iron_grip',
  'cornered_beast',
  'vengeful',
  'stoic',
  'aggressive',
  'disciplined_mind',
  'cunning',
  'sturdy',
  'feral',
  'merciless',
  'calculated',
  'resilient',
  'evasive',
  'brutal',
  'silent_one',
  'blood_drunk',
  'paranoid',
  'cold_eyed',
  'death_marked',
  'shadow_step',
  'ashen_lungs',
  'alley_stalker',
  'iron_vein',
  'gallows_humor',
  'chaos_touched',
  'pit_fighter',
  'gut_instinct',
  'gallows_born',
  'orphan_resilience_two',
  'abyssal_survivor',
  'rust_blooded',
  'glass_jaw',
  'hesitant',
  'short_winded',
  'timid',
  'predictable',
  'brittle',
  'coward',
  'clumsy',
  'thin_skinned',
  'steady_hand',
  'called_shot',
  'dead_aim',
  'assassin',
  'heavy_swing',
  'relentless',
  'bonebreaker',
  'juggernaut',
  'demolisher',
  'quickdraw',
  'fleet_footed',
  'lightning_step',
  'blitz',
  'untouchable',
  'counterlunge',
  'fighting_rhythm',
  'riposte_flow',
  'duelist',
  'whirlwind',
  'riposte_natural',
  'vindicator',
  'parry_master',
  'nemesis',
  'retribution',
  'counterpuncher',
  'opportunist',
  'riposte_strike',
  'counter_artist',
  'perfect_counter',
  'keen_edge',
  'flurry',
  'lacerate',
  'hemorrhage',
  'exsanguinate',
  'crushing_blow',
  'opener',
  'executioner',
  'berserker_rush',
  'annihilator',
  'enduring',
  'stonewall',
  'war_of_attrition',
  'immovable_object',
  'unbreakable',
  'braced',
  'bulwark',
  'anchor',
  'fortress',
  'living_wall',
  'gutter_wraith',
  'orphan_scavenger',
  'orphan_vengeance_seeker',
  'orphan_of_the_abyss',
];

const MERGED: Record<string, TraitDef> = {
  ...COMMON_TRAITS,
  ...NOTABLE_TRAITS,
  ...EXCEPTIONAL_TRAITS,
  ...SIGNATURE_TRAITS,
  ...FLAWS_TRAITS,
  ...CLASS_TRAITS,
};

const mergedKeys = new Set(Object.keys(MERGED));
if (
  mergedKeys.size !== LEGACY_TRAIT_ORDER.length ||
  LEGACY_TRAIT_ORDER.some((id) => !mergedKeys.has(id))
) {
  throw new Error(
    'TRAITS registry drifted from LEGACY_TRAIT_ORDER — update the order list when adding/removing traits'
  );
}

export const TRAITS: Record<string, TraitDef> = Object.fromEntries(
  LEGACY_TRAIT_ORDER.map((id) => [id, MERGED[id] as TraitDef])
);
