import { describe, it, expect } from 'vitest';
import { generateTraits, TRAITS, getStaticTraitMods } from '@/engine/traits';
import { SeededRNGService } from '@/utils/random';
import type { Warrior } from '@/types/warrior.types';

const TRAIT_IDS = Object.keys(TRAITS);

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

describe('trait generation determinism characterization', () => {
  it('same seed produces identical trait arrays', () => {
    for (const seed of SEEDS) {
      const rng1 = new SeededRNGService(seed);
      const rng2 = new SeededRNGService(seed);
      const traits1 = generateTraits(rng1);
      const traits2 = generateTraits(rng2);
      expect(traits1, `seed ${seed} diverged`).toEqual(traits2);
    }
  });

  it('generated traits are valid TRAIT_IDS', () => {
    for (const seed of SEEDS) {
      const rng = new SeededRNGService(seed);
      const traits = generateTraits(rng);
      for (const traitId of traits) {
        expect(TRAITS[traitId], `seed ${seed} generated unknown trait ${traitId}`).toBeDefined();
        expect(TRAIT_IDS.includes(traitId), `seed ${seed} trait ${traitId} not in TRAIT_IDS`).toBe(true);
      }
    }
  });

  it('generated traits have correct tier/sign consistency', () => {
    for (const seed of SEEDS) {
      const rng = new SeededRNGService(seed);
      const traits = generateTraits(rng);
      for (const traitId of traits) {
        const t = TRAITS[traitId];
        if (!t) continue;
        if (t.tier === 'Flaw') {
          expect(t.sign, `flaw ${traitId} should be negative`).toBe('negative');
        } else {
          expect(t.sign, `non-flaw ${traitId} should be positive`).toBe('positive');
        }
      }
    }
  });

  it('getStaticTraitMods produces stable output for same warrior', () => {
    for (const seed of SEEDS) {
      const rng = new SeededRNGService(seed);
      const traits = generateTraits(rng);
      const warrior = { traits } as unknown as Warrior;

      const mods1 = getStaticTraitMods(warrior);
      const mods2 = getStaticTraitMods(warrior);

      expect(mods1, `seed ${seed} static mods diverged`).toEqual(mods2);
    }
  });

  it('getStaticTraitMods returns zero mods for empty traits', () => {
    const warrior = { traits: [] } as unknown as Warrior;
    const mods = getStaticTraitMods(warrior);
    expect(mods.attMod).toBe(0);
    expect(mods.parMod).toBe(0);
    expect(mods.defMod).toBe(0);
    expect(mods.iniMod).toBe(0);
    expect(mods.ripMod).toBe(0);
    expect(mods.decMod).toBe(0);
    expect(mods.dmgBonus).toBe(0);
    expect(mods.enduranceMult).toBe(1.0);
  });

  it('getStaticTraitMods returns zero mods for undefined warrior', () => {
    const mods = getStaticTraitMods(undefined);
    expect(mods.attMod).toBe(0);
    expect(mods.enduranceMult).toBe(1.0);
  });

  it('trait generation produces 0 or 1 traits', () => {
    for (const seed of SEEDS) {
      const rng = new SeededRNGService(seed);
      const traits = generateTraits(rng);
      expect(traits.length, `seed ${seed} produced ${traits.length} traits`).toBeLessThanOrEqual(1);
    }
  });

  it('TRAITS dictionary has no undefined entries', () => {
    for (const id of TRAIT_IDS) {
      expect(TRAITS[id], `TRAIT_IDS contains ${id} but TRAITS entry is undefined`).toBeDefined();
    }
  });
});
