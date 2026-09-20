import { describe, it, expect } from 'vitest';
import { BIBLE_DOCS, searchBibleDocs } from '@/lib/bibleIndex';

describe('bibleIndex (G5 design bible search)', () => {
  it('loads the design bible spec corpus', () => {
    expect(BIBLE_DOCS.length).toBeGreaterThan(5);
    const titles = BIBLE_DOCS.map((d) => d.title);
    expect(titles.some((t) => /master design bible/i.test(t))).toBe(true);
  });

  it('returns ranked section hits for a query', () => {
    const hits = searchBibleDocs('encumbrance');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.docTitle).toBeTruthy();
    expect(hits[0]!.snippet.toLowerCase()).toContain('encumbrance');
  });

  it('returns empty array for blank/no-match queries', () => {
    expect(searchBibleDocs('')).toEqual([]);
    expect(searchBibleDocs('zzzqxxv')).toEqual([]);
  });
});
