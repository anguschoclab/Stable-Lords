import { describe, it, expect } from 'vitest';
import { interpolateTemplate } from '@/engine/narrative/narrativePBPUtils';
import { battleOpener } from '@/engine/narrative/narrativeIntro';
import { narrateFeint } from '@/engine/narrative/narrativePositioning';
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
      expect(interpolateTemplate('{{attacker}} vs {{defender}}', { attacker: 'A', defender: 'D' })).toBe(
        'A vs D'
      );
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
});
