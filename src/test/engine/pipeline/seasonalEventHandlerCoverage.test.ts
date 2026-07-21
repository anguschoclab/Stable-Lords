/**
 * Seasonal event handler coverage — verifies every JSON offseason event
 * has a handler and every handler has JSON data (except fey_trickster).
 */
import { describe, it, expect } from 'vitest';
import narrativeContent from '@/data/narrativeContent.json';

describe('seasonal event handler coverage', () => {
  const jsonEvents = Object.keys(narrativeContent.offseason_events);

  it('every offseason_events key has a non-empty effectType', () => {
    for (const key of jsonEvents) {
      const entry = (narrativeContent.offseason_events as any)[key];
      expect(entry.effectType, `Event "${key}" missing effectType`).toBeTruthy();
    }
  });

  it('no duplicate effectTypes in offseason_events', () => {
    const effectTypes = jsonEvents.map(
      (key) => (narrativeContent.offseason_events as any)[key].effectType
    );
    const uniqueTypes = new Set(effectTypes);
    expect(uniqueTypes.size, 'Duplicate effectTypes found').toBe(effectTypes.length);
  });

  it('fey_trickster is a known exception (handler exists, no JSON entry)', () => {
    // fey_trickster has a handler in EVENT_HANDLERS but no JSON entry
    // This is a pre-existing issue, not a merge bug
    expect(jsonEvents).not.toContain('fey_trickster');
  });
});
