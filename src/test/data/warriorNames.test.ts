/**
 * Common corpus — verifies the legacy name pool is preserved, deduplicated,
 * and feeds the procedural generator's 'common' culture.
 */
import { describe, it, expect } from 'vitest';
import { COMMON_CORPUS } from '@/data/names/commonCorpus';
import { CULTURE_SEEDS } from '@/data/names/cultures';

describe('common corpus', () => {
  const NEW_CHAOTIC_NAMES = [
    'VOIDBRINGER',
    'STARFALL',
    'CHAOSSPARK',
    'DOOMHAMMER',
    'NIGHTWEAVER',
    'ECLIPSEKNIGHT',
    'BLOODSTAR',
    'SHADOWFLARE',
    'ASTRALFIEND',
    'NEONBLADE',
  ];

  it('all 10 chaotic names are preserved in the corpus', () => {
    for (const name of NEW_CHAOTIC_NAMES) {
      expect(COMMON_CORPUS, `missing name: ${name}`).toContain(name);
    }
  });

  it('COMMON_CORPUS has no duplicate entries', () => {
    const unique = new Set(COMMON_CORPUS);
    expect(unique.size, `${COMMON_CORPUS.length - unique.size} duplicate names`).toBe(
      COMMON_CORPUS.length
    );
  });

  it('the common culture seeds include the full corpus', () => {
    for (const name of NEW_CHAOTIC_NAMES) {
      expect(CULTURE_SEEDS.common).toContain(name);
    }
  });
});
