/**
 * Shared flat mock for @/data/orphanPool — the canonical TRAIT_DATA block
 * (superset of the per-spec trait sets; specs may override with extra keys).
 */
export const TRAIT_DATA = {
  test_trait: {
    name: 'Test Trait',
    description: 'A test trait',
    effect: {},
  },
  with_fight_plan: {
    name: 'Fight Plan Trait',
    description: 'A fight-plan trait',
    effect: { fightPlanMod: { OE: 5, AL: 3, killDesire: 2, feintTendency: 1 } },
  },
  with_static_mods: {
    name: 'Static Mods Trait',
    description: 'A static-mods trait',
    effect: { attMod: 1, defMod: -1, iniMod: 2, parMod: 1, dmgBonus: 1 },
  },
  with_empty_effect: {
    name: 'Empty Effect Trait',
    description: 'An empty-effect trait',
    effect: {},
  },
};
