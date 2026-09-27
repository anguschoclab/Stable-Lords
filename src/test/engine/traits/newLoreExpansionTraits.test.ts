/**
 * New lore expansion traits — verifies the 3 new traits from PR #751
 * (silent_stalker, gutters_edge, feral_endurance) are correctly defined
 * with proper static and dynamic modifiers.
 */
import { describe, it, expect } from 'vitest';
import { TRAITS, getStaticTraitMods, getDynamicTraitMods } from '@/engine/traits';
import type { Warrior } from '@/types/warrior.types';
import { type WarriorId } from '@/types/shared.types';
import { makeWarrior as fixtureWarrior } from '@/test/_fixtures/factories';

const makeWarriorWithTrait = (traitId: string): Warrior =>
  fixtureWarrior({
    id: `w_${traitId}` as WarriorId,
    name: `Test-${traitId}`,
    style: 'StrikingAttack' as any,
    attributes: { ST: 10, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 100,
    traits: [traitId],
    derivedStats: { hp: 100 } as any,
  });

describe('new lore expansion traits exist', () => {
  it('silent_stalker is defined', () => {
    expect(TRAITS.silent_stalker).toBeDefined();
    expect(TRAITS.silent_stalker!.tier).toBeTruthy();
    expect(TRAITS.silent_stalker!.sign).toBeTruthy();
  });

  it('gutters_edge is defined', () => {
    expect(TRAITS.gutters_edge).toBeDefined();
    expect(TRAITS.gutters_edge!.tier).toBeTruthy();
    expect(TRAITS.gutters_edge!.sign).toBeTruthy();
  });

  it('feral_endurance is defined', () => {
    expect(TRAITS.feral_endurance).toBeDefined();
    expect(TRAITS.feral_endurance!.tier).toBeTruthy();
    expect(TRAITS.feral_endurance!.sign).toBeTruthy();
  });
});

describe('new lore expansion traits static mods', () => {
  it('silent_stalker applies modifiers via getDynamicTraitMods in OPENING phase', () => {
    expect(TRAITS.silent_stalker).toBeTruthy();
    const warrior = makeWarriorWithTrait('silent_stalker');
    const ctx = { phase: 'OPENING' as const, hpRatio: 1.0, endRatio: 1.0, consecutiveHits: 0 };
    const mods = getDynamicTraitMods(warrior, ctx);
    const baseMods = getDynamicTraitMods({ ...warrior, traits: [] }, ctx);

    // silent_stalker has iniModEarly: 1, which is a dynamic mod applied in OPENING phase
    expect(mods.iniMod).toBe(baseMods.iniMod + 1);
  });

  it('gutters_edge applies static modifiers via getStaticTraitMods', () => {
    expect(TRAITS.gutters_edge).toBeTruthy();
    const warrior = makeWarriorWithTrait('gutters_edge');
    const mods = getStaticTraitMods(warrior);
    const baseMods = getStaticTraitMods({ ...warrior, traits: [] });

    const anyDiff =
      mods.attMod !== baseMods.attMod ||
      mods.parMod !== baseMods.parMod ||
      mods.defMod !== baseMods.defMod ||
      mods.iniMod !== baseMods.iniMod ||
      mods.ripMod !== baseMods.ripMod ||
      mods.decMod !== baseMods.decMod ||
      mods.dmgBonus !== baseMods.dmgBonus ||
      mods.enduranceMult !== baseMods.enduranceMult;
    expect(anyDiff).toBe(true);
  });

  it('feral_endurance applies static modifiers via getStaticTraitMods', () => {
    expect(TRAITS.feral_endurance).toBeTruthy();
    const warrior = makeWarriorWithTrait('feral_endurance');
    const mods = getStaticTraitMods(warrior);
    const baseMods = getStaticTraitMods({ ...warrior, traits: [] });

    const anyDiff =
      mods.attMod !== baseMods.attMod ||
      mods.parMod !== baseMods.parMod ||
      mods.defMod !== baseMods.defMod ||
      mods.iniMod !== baseMods.iniMod ||
      mods.ripMod !== baseMods.ripMod ||
      mods.decMod !== baseMods.decMod ||
      mods.dmgBonus !== baseMods.dmgBonus ||
      mods.enduranceMult !== baseMods.enduranceMult;
    expect(anyDiff).toBe(true);
  });
});

describe('new lore expansion traits dynamic mods', () => {
  it('silent_stalker applies dynamic modifiers in correct phase', () => {
    expect(TRAITS.silent_stalker).toBeTruthy();
    const warrior = makeWarriorWithTrait('silent_stalker');
    const ctx = { phase: 'OPENING' as const, hpRatio: 1.0, endRatio: 1.0, consecutiveHits: 0 };
    const mods = getDynamicTraitMods(warrior, ctx);
    const baseMods = getDynamicTraitMods({ ...warrior, traits: [] }, ctx);

    // Check if any dynamic mod differs
    const anyDiff =
      mods.attMod !== baseMods.attMod ||
      mods.parMod !== baseMods.parMod ||
      mods.defMod !== baseMods.defMod ||
      mods.iniMod !== baseMods.iniMod ||
      mods.killWindowBonus !== baseMods.killWindowBonus;
    expect(anyDiff).toBe(true);
  });

  it('gutters_edge applies dynamic modifiers', () => {
    expect(TRAITS.gutters_edge).toBeTruthy();
    const warrior = makeWarriorWithTrait('gutters_edge');

    // defModEarly (-1) fires in OPENING — a diff must appear in some context
    let found = false;
    for (const phase of ['OPENING', 'MID', 'LATE'] as const) {
      for (const hpRatio of [1.0, 0.4, 0.1]) {
        const ctx = { phase, hpRatio, endRatio: 1.0, consecutiveHits: 0 };
        const mods = getDynamicTraitMods(warrior, ctx);
        const baseMods = getDynamicTraitMods({ ...warrior, traits: [] }, ctx);
        const anyDiff =
          mods.attMod !== baseMods.attMod ||
          mods.parMod !== baseMods.parMod ||
          mods.defMod !== baseMods.defMod ||
          mods.iniMod !== baseMods.iniMod;
        if (anyDiff) {
          found = true;
          break;
        }
      }
    }
    expect(found).toBe(true);
  });

  it('feral_endurance has no dynamic mods (enduranceMult is drain-side, not exchange-side)', () => {
    expect(TRAITS.feral_endurance).toBeTruthy();
    const warrior = makeWarriorWithTrait('feral_endurance');

    // enduranceMult reduces endurance drain — it is intentionally absent from
    // DynamicTraitMods, so mods must equal the traitless baseline everywhere.
    for (const phase of ['OPENING', 'MID', 'LATE'] as const) {
      for (const endRatio of [1.0, 0.5, 0.1]) {
        const ctx = { phase, hpRatio: 1.0, endRatio, consecutiveHits: 0 };
        const mods = getDynamicTraitMods(warrior, ctx);
        const baseMods = getDynamicTraitMods({ ...warrior, traits: [] }, ctx);
        expect(mods).toEqual(baseMods);
      }
    }
  });
});

describe('new lore expansion traits iniModEarly handling', () => {
  it('iniModEarly is correctly applied in OPENING phase', () => {
    // Find any trait with iniModEarly effect — at least one must exist
    let found = false;
    for (const [id, trait] of Object.entries(TRAITS)) {
      if (trait.effect.iniModEarly != null) {
        found = true;
        const warrior = makeWarriorWithTrait(id);
        const ctx = { phase: 'OPENING' as const, hpRatio: 1.0, endRatio: 1.0, consecutiveHits: 0 };
        const mods = getDynamicTraitMods(warrior, ctx);
        const baseMods = getDynamicTraitMods({ ...warrior, traits: [] }, ctx);
        expect(mods.iniMod).toBe(baseMods.iniMod + trait.effect.iniModEarly);
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('iniModEarly is NOT applied in MID or LATE phase', () => {
    let found = false;
    for (const [id, trait] of Object.entries(TRAITS)) {
      if (trait.effect.iniModEarly != null) {
        found = true;
        const warrior = makeWarriorWithTrait(id);
        const ctx = { phase: 'MID' as const, hpRatio: 1.0, endRatio: 1.0, consecutiveHits: 0 };
        const mods = getDynamicTraitMods(warrior, ctx);
        const baseMods = getDynamicTraitMods({ ...warrior, traits: [] }, ctx);
        expect(mods.iniMod).toBe(baseMods.iniMod);
        break;
      }
    }
    expect(found).toBe(true);
  });
});
