/**
 * narrativeContent.json — verifies no duplicate entries, valid min values,
 * and correct structure for expanded content.
 */
import { describe, it, expect } from 'vitest';
import narrativeContent from '@/data/narrativeContent.json';
import { FightingStyle } from '@/types/shared.types';

const VALID_FIGHTING_STYLES = new Set(Object.values(FightingStyle));

function collectEntries(obj: any, path: string = ''): { text: string; min: number; path: string }[] {
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

  it('style keys in persona section are valid FightingStyle values', () => {
    const persona = (narrativeContent as any).persona;
    if (persona) {
      for (const alignment of Object.keys(persona)) {
        const alignmentData = persona[alignment];
        if (alignmentData && typeof alignmentData === 'object') {
          for (const styleKey of Object.keys(alignmentData)) {
            if (styleKey !== 'initiative' && styleKey !== 'damage' && styleKey !== 'endurance') {
              expect(VALID_FIGHTING_STYLES.has(styleKey as FightingStyle)).toBe(true);
            }
          }
        }
      }
    }
  });
});
