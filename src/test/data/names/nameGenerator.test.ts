/**
 * Procedural warrior name generator — determinism, format invariants,
 * uniqueness handling, culture influence, and dynastic naming.
 */
import { describe, it, expect } from 'vitest';
import { SeededRNGService } from '@/utils/random';
import { generateWarriorName, generateDynasticWarriorName } from '@/data/names/nameGenerator';
import {
  CULTURE_SEEDS,
  cultureForOwner,
  cultureForArchetype,
  type NamingCulture,
} from '@/data/names/cultures';
import { OWNER_PERSONALITIES } from '@/types/enumSources';

const NAME_RE = /^[A-Z][A-Z '-]{1,19}$/;

describe('cultureForOwner', () => {
  it('maps every owner personality to a culture', () => {
    for (const p of OWNER_PERSONALITIES) {
      expect(CULTURE_SEEDS[cultureForOwner(p)], `no culture for ${p}`).toBeDefined();
    }
  });

  it('aggressive stables use norse-flavored names (design bible)', () => {
    expect(cultureForOwner('Aggressive')).toBe('norse');
  });

  it('methodical/defensive stables use latin-flavored names (design bible)', () => {
    expect(cultureForOwner('Methodical')).toBe('latin');
    expect(cultureForOwner(undefined, 'Iron Defense')).toBe('latin');
  });

  it('falls back to common when nothing is known', () => {
    expect(cultureForOwner()).toBe('common');
    expect(cultureForOwner(undefined, undefined)).toBe('common');
  });
});

describe('cultureForArchetype', () => {
  it.each([
    ['brutal', 'norse'],
    ['tank', 'latin'],
    ['agile', 'exotic'],
    ['cunning', 'shadow'],
  ] as const)('maps %s → %s', (archetype, culture) => {
    expect(cultureForArchetype(archetype)).toBe(culture);
  });
});

describe('generateWarriorName', () => {
  it('is deterministic for a seeded rng', () => {
    const a = generateWarriorName({ rng: new SeededRNGService(42) });
    const b = generateWarriorName({ rng: new SeededRNGService(42) });
    expect(a).toBe(b);
  });

  it('produces uppercase arena-format names (2-20 chars, no " vs ")', () => {
    const rng = new SeededRNGService(7);
    for (let i = 0; i < 500; i++) {
      const name = generateWarriorName({ rng });
      expect(name, `bad format: ${name}`).toMatch(NAME_RE);
      expect(name.includes(' vs '), `contains " vs ": ${name}`).toBe(false);
    }
  });

  it('honors usedNames and never returns an in-use name', () => {
    const rng = new SeededRNGService(99);
    const usedNames = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const name = generateWarriorName({ rng, usedNames });
      expect(usedNames.has(name), `collision: ${name}`).toBe(false);
      usedNames.add(name);
    }
    expect(usedNames.size).toBe(200);
  });

  it('still returns a name when the candidate space is exhausted', () => {
    const rng = new SeededRNGService(1);
    // Exhaust the entire common seed pool so every seed draw collides.
    const usedNames = new Set<string>([...CULTURE_SEEDS.common]);
    const name = generateWarriorName({ rng, usedNames, culture: 'common' });
    expect(name.length).toBeGreaterThanOrEqual(2);
    expect(usedNames.has(name)).toBe(false);
  });

  it('culture influences output — norse draws hit norse seeds/affixes', () => {
    const rng = new SeededRNGService(11);
    const norseish = (n: string) =>
      CULTURE_SEEDS.norse.includes(n) || /SON|GAR|RIK|HEIM|BJORN|ULF/.test(n);
    let hits = 0;
    const N = 500;
    for (let i = 0; i < N; i++) {
      if (norseish(generateWarriorName({ rng, culture: 'norse' }))) hits++;
    }
    expect(hits / N, `only ${hits}/${N} norse-flavored`).toBeGreaterThan(0.3);
  });

  it('seedPool vocabulary is drawn from (stable theme preservation)', () => {
    const rng = new SeededRNGService(5);
    const seedPool = ['PIKE', 'AEGIS', 'MONOLITH', 'PHALANX'];
    let seeded = 0;
    for (let i = 0; i < 200; i++) {
      if (seedPool.includes(generateWarriorName({ rng, culture: 'latin', seedPool }))) seeded++;
    }
    expect(seeded, 'seedPool never drawn').toBeGreaterThan(0);
  });

  it('weighted cultures draw from both inventories', () => {
    const rng = new SeededRNGService(21);
    const seen = new Set<string>();
    const spec = [
      { culture: 'norse' as NamingCulture, weight: 0.5 },
      { culture: 'latin' as NamingCulture, weight: 0.5 },
    ];
    for (let i = 0; i < 300; i++) seen.add(generateWarriorName({ rng, culture: spec }));
    const norseHits = [...seen].filter((n) => CULTURE_SEEDS.norse.includes(n)).length;
    const latinHits = [...seen].filter((n) => CULTURE_SEEDS.latin.includes(n)).length;
    expect(norseHits, 'norse seeds never drawn').toBeGreaterThan(0);
    expect(latinHits, 'latin seeds never drawn').toBeGreaterThan(0);
  });
});

describe('generateDynasticWarriorName', () => {
  it('derives a successor name referencing the parent', () => {
    const rng = new SeededRNGService(3);
    const forms = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const n = generateDynasticWarriorName('KRAGOS', { rng });
      expect(n.toUpperCase()).toBe(n);
      forms.add(n);
    }
    // Multiple dynastic forms exist, all referencing the parent
    expect(forms.size).toBeGreaterThan(1);
    for (const n of forms) {
      expect(/KRAG/i.test(n) || /II|III|IV|V|SON|Younger|Heir|of KRAGOS/i.test(n)).toBe(true);
    }
  });

  it('respects usedNames', () => {
    const rng = new SeededRNGService(3);
    const usedNames = new Set<string>(['KRAGOS II']);
    for (let i = 0; i < 40; i++) {
      const n = generateDynasticWarriorName('KRAGOS', { rng, usedNames });
      expect(usedNames.has(n)).toBe(false);
      usedNames.add(n);
    }
  });
});
