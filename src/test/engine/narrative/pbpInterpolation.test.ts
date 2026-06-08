import { describe, it, expect } from 'vitest';
import { interpolateTemplate } from '@/engine/narrative/narrativePBPUtils';
import { battleOpener } from '@/engine/narrative/narrativeIntro';
import { narrateFeint, narrateInsightHint } from '@/engine/narrative/narrativePositioning';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);

describe('PBP interpolation — no raw {{token}} leaks', () => {
  describe('interpolateTemplate fallbacks', () => {
    it('resolves standard tokens to sensible text when context is missing', () => {
      // missing defender → "the opponent", never raw
      expect(interpolateTemplate('{{attacker}} hits {{defender}}', { attacker: 'Bob' })).toBe(
        'Bob hits the opponent'
      );
      expect(interpolateTemplate('{{attacker}} swings {{weapon}}', {})).toBe(
        'The warrior swings weapon'
      );
      expect(noRawTokens(interpolateTemplate('{{attacker}} / {{defender}} / {{weapon}}', {}))).toBe(
        true
      );
    });

    it('still renders provided values', () => {
      expect(
        interpolateTemplate('{{attacker}} vs {{defender}}', { attacker: 'A', defender: 'D' })
      ).toBe('A vs D');
    });

    it('resolves {{possessive}} (defaults to "their", honors context)', () => {
      expect(
        interpolateTemplate('{{attacker}} raises {{possessive}} blade', { attacker: 'A' })
      ).toBe('A raises their blade');
      expect(
        interpolateTemplate('forced back on {{possessive}} heels', { possessive: 'her' })
      ).toBe('forced back on her heels');
    });

    it('resolves {{pronoun}} (defaults to "he", honors context)', () => {
      expect(interpolateTemplate('{{pronoun}} falls!', {})).toBe('he falls!');
      expect(interpolateTemplate('{{pronoun}} falls!', { attacker: 'X' })).toBe('he falls!');
    });

    it('resolves {{reflexive}} (defaults to "himself", honors context)', () => {
      expect(interpolateTemplate('leaves {{reflexive}} exposed', {})).toBe(
        'leaves himself exposed'
      );
    });

    it('no raw tokens leak for possessive/pronoun/reflexive when context is empty', () => {
      const templates = [
        '{{attacker}} mutters curses under {{possessive}} breath.',
        '{{attacker}} glares defiance even as {{pronoun}} falls!',
        '{{defender}} leaves {{reflexive}} exposed with every strike!',
      ];
      for (const t of templates) {
        expect(noRawTokens(interpolateTemplate(t, { attacker: 'Bob', defender: 'Rex' }))).toBe(
          true
        );
      }
    });
  });

  it('battleOpener interpolates both fighter names (no raw tokens)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const line = battleOpener(new SeededRNGService(seed), 'Garath', 'Vellis');
      expect(noRawTokens(line), `seed ${seed}: ${line}`).toBe(true);
    }
  });

  it('narrateFeint resolves {{defender}} via the passed opponent name', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const line = narrateFeint(new SeededRNGService(seed), 'Garath', true, 'Vellis');
      expect(noRawTokens(line), `seed ${seed}: ${line}`).toBe(true);
    }
  });

  it('narrateInsightHint resolves all tokens — no raw leaks across attributes and seeds', () => {
    const attrs = ['ST', 'SP', 'DF', 'WL', 'CN', 'CT'];
    for (let seed = 1; seed <= 60; seed++) {
      for (const attr of attrs) {
        const svc = new SeededRNGService(seed);
        const rng = () => svc.next();
        const hint = narrateInsightHint(rng, attr, 'Garath', 'Vellis');
        if (hint !== null) {
          expect(noRawTokens(hint), `seed ${seed} attr ${attr}: ${hint}`).toBe(true);
        }
      }
    }
  });
});
