import { describe, it, expect } from 'vitest';
import {
  interpolateTemplate,
  getFromArchive,
  peekArchive,
  richHitLocation,
  getStrikeSeverity,
} from '@/engine/narrative/narrativePBPUtils';
import { SeededRNG } from '@/utils/random';

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);

describe('narrativePBPUtils', () => {
  describe('interpolateTemplate', () => {
    it('replaces %A with attacker name', () => {
      expect(interpolateTemplate('%A attacks.', { attacker: 'Thor' })).toBe('Thor attacks.');
    });

    it('replaces %D with defender name', () => {
      expect(interpolateTemplate('%D defends.', { defender: 'Loki' })).toBe('Loki defends.');
    });

    it('replaces %W with weapon name', () => {
      expect(interpolateTemplate('%A strikes with %W.', { attacker: 'Thor', weapon: 'HAMMER' })).toBe(
        'Thor strikes with HAMMER.'
      );
    });

    it('replaces %BP with body part', () => {
      expect(interpolateTemplate('Hits %BP.', { bodyPart: 'CHEST' })).toBe('Hits CHEST.');
    });

    it('replaces %H with hits count', () => {
      expect(interpolateTemplate('Lasted %H minutes.', { hits: 15 })).toBe('Lasted 15 minutes.');
    });

    it('replaces multiple tokens at once', () => {
      expect(
        interpolateTemplate('%A strikes %D in the %BP with %W.', {
          attacker: 'Thor',
          defender: 'Loki',
          bodyPart: 'HEAD',
          weapon: 'HAMMER',
        })
      ).toBe('Thor strikes Loki in the HEAD with HAMMER.');
    });

    it('falls back to "The warrior" for missing attacker', () => {
      expect(interpolateTemplate('%A attacks.', {})).toBe('The warrior attacks.');
    });

    it('falls back to "the opponent" for missing defender', () => {
      expect(interpolateTemplate('%A attacks %D.', { attacker: 'Thor' })).toBe(
        'Thor attacks the opponent.'
      );
    });

    it('uses name as fallback for attacker', () => {
      expect(interpolateTemplate('%A attacks.', { name: 'Warrior' })).toBe('Warrior attacks.');
    });

    it('resolves {{attacker}} long-form token', () => {
      expect(interpolateTemplate('{{attacker}} strikes.', { attacker: 'Bob' })).toBe(
        'Bob strikes.'
      );
    });

    it('resolves {{defender}} long-form token', () => {
      expect(interpolateTemplate('{{defender}} blocks.', { defender: 'Rex' })).toBe('Rex blocks.');
    });

    it('resolves {{winner}} and {{loser}} tokens', () => {
      expect(
        interpolateTemplate('{{winner}} defeats {{loser}}.', {
          attacker: 'A',
          defender: 'B',
          ...({ winner: 'A', loser: 'B' } as Record<string, string>),
        })
      ).toBe('A defeats B.');
    });

    it('resolves {{possessive}} (defaults to "their")', () => {
      expect(interpolateTemplate('{{attacker}} raises {{possessive}} blade.', { attacker: 'A' })).toBe(
        'A raises their blade.'
      );
    });

    it('resolves {{pronoun}} (defaults to "he")', () => {
      expect(interpolateTemplate('{{pronoun}} falls!', {})).toBe('he falls!');
    });

    it('resolves {{reflexive}} (defaults to "himself")', () => {
      expect(interpolateTemplate('leaves {{reflexive}} exposed.', {})).toBe(
        'leaves himself exposed.'
      );
    });

    it('leaves unknown tokens as-is', () => {
      expect(interpolateTemplate('{{unknown}} stays.', {})).toBe('{{unknown}} stays.');
    });

    it('returns fallback for empty template', () => {
      expect(interpolateTemplate('', {})).toBe('No description available.');
    });

    it('never leaks raw {{token}} for standard tokens', () => {
      const templates = [
        '{{attacker}} hits {{defender}} with {{weapon}} in the {{bodyPart}}.',
        '{{winner}} taunts {{loser}}.',
        '{{pronoun}} steadies {{reflexive}}.',
      ];
      for (const t of templates) {
        expect(noRawTokens(interpolateTemplate(t, { attacker: 'A', defender: 'D' }))).toBe(true);
      }
    });
  });

  describe('getFromArchive', () => {
    it('retrieves a template from a valid path', () => {
      const rng = new SeededRNG(1);
      const template = getFromArchive(rng, ['pbp', 'openers']);
      expect(template).toBeDefined();
      expect(typeof template).toBe('string');
    });

    it('returns fallback for invalid path', () => {
      const rng = new SeededRNG(1);
      expect(getFromArchive(rng, ['invalid', 'path'])).toBe('A fierce exchange occurs.');
    });

    it('returns fallback for missing path', () => {
      const rng = new SeededRNG(1);
      expect(getFromArchive(rng, ['pbp', 'nonexistent'])).toBe('A fierce exchange occurs.');
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(getFromArchive(r1, ['pbp', 'openers'])).toBe(getFromArchive(r2, ['pbp', 'openers']));
    });
  });

  describe('peekArchive', () => {
    it('returns string array for valid path', () => {
      const result = peekArchive(['pbp', 'openers']);
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result!.length).toBeGreaterThan(0);
    });

    it('returns null for invalid path', () => {
      expect(peekArchive(['invalid', 'path'])).toBeNull();
    });

    it('returns null for empty array path', () => {
      expect(peekArchive(['pbp', 'nonexistent'])).toBeNull();
    });
  });

  describe('richHitLocation', () => {
    it('returns a rich description for known locations', () => {
      const rng = new SeededRNG(1);
      const result = richHitLocation(rng, 'chest');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns uppercased location for unknown locations', () => {
      const rng = new SeededRNG(1);
      expect(richHitLocation(rng, 'unknown_part')).toBe('UNKNOWN_PART');
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(richHitLocation(r1, 'head')).toBe(richHitLocation(r2, 'head'));
    });
  });

  describe('getStrikeSeverity', () => {
    it('returns "fatal" when isFatal is true', () => {
      expect(getStrikeSeverity(10, 100, true, false, false, 0)).toBe('fatal');
    });

    it('returns "critical_supernatural" for crit with high fame', () => {
      expect(getStrikeSeverity(30, 100, false, true, false, 100)).toBe('critical_supernatural');
    });

    it('returns "critical_human" for crit with low fame', () => {
      expect(getStrikeSeverity(30, 100, false, true, false, 50)).toBe('critical_human');
    });

    it('returns "critical_human" for high damage ratio (>= 0.25)', () => {
      expect(getStrikeSeverity(26, 100, false, false, false, 50)).toBe('critical_human');
    });

    it('returns "mastery" for favorite with moderate damage', () => {
      expect(getStrikeSeverity(15, 100, false, false, true, 50)).toBe('mastery');
    });

    it('returns "solid" for moderate damage ratio (>= 0.1)', () => {
      expect(getStrikeSeverity(12, 100, false, false, false, 50)).toBe('solid');
    });

    it('returns "glancing" for low damage ratio', () => {
      expect(getStrikeSeverity(5, 100, false, false, false, 50)).toBe('glancing');
    });
  });
});
