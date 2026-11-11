import { describe, it, expect } from 'vitest';
import { BIBLE_DOCS, searchBibleDocs } from '@/lib/bibleIndex';

describe('bibleIndex (design bible search)', () => {
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

  it('indexes the Arena-93 fighter concepts doc', () => {
    const doc = BIBLE_DOCS.find((d) => /fighter concepts/i.test(d.title));
    expect(doc, 'fighter concepts doc not indexed').toBeDefined();
    const hits = searchBibleDocs('long term fighter');
    expect(hits.some((h) => h.docId === doc!.id)).toBe(true);
  });

  it('indexes only the docs/design corpus — no admin docs leak in', () => {
    const ids = BIBLE_DOCS.map((d) => d.id);
    expect(
      ids.filter((id) => /MEGAPLAN|README|AGENTS|INDEX|Daily|REPORT/i.test(id)),
      'admin docs leaked into the in-game bible corpus'
    ).toEqual([]);
  });
});
