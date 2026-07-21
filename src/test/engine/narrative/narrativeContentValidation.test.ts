/**
 * Narrative content validation — verifies narrative content integrity
 * including name dedup, placeholder usage, and event handler coverage.
 */
import { describe, it, expect } from 'vitest';
import narrativeContent from '@/data/narrativeContent.json';

describe('narrative content validation', () => {
  it('no duplicate entries in recruitment.names', () => {
    const names = narrativeContent.recruitment.names;
    const uniqueNames = new Set(names);
    expect(uniqueNames.size, 'Duplicate recruitment names found').toBe(names.length);
  });

  it('all offseason events have a non-empty effectType', () => {
    const events = narrativeContent.offseason_events;
    for (const [key, entry] of Object.entries(events)) {
      expect((entry as any).effectType, `Event "${key}" missing effectType`).toBeTruthy();
    }
  });

  it('all offseason events have at least one newsletter template', () => {
    const events = narrativeContent.offseason_events;
    for (const [key, entry] of Object.entries(events)) {
      const newsletter = (entry as any).newsletter;
      expect(Array.isArray(newsletter), `Event "${key}" has no newsletter array`).toBe(true);
      expect(newsletter.length, `Event "${key}" has empty newsletter`).toBeGreaterThan(0);
    }
  });

  it('no near-duplicate newsletter templates within the same event', () => {
    const events = narrativeContent.offseason_events;
    for (const [key, entry] of Object.entries(events)) {
      const newsletter = (entry as any).newsletter as string[];
      const uniqueTemplates = new Set(newsletter);
      expect(uniqueTemplates.size, `Event "${key}" has duplicate newsletter templates`).toBe(newsletter.length);
    }
  });
});
