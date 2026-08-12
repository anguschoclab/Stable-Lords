/**
 * Narrative — narrativeContent.json deduplication test.
 * Pre-merge test: validates no duplicate entries exist in narrativeContent.json.
 * After merging PRs #783 and #786, this test guards against duplicate content.
 */
import { describe, it, expect } from 'vitest';
import { narrativeContent } from '@/data/narrative';

describe('narrativeContent.json deduplication', () => {
  it('no duplicate entry IDs exist', () => {
    const entries = narrativeContent as Record<string, unknown>;
    const ids = Object.keys(entries);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('no duplicate narrative text across entries', () => {
    const entries = Object.values(narrativeContent as Record<string, { text?: string }>);
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
