import { describe, it, expect } from 'vitest';
import {
  narrateAttack,
  narratePassive,
  narrateParry,
  narrateDodge,
  narrateCounterstrike,
  narrateHit,
  narrateParryBreak,
  narrateInitiative,
  narrateKnockdown,
  narrateRecovery,
  getEpithet,
  narrateContextLine,
  narrateCrowdReaction,
  narrateTaunt,
} from '@/engine/narrative/combatNarrators';
import { peekArchive } from '@/engine/narrative/narrativePBPUtils';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);

describe('combatNarrators', () => {
  describe('narrateAttack', () => {
    it('produces no-raw-token text', () => {
      const rng = new SeededRNG(1);
      const result = narrateAttack(rng, 'Rex', 'longsword', false, 'Vellis', FightingStyle.SlashingAttack);
      expect(noRawTokens(result)).toBe(true);
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(narrateAttack(r1, 'Rex', 'longsword', false, 'Vellis', FightingStyle.SlashingAttack)).toBe(
        narrateAttack(r2, 'Rex', 'longsword', false, 'Vellis', FightingStyle.SlashingAttack)
      );
    });
  });

  describe('narratePassive', () => {
    it('produces no-raw-token text', () => {
      const rng = new SeededRNG(1);
      const result = narratePassive(rng, FightingStyle.ParryRiposte, 'Rex');
      expect(noRawTokens(result)).toBe(true);
    });
  });

  describe('narrateParry', () => {
    it('produces no-raw-token text', () => {
      const rng = new SeededRNG(1);
      const result = narrateParry(rng, 'Rex', 'small_shield', 'Vellis');
      expect(noRawTokens(result)).toBe(true);
    });
  });

  describe('narrateDodge', () => {
    it('produces no-raw-token text for all SP tiers', () => {
      const sps = [undefined, 5, 15, 22, 30];
      for (const sp of sps) {
        const rng = new SeededRNG(1);
        const result = narrateDodge(rng, 'Rex', sp, 'Vellis');
        expect(noRawTokens(result)).toBe(true);
      }
    });
  });

  describe('narrateCounterstrike', () => {
    it('produces no-raw-token text', () => {
      const rng = new SeededRNG(1);
      const result = narrateCounterstrike(rng, 'Rex', 'Vellis');
      expect(noRawTokens(result)).toBe(true);
    });

    it('returns a counterstrike-specific line, not the generic fallback', () => {
      const rng = new SeededRNG(1);
      const result = narrateCounterstrike(rng, 'Rex', 'Vellis');
      expect(result).not.toBe('A fierce exchange occurs.');
      expect(result.length).toBeGreaterThan(10);
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(narrateCounterstrike(r1, 'Rex', 'Vellis')).toBe(
        narrateCounterstrike(r2, 'Rex', 'Vellis')
      );
    });
  });

  describe('narrateDodge expanded content', () => {
    it('tier1_low has at least 31 entries', () => {
      const pool = peekArchive(['pbp', 'defenses', 'dodge', 'tier1_low']);
      expect(pool).not.toBeNull();
      expect(pool!.length).toBeGreaterThanOrEqual(31);
    });

    it('has persona-keyed categories (desperate, confident, theatrical, grim)', () => {
      const keys = ['desperate', 'confident', 'theatrical', 'grim'] as const;
      for (const key of keys) {
        const pool = peekArchive(['pbp', 'defenses', 'dodge', key]);
        expect(pool).not.toBeNull();
        expect(pool!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('narrateHit', () => {
    it('produces no-raw-token text for non-fatal hit', () => {
      const rng = new SeededRNG(1);
      const result = narrateHit(rng, 'Vellis', 'chest', false, false, 'Rex', 'longsword', 10, 100, false, 50, false, FightingStyle.SlashingAttack);
      expect(noRawTokens(result)).toBe(true);
    });

    it('produces no-raw-token text for fatal hit', () => {
      const rng = new SeededRNG(1);
      const result = narrateHit(rng, 'Vellis', 'head', false, false, 'Rex', 'longsword', 100, 100, true, 50, false, FightingStyle.SlashingAttack);
      expect(noRawTokens(result)).toBe(true);
    });
  });

  describe('narrateParryBreak', () => {
    it('produces no-raw-token text', () => {
      const rng = new SeededRNG(1);
      const result = narrateParryBreak(rng, 'Rex', 'longsword');
      expect(noRawTokens(result)).toBe(true);
    });
  });

  describe('narrateInitiative', () => {
    it('produces no-raw-token text for non-feint', () => {
      const rng = new SeededRNG(1);
      const result = narrateInitiative(rng, 'Rex', false, 'Vellis');
      expect(noRawTokens(result)).toBe(true);
    });

    it('produces no-raw-token text for feint', () => {
      const rng = new SeededRNG(1);
      const result = narrateInitiative(rng, 'Rex', true, 'Vellis');
      expect(noRawTokens(result)).toBe(true);
    });
  });

  describe('narrateKnockdown', () => {
    it('produces no-raw-token text', () => {
      const rng = new SeededRNG(1);
      const result = narrateKnockdown(rng, 'Rex');
      expect(noRawTokens(result)).toBe(true);
    });
  });

  describe('narrateRecovery', () => {
    it('produces no-raw-token text', () => {
      const rng = new SeededRNG(1);
      const result = narrateRecovery(rng, 'Rex');
      expect(noRawTokens(result)).toBe(true);
    });
  });

  describe('getEpithet', () => {
    it('returns null or a string', () => {
      const rng = new SeededRNG(1);
      const result = getEpithet(rng, 'Northern', 'Human', 'SlashingAttack');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('returns null when no origin/race/style provided', () => {
      const rng = new SeededRNG(1);
      expect(getEpithet(rng)).toBeNull();
    });
  });

  describe('narrateContextLine', () => {
    it('returns null or a no-raw-token string', () => {
      const rng = new SeededRNG(1);
      const result = narrateContextLine(rng, {
        isRivalry: true,
        fameA: 50,
        fameD: 10,
        styleA: 'SlashingAttack',
        styleD: 'ParryRiposte',
        name: 'Rex',
      });
      if (result !== null) expect(noRawTokens(result)).toBe(true);
    });
  });

  describe('narrateCrowdReaction', () => {
    it('produces no-raw-token text for all moods', () => {
      const moods = ['positive', 'negative', 'encourage', 'gasp', 'cheer', 'boo'] as const;
      for (const mood of moods) {
        const rng = new SeededRNG(1);
        const result = narrateCrowdReaction(rng, mood, 'Rex');
        expect(noRawTokens(result)).toBe(true);
      }
    });
  });

  describe('narrateTaunt', () => {
    it('returns null or no-raw-token string for winner', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const r = new SeededRNG(seed);
        const result = narrateTaunt(r, 'Rex', 'Vellis', true, false);
        if (result !== null) expect(noRawTokens(result)).toBe(true);
      }
    });

    it('returns null or no-raw-token string for rivalry winner', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const r = new SeededRNG(seed);
        const result = narrateTaunt(r, 'Rex', 'Vellis', true, true);
        if (result !== null) expect(noRawTokens(result)).toBe(true);
      }
    });
  });
});
