import { describe, it, expect } from 'vitest';
import { TRAITS } from '@/engine/traits';

/**
 * V20 trait-registry guards (PR #1068).
 *
 * Parked specs encode the post-merge end-state and un-skip when the
 * narrative-lore-traits branch lands. Each spec asserts the effect fields
 * exactly as shipped in the PR — a silent effect-key typo (which would
 * produce a dead trait, since unknown keys are ignored by mods.ts) fails
 * loudly here.
 */
describe('MEGAPLAN-V5: V20 narrative traits (PR #1068)', () => {
  it('dark_survivor is registered Notable/positive with its curated effect (MEGAPLAN-V5)', () => {
    const t = TRAITS['dark_survivor'];
    expect(t, 'dark_survivor missing from TRAITS').toBeDefined();
    expect(t!.tier).toBe('Notable');
    expect(t!.sign).toBe('positive');
    expect(t!.effect.defModEarly).toBe(2);
    expect(t!.effect.iniModEarly).toBe(1);
    expect(t!.effect.fightPlanMod).toEqual({ AL: 2 });
    expect(t!.weight).toBe(0.5);
  });

  it('gutter_brawler is registered Notable/positive with its curated effect (MEGAPLAN-V5)', () => {
    const t = TRAITS['gutter_brawler'];
    expect(t, 'gutter_brawler missing from TRAITS').toBeDefined();
    expect(t!.tier).toBe('Notable');
    expect(t!.sign).toBe('positive');
    expect(t!.effect.unarmedDmgBonus).toBe(2);
    expect(t!.effect.attModLowHp).toBe(1);
    expect(t!.effect.fightPlanMod).toEqual({ killDesire: 1 });
    expect(t!.weight).toBe(0.5);
  });

  it('street_specter is registered Notable/positive with its curated effect (MEGAPLAN-V5)', () => {
    const t = TRAITS['street_specter'];
    expect(t, 'street_specter missing from TRAITS').toBeDefined();
    expect(t!.tier).toBe('Notable');
    expect(t!.sign).toBe('positive');
    expect(t!.effect.killWindowBonus).toBe(0.01);
    expect(t!.effect.decMod).toBe(1);
    expect(t!.effect.fightPlanMod).toEqual({ feintTendency: 2 });
    expect(t!.weight).toBe(0.5);
  });

  it('the three V20 traits follow ash_choked_fury in registry order (MEGAPLAN-V5)', () => {
    // registry.ts derives TRAITS key order from LEGACY_TRAIT_ORDER and
    // throws at import on drift — ordering assertion guards the tail slot.
    const keys = Object.keys(TRAITS);
    const i = keys.indexOf('ash_choked_fury');
    expect(keys.slice(i + 1, i + 4)).toEqual([
      'dark_survivor',
      'gutter_brawler',
      'street_specter',
    ]);
  });
});
