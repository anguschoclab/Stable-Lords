/**
 * Content packs (G7 / Design Bible #36) — narrative overlays.
 */
import { describe, it, expect } from 'vitest';
import {
  parseContentPack,
  getPackArenaLore,
  getRecruitQuote,
  type ContentPack,
} from '@/lib/contentPacks';
import { META_RECRUIT_QUOTES } from '@/data/ownerData';

const PACK: ContentPack = {
  id: 'test-pack',
  name: 'Test Pack',
  arenaLore: [
    {
      id: 'pl-1',
      arenaId: 'standard_arena',
      type: 'famous_death',
      title: 'The Day the Sand Ran Black',
      narrative: 'A pack-supplied tale.',
    },
  ],
  recruitQuotes: { Traditionalist: '"Pack quote."' },
};

describe('contentPacks', () => {
  it('parses and validates a pack document', () => {
    const p = parseContentPack(JSON.stringify(PACK));
    expect(p.name).toBe('Test Pack');
    expect(() => parseContentPack('{"id":""}')).toThrow();
    expect(() => parseContentPack('not json')).toThrow();
  });

  it('returns pack lore for the matching arena only', () => {
    expect(getPackArenaLore([PACK], 'standard_arena')).toHaveLength(1);
    expect(getPackArenaLore([PACK], 'other_arena')).toHaveLength(0);
    expect(getPackArenaLore(undefined, 'standard_arena')).toHaveLength(0);
  });

  it('pack quotes override canonical; canonical is the fallback', () => {
    expect(getRecruitQuote('Traditionalist', [PACK])).toBe('"Pack quote."');
    expect(getRecruitQuote('Innovator', [PACK])).toBe(META_RECRUIT_QUOTES.Innovator);
    expect(getRecruitQuote('Traditionalist', undefined)).toBe(
      META_RECRUIT_QUOTES.Traditionalist
    );
  });
});
