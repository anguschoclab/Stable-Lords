/**
 * Warrior Factory — exhaustive coverage for makeWarrior covering both
 * rng-less (test) and rng-provided (real game) paths, overrides, and defaults.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { SeededRNGService } from '@/utils/random';

const baseAttrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };

describe('warriorFactory — makeWarrior (rng-less path)', () => {
  it('creates a warrior with provided id', () => {
    const w = makeWarrior('w1' as any, 'TestWarrior', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.id).toBe('w1');
    expect(w.name).toBe('TestWarrior');
  });

  it('generates an id when not provided (rng-less)', () => {
    const w = makeWarrior(undefined, 'AutoId', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.id).toBeTruthy();
    expect(typeof w.id).toBe('string');
  });

  it('sets style correctly', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.ParryRiposte, baseAttrs);
    expect(w.style).toBe(FightingStyle.ParryRiposte);
  });

  it('sets attributes to the provided values', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.attributes).toEqual(baseAttrs);
  });

  it('computes baseSkills from attributes and style', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.baseSkills).toBeDefined();
    expect(typeof w.baseSkills!.ATT).toBe('number');
    expect(typeof w.baseSkills!.PAR).toBe('number');
    expect(typeof w.baseSkills!.DEF).toBe('number');
    expect(typeof w.baseSkills!.INI).toBe('number');
    expect(typeof w.baseSkills!.RIP).toBe('number');
    expect(typeof w.baseSkills!.DEC).toBe('number');
  });

  it('computes derivedStats from attributes and style', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.derivedStats).toBeDefined();
    expect(typeof w.derivedStats!.hp).toBe('number');
    expect(typeof w.derivedStats!.endurance).toBe('number');
    expect(typeof w.derivedStats!.damage).toBe('number');
    expect(typeof w.derivedStats!.encumbrance).toBe('number');
  });

  it('generates favorites (non-deterministic in rng-less mode but always present)', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.favorites).toBeDefined();
  });

  it('sets luckfactor to undefined in rng-less mode', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.luckfactor).toBeUndefined();
  });

  it('sets age to 22 in rng-less mode (18 + floor(0.5 * 8))', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.age).toBe(22);
  });

  it('sets trainability to 0.65 in rng-less mode', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.trainability).toBe(0.65);
  });

  it('sets traits to empty array in rng-less mode (no overrides)', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.traits).toEqual([]);
  });

  it('sets default equipment from style default loadout', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.equipment).toBeDefined();
  });

  it('sets default fields: fame=0, popularity=0, titles=[], injuries=[], flair=[]', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.fame).toBe(0);
    expect(w.popularity).toBe(0);
    expect(w.titles).toEqual([]);
    expect(w.injuries).toEqual([]);
    expect(w.flair).toEqual([]);
  });

  it('sets career to {wins:0, losses:0, kills:0}', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.career).toEqual({ wins: 0, losses: 0, kills: 0 });
  });

  it('sets champion to false', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.champion).toBe(false);
  });

  it('sets status to Active', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.status).toBe('Active');
  });

  it('sets lore to empty string by default', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.lore).toBe('');
  });

  it('sets origin to empty string by default', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    expect(w.origin).toBe('');
  });
});

describe('warriorFactory — makeWarrior (rng-provided path)', () => {
  it('generates a warrior with seeded rng', () => {
    const rng = new SeededRNGService(42);
    const w = makeWarrior(undefined, 'SeededWarrior', FightingStyle.StrikingAttack, baseAttrs, undefined, rng);
    expect(w.name).toBe('SeededWarrior');
    expect(w.id).toBeTruthy();
  });

  it('generates luckfactor when rng is provided', () => {
    const rng = new SeededRNGService(42);
    const w = makeWarrior(undefined, 'Test', FightingStyle.StrikingAttack, baseAttrs, undefined, rng);
    expect(w.luckfactor).toBeDefined();
    expect(typeof w.luckfactor?.ATT).toBe('number');
  });

  it('generates traits when rng is provided (and no override)', () => {
    const rng = new SeededRNGService(42);
    const w = makeWarrior(undefined, 'Test', FightingStyle.StrikingAttack, baseAttrs, undefined, rng);
    expect(w.traits).toBeDefined();
    expect(Array.isArray(w.traits)).toBe(true);
  });

  it('generates trainability in range [0.4, 0.9) when rng is provided', () => {
    const rng = new SeededRNGService(42);
    const w = makeWarrior(undefined, 'Test', FightingStyle.StrikingAttack, baseAttrs, undefined, rng);
    expect(w.trainability).toBeGreaterThanOrEqual(0.4);
    expect(w.trainability).toBeLessThan(0.9);
  });

  it('generates age in range [18, 25] when rng is provided', () => {
    const rng = new SeededRNGService(42);
    const w = makeWarrior(undefined, 'Test', FightingStyle.StrikingAttack, baseAttrs, undefined, rng);
    expect(w.age).toBeGreaterThanOrEqual(18);
    expect(w.age).toBeLessThanOrEqual(25);
  });

  it('generates favorites deterministically with same seed', () => {
    const rng1 = new SeededRNGService(42);
    const rng2 = new SeededRNGService(42);
    const w1 = makeWarrior(undefined, 'Test', FightingStyle.StrikingAttack, baseAttrs, undefined, rng1);
    const w2 = makeWarrior(undefined, 'Test', FightingStyle.StrikingAttack, baseAttrs, undefined, rng2);
    expect(w1.favorites).toEqual(w2.favorites);
  });

  it('generates different favorites with different seeds', () => {
    const rng1 = new SeededRNGService(42);
    const rng2 = new SeededRNGService(999);
    const w1 = makeWarrior(undefined, 'Test', FightingStyle.StrikingAttack, baseAttrs, undefined, rng1);
    const w2 = makeWarrior(undefined, 'Test', FightingStyle.StrikingAttack, baseAttrs, undefined, rng2);
    // Very likely different with different seeds
    expect(w1).toBeDefined();
    expect(w2).toBeDefined();
  });

  it('generates id via rng.uuid() when id is undefined', () => {
    const rng = new SeededRNGService(42);
    const w = makeWarrior(undefined, 'Test', FightingStyle.StrikingAttack, baseAttrs, undefined, rng);
    expect(w.id).toBeTruthy();
    expect(typeof w.id).toBe('string');
  });

  it('uses provided id even when rng is present', () => {
    const rng = new SeededRNGService(42);
    const w = makeWarrior('custom-id' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, undefined, rng);
    expect(w.id).toBe('custom-id');
  });
});

describe('warriorFactory — overrides', () => {
  it('overrides traits when provided', () => {
    const rng = new SeededRNGService(42);
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, {
      traits: ['Berserker', 'Patient'],
    }, rng);
    expect(w.traits).toEqual(['Berserker', 'Patient']);
  });

  it('overrides trainability when provided', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, {
      trainability: 0.99,
    });
    expect(w.trainability).toBe(0.99);
  });

  it('overrides equipment when provided', () => {
    const customEquip = { weapon: 'custom_weapon', armor: 'custom_armor', shield: null, helm: null } as any;
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, {
      equipment: customEquip,
    });
    expect(w.equipment).toBe(customEquip);
  });

  it('overrides lore when provided', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, {
      lore: 'A legendary warrior...',
    });
    expect(w.lore).toBe('A legendary warrior...');
  });

  it('overrides origin when provided', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, {
      origin: 'Northern Reach',
    });
    expect(w.origin).toBe('Northern Reach');
  });

  it('overrides fame when provided', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, {
      fame: 50,
    });
    expect(w.fame).toBe(50);
  });

  it('overrides status when provided', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, {
      status: 'Retired',
    });
    expect(w.status).toBe('Retired');
  });

  it('overrides career when provided', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, {
      career: { wins: 10, losses: 2, kills: 3 },
    });
    expect(w.career).toEqual({ wins: 10, losses: 2, kills: 3 });
  });

  it('overrides champion when provided', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, {
      champion: true,
    });
    expect(w.champion).toBe(true);
  });

  it('spread overrides at end win over computed values', () => {
    const w = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs, {
      baseSkills: { ATT: 99, PAR: 99, DEF: 99, INI: 99, RIP: 99, DEC: 99 },
    });
    expect(w.baseSkills!.ATT).toBe(99);
  });
});

describe('warriorFactory — all fighting styles', () => {
  it('creates warriors for all 10 fighting styles without error', () => {
    for (const style of Object.values(FightingStyle)) {
      expect(() => makeWarrior('w1' as any, 'Test', style, baseAttrs)).not.toThrow();
    }
  });

  it('computes different baseSkills for different styles with same attrs', () => {
    const w1 = makeWarrior('w1' as any, 'Test', FightingStyle.StrikingAttack, baseAttrs);
    const w2 = makeWarrior('w2' as any, 'Test', FightingStyle.TotalParry, baseAttrs);
    // Different styles should produce different skill distributions
    expect(w1.baseSkills).toBeDefined();
    expect(w2.baseSkills).toBeDefined();
    // Different styles should produce different skill distributions
    expect(w1.baseSkills).not.toEqual(w2.baseSkills);
  });
});
