/**
 * narrativeContent.json — verifies no duplicate entries, valid min values,
 * and correct structure for expanded content.
 */
import { describe, it, expect } from 'vitest';
import narrativeContent from '@/data/narrativeContent.json';

function collectEntries(
  obj: any,
  path: string = ''
): { text: string; min: number; path: string }[] {
  const entries: { text: string; min: number; path: string }[] = [];

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === 'object' && 'text' in item && 'min' in item) {
        entries.push({ text: item.text, min: item.min, path });
      } else if (item && typeof item === 'object') {
        entries.push(...collectEntries(item, path));
      }
    }
  } else if (obj && typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      entries.push(...collectEntries(val, `${path}.${key}`));
    }
  }

  return entries;
}

describe('narrativeContent.json', () => {
  it('has no duplicate text entries within the same path', () => {
    const entries = collectEntries(narrativeContent);
    const byPath = new Map<string, Set<string>>();

    for (const entry of entries) {
      if (!byPath.has(entry.path)) {
        byPath.set(entry.path, new Set());
      }
      const set = byPath.get(entry.path)!;
      if (set.has(entry.text)) {
        throw new Error(`Duplicate text "${entry.text}" found at ${entry.path}`);
      }
      set.add(entry.text);
    }

    expect(entries.length).toBeGreaterThan(0);
  });

  it('all min values are non-negative integers', () => {
    const entries = collectEntries(narrativeContent);
    for (const entry of entries) {
      expect(entry.min).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(entry.min)).toBe(true);
    }
  });

  it('all entries have required fields (text and min)', () => {
    const entries = collectEntries(narrativeContent);
    for (const entry of entries) {
      expect(entry.text).toBeDefined();
      expect(typeof entry.text).toBe('string');
      expect(entry.text.length).toBeGreaterThan(0);
      expect(entry.min).toBeDefined();
      expect(typeof entry.min).toBe('number');
    }
  });

  it('persona section has valid structure with text/min entries', () => {
    const persona = (narrativeContent as any).persona;
    if (persona) {
      for (const alignment of Object.keys(persona)) {
        const alignmentData = persona[alignment];
        if (alignmentData && typeof alignmentData === 'object') {
          for (const key of Object.keys(alignmentData)) {
            const entries = alignmentData[key];
            if (Array.isArray(entries)) {
              for (const entry of entries) {
                expect(entry).toHaveProperty('text');
                expect(entry).toHaveProperty('min');
              }
            }
          }
        }
      }
    }
  });

  it('has expanded attack description pools (>= 8 entries each)', () => {
    const attacks = (narrativeContent as any).pbp.attacks;
    expect(attacks).toBeDefined();
    for (const category of ['slash', 'bludgeon', 'thrust', 'punch']) {
      if (attacks[category]) {
        for (const tier of Object.keys(attacks[category])) {
          if (Array.isArray(attacks[category][tier])) {
            expect(attacks[category][tier].length).toBeGreaterThanOrEqual(8);
          }
        }
      }
    }
  });

  it('has expanded dodge defense tiers (>= 20 desperate entries)', () => {
    const dodge = (narrativeContent as any).pbp.defenses.dodge;
    expect(dodge).toBeDefined();
    expect(dodge.desperate.length).toBeGreaterThanOrEqual(20);
  });

  it('new attack entries use valid template variables', () => {
    const attacks = (narrativeContent as any).pbp.attacks;
    const validVars = ['attacker', 'defender', 'weapon', 'bodyPart', 'name', 'possessive'];
    for (const category of Object.keys(attacks)) {
      for (const tier of Object.keys(attacks[category])) {
        const entries = attacks[category][tier];
        if (!Array.isArray(entries)) continue;
        for (const entry of entries) {
          if (typeof entry === 'string') {
            const matches = entry.match(/\{\{(\w+)\}\}/g) || [];
            for (const m of matches) {
              const varName = m.slice(2, -2);
              expect(validVars).toContain(varName);
            }
          }
        }
      }
    }
  });
});
