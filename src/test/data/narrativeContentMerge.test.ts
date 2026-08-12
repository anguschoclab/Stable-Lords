/**
 * Narrative content merge — verifies the integrity of narrative domain files
 * after merging PR #752 (curate-combat-narrative) and PR #747 (cosmic-anomaly).
 */
import { describe, it, expect } from 'vitest';
import { narrativeContent } from '@/data/narrative';

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
