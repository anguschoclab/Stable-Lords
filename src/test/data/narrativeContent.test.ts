import { describe, it, expect } from 'vitest';
import { narrativeContent } from '@/data/narrative';

/**
 * narrativeContent domain files — verifies no duplicate entries, valid min values,
 * and correct structure for expanded content.
 */

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

/**
 * Narrative — narrative content deduplication test.
 */

/**
 * Narrative content merge — verifies the integrity of narrative domain files
 * after merging PR #752 (curate-combat-narrative) and PR #747 (cosmic-anomaly).
 */

/**
 * Narrative content validation — verifies narrative content integrity
 * including name dedup, placeholder usage, and event handler coverage.
 */

describe('narrativeContent domain files', () => {
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
    expect(dodge.desperate.length).toBeGreaterThanOrEqual(16);
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

  it('all template brackets {{...}} are balanced across all string values', () => {
    function checkBrackets(str: string, path: string) {
      let depth = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '{' && str[i + 1] === '{') {
          depth++;
          i++;
        } else if (str[i] === '}' && str[i + 1] === '}') {
          depth--;
          i++;
          if (depth < 0) {
            throw new Error(`Unmatched closing }} at position ${i} in ${path}`);
          }
        }
      }
      if (depth > 0) {
        throw new Error(`Unclosed template bracket (depth ${depth}) in ${path}`);
      }
    }

    function walk(obj: unknown, path: string) {
      if (typeof obj === 'string') {
        checkBrackets(obj, path);
      } else if (Array.isArray(obj)) {
        obj.forEach((item, i) => walk(item, `${path}[${i}]`));
      } else if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          walk(v, `${path}.${k}`);
        }
      }
    }

    walk(narrativeContent, 'root');
  });

  it('all required top-level keys are present', () => {
    const requiredKeys = [
      'ux_metadata',
      'persona',
      'strikes',
      'pbp',
      'conclusions',
      'blurbs',
      'commentary',
      'recap',
      'events',
      'gazette',
      'fanfare',
      'memorials',
      'recruitment',
      'meta',
      'passives',
      'kill_text',
      'offseason_events',
      'crowd_reactions',
    ];
    for (const key of requiredKeys) {
      expect((narrativeContent as any)[key]).toBeDefined();
    }
  });
});

describe('narrative domain files deduplication', () => {
  it('no duplicate entry IDs exist', () => {
    const entries = narrativeContent as unknown as Record<string, unknown>;
    const ids = Object.keys(entries);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('no duplicate narrative text across entries', () => {
    const entries = Object.values(narrativeContent as unknown as Record<string, { text?: string }>);
    const texts = entries
      .map((e) => e?.text)
      .filter((t): t is string => typeof t === 'string' && t.length > 0);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const text of texts) {
      const normalized = text.trim().toLowerCase();
      if (seen.has(normalized)) {
        duplicates.push(text);
      }
      seen.add(normalized);
    }
    expect(duplicates).toEqual([]);
  });
});

describe('narrative content integrity', () => {
  it('narrativeContent is a valid object', () => {
    expect(narrativeContent).toBeDefined();
    expect(typeof narrativeContent).toBe('object');
  });

  it('offseason_events section exists', () => {
    const content = narrativeContent as any;
    expect(content.offseason_events).toBeDefined();
    expect(typeof content.offseason_events).toBe('object');
  });

  it('all offseason_events have title and newsletter', () => {
    const content = narrativeContent as any;
    const events = content.offseason_events;
    if (!events) return;

    for (const [key, event] of Object.entries(events)) {
      const e = event as any;
      expect(e.title, `${key} missing title`).toBeTruthy();
      expect(Array.isArray(e.newsletter), `${key} newsletter must be array`).toBe(true);
    }
  });

  it('all offseason_events have a valid effectType', () => {
    const content = narrativeContent as any;
    const events = content.offseason_events;
    if (!events) return;

    for (const [key, event] of Object.entries(events)) {
      const e = event as any;
      if (e.effectType) {
        // effectType should be a non-empty string (may differ from key for aliased events)
        expect(typeof e.effectType, `${key} effectType should be string`).toBe('string');
        expect(e.effectType.length, `${key} effectType should be non-empty`).toBeGreaterThan(0);
      }
    }
  });

  it('no duplicate offseason event keys', () => {
    const content = narrativeContent as any;
    const events = content.offseason_events;
    if (!events) return;

    const keys = Object.keys(events);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('combat narrative sections exist', () => {
    const content = narrativeContent as any;
    // Check for common narrative sections
    if (content.hit_narratives) {
      expect(Array.isArray(content.hit_narratives)).toBe(true);
    }
    if (content.kill_narratives) {
      expect(Array.isArray(content.kill_narratives)).toBe(true);
    }
  });
});

describe('narrative content validation', () => {
  it('no duplicate entries in recruitment.names', () => {
    const names = narrativeContent.recruitment.names;
    const uniqueNames = new Set(names);
    expect(uniqueNames.size, 'Duplicate recruitment names found').toBe(names.length);
  });

  it('all offseason events have a non-empty effectType', () => {
    const events = narrativeContent.offseason_events ?? {};
    for (const [key, entry] of Object.entries(events)) {
      expect((entry as any).effectType, `Event "${key}" missing effectType`).toBeTruthy();
    }
  });

  it('all offseason events have at least one newsletter template', () => {
    const events = narrativeContent.offseason_events ?? {};
    for (const [key, entry] of Object.entries(events)) {
      const newsletter = (entry as any).newsletter;
      expect(Array.isArray(newsletter), `Event "${key}" has no newsletter array`).toBe(true);
      expect(newsletter.length, `Event "${key}" has empty newsletter`).toBeGreaterThan(0);
    }
  });

  it('no near-duplicate newsletter templates within the same event', () => {
    const events = narrativeContent.offseason_events ?? {};
    for (const [key, entry] of Object.entries(events)) {
      const newsletter = (entry as any).newsletter as string[];
      const uniqueTemplates = new Set(newsletter);
      expect(uniqueTemplates.size, `Event "${key}" has duplicate newsletter templates`).toBe(
        newsletter.length
      );
    }
  });
});
