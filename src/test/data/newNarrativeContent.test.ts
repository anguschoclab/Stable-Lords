/**
 * Expanded narrative content from narrative pool branch — verifies
 * expanded pool sizes, valid tokens, no duplicates, and no raw token
 * leaks when interpolated.
 *
 * Pre-merge test: size assertions will FAIL on main (pools are smaller)
 * and PASS after the jules-narrative-pool branch is merged.
 */
import { describe, it, expect } from 'vitest';
import narrativeContent from '@/data/narrativeContent.json';
import { interpolateTemplate } from '@/engine/narrative/narrativePBPUtils';

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);

function getPool(data: any, ...keys: string[]): string[] {
  let cur = data;
  for (const k of keys) {
    if (cur && typeof cur === 'object' && k in cur) {
      cur = cur[k];
    } else {
      return [];
    }
  }
  return Array.isArray(cur) ? cur : [];
}

describe('expanded narrative content', () => {
  describe('pool sizes', () => {
    it('strikes.generic has at least 12 entries', () => {
      const pool = getPool(narrativeContent, 'strikes', 'generic');
      expect(pool.length).toBeGreaterThanOrEqual(12);
    });

    it('strikes.slashing.solid has at least 15 entries', () => {
      const pool = getPool(narrativeContent, 'strikes', 'slashing', 'solid');
      expect(pool.length).toBeGreaterThanOrEqual(15);
    });

    it('strikes.bashing.solid has at least 15 entries', () => {
      const pool = getPool(narrativeContent, 'strikes', 'bashing', 'solid');
      expect(pool.length).toBeGreaterThanOrEqual(15);
    });

    it('strikes.piercing.solid has at least 15 entries', () => {
      const pool = getPool(narrativeContent, 'strikes', 'piercing', 'solid');
      expect(pool.length).toBeGreaterThanOrEqual(15);
    });

    it('strikes.fist.solid has at least 15 entries', () => {
      const pool = getPool(narrativeContent, 'strikes', 'fist', 'solid');
      expect(pool.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('token validity', () => {
    const weaponTypes = ['slashing', 'bashing', 'piercing', 'fist'];
    const severities = ['glancing', 'solid', 'critical_human', 'critical_supernatural', 'fatal'];

    for (const wtype of weaponTypes) {
      for (const sev of severities) {
        const pool = getPool(narrativeContent, 'strikes', wtype, sev);
        if (pool.length === 0) continue;

        it(`strikes.${wtype}.${sev} has no duplicate entries`, () => {
          const seen = new Set<string>();
          for (const entry of pool) {
            expect(seen.has(entry), `Duplicate in strikes.${wtype}.${sev}: "${entry}"`).toBe(false);
            seen.add(entry);
          }
        });

        it(`strikes.${wtype}.${sev} entries use only valid {{token}} placeholders`, () => {
          for (const entry of pool) {
            const tokens = entry.match(/\{\{[^}]+\}\}/g) || [];
            for (const token of tokens) {
              const inner = token.replace(/\{\{|\}\}/g, '');
              expect(
                ['attacker', 'defender', 'weapon', 'bodyPart', 'possessive', 'pronoun', 'reflexive', 'winner', 'loser', 'name'].includes(inner),
                `Unknown token {{${inner}}} in strikes.${wtype}.${sev}: "${entry.substring(0, 50)}..."`
              ).toBe(true);
            }
          }
        });

        it(`strikes.${wtype}.${sev} entries produce no raw tokens when interpolated`, () => {
          for (const entry of pool) {
            const result = interpolateTemplate(entry, {
              attacker: 'Rex',
              defender: 'Vellis',
              weapon: 'longsword',
              bodyPart: 'chest',
            });
            expect(noRawTokens(result), `Raw token leaked: "${result.substring(0, 60)}..."`).toBe(true);
          }
        });
      }
    }
  });

  describe('strikes.generic', () => {
    const pool = getPool(narrativeContent, 'strikes', 'generic');

    it('has no duplicate entries', () => {
      const seen = new Set<string>();
      for (const entry of pool) {
        expect(seen.has(entry), `Duplicate in strikes.generic: "${entry}"`).toBe(false);
        seen.add(entry);
      }
    });

    it('entries produce no raw tokens when interpolated', () => {
      for (const entry of pool) {
        const result = interpolateTemplate(entry, {
          attacker: 'Rex',
          defender: 'Vellis',
          weapon: 'longsword',
          bodyPart: 'chest',
        });
        expect(noRawTokens(result), `Raw token leaked: "${result.substring(0, 60)}..."`).toBe(true);
      }
    });
  });
});
