import { describe, it, expect, vi } from 'vitest';
import {
  setupRng,
  getTrainerMods,
  processOutcomeTags,
  createRNGForContext,
} from '@/engine/combat/mechanics/simulateHelpers';
import { FightingStyle } from '@/types/shared.types';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution/types';
import type { Trainer } from '@/types/state.types';

describe('simulateHelpers mechanics', () => {
  describe('createRNGForContext', () => {
    it('returns provided RNG if it exists', () => {
      const mockRng = { next: vi.fn(), random: vi.fn() };
      expect(createRNGForContext(123, mockRng as any)).toBe(mockRng);
    });

    it('creates a new SeededRNGService if none provided', () => {
      const rng = createRNGForContext(123);
      expect(rng).toBeDefined();
      expect(typeof rng.next).toBe('function');
    });
  });

  describe('setupRng', () => {
    it('returns the provided function directly', () => {
      const fn = () => 0.5;
      expect(setupRng(fn)).toBe(fn);
    });

    it('creates an rng function from a provided number seed', () => {
      const fn = setupRng(123);
      expect(typeof fn).toBe('function');
      const val1 = fn();
      const val2 = setupRng(123)();
      expect(val1).toBe(val2); // deterministic
    });

    it('creates an rng function even if no arguments are provided', () => {
      // Mock global crypto to ensure it works
      const originalCrypto = globalThis.crypto;
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          getRandomValues: (arr: Uint32Array) => {
            arr[0] = 999;
            return arr;
          },
        },
        configurable: true,
      });

      const fn = setupRng();
      expect(typeof fn).toBe('function');
      expect(typeof fn()).toBe('number');

      Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
    });
  });

  describe('getTrainerMods', () => {
    it('returns zeroed base mods when trainers is undefined', () => {
      const mods = getTrainerMods(undefined, FightingStyle.StrikingAttack);
      expect(mods.attMod).toBe(0);
      expect(mods.defMod).toBe(0);
      expect(mods.damageReceivedMult).toBe(1.0);
    });

    it('returns base mods calculated from real trainers if no context is provided', () => {
      const t1 = { focus: 'Aggression', tier: 'Master', contractWeeksLeft: 10 } as Trainer;
      // Master tier -> TIER_BONUS = 3
      const mods = getTrainerMods([t1], FightingStyle.StrikingAttack);
      expect(mods.attMod).toBe(3);
      expect(mods.parMod).toBe(0);
      expect(mods.killWindowBonus).toBe(0);
      expect(mods.damageReceivedMult).toBe(1.0);
    });

    it('returns mods combined with specialtyMods if full context is provided', () => {
      // We'll give them a specialty that modifies mods
      // CounterFighter amplifies riposte damage
      const t1 = {
        focus: 'Aggression',
        tier: 'Seasoned',
        contractWeeksLeft: 10,
        specialty: 'CounterFighter',
      } as Trainer;
      // Seasoned tier = 2
      // attMod = 2
      // CounterFighter riposteDamageMult += 0.15 * tier -> +0.3
      const f = {} as FighterState;
      const o = {} as FighterState;
      const c = {} as ResolutionContext;
      const mods = getTrainerMods([t1], FightingStyle.StrikingAttack, f, o, c);
      expect(mods.attMod).toBe(2);
      expect(mods.riposteDamageMult).toBe(1.3);
    });
  });

  describe('processOutcomeTags', () => {
    it('returns empty array if no tags apply', () => {
      const fA = { hp: 100, maxHp: 100, hitsLanded: 2 } as FighterState;
      const fD = { hp: 0, maxHp: 100, hitsLanded: 0 } as FighterState;
      const tags = processOutcomeTags('A', 'Stoppage', fA, fD);
      expect(tags).toEqual([]);
    });

    it('adds KO tag', () => {
      const fA = { hp: 100, maxHp: 100, hitsLanded: 2 } as FighterState;
      const fD = { hp: 0, maxHp: 100, hitsLanded: 0 } as FighterState;
      const tags = processOutcomeTags('A', 'KO', fA, fD);
      expect(tags).toContain('KO');
    });

    it('adds Kill tag', () => {
      const fA = { hp: 100, maxHp: 100, hitsLanded: 2 } as FighterState;
      const fD = { hp: 0, maxHp: 100, hitsLanded: 0 } as FighterState;
      const tags = processOutcomeTags('A', 'Kill', fA, fD);
      expect(tags).toContain('Kill');
    });

    it('adds Dominance tag if winner landed >= 5 hits', () => {
      const fA = { hp: 100, maxHp: 100, hitsLanded: 5 } as FighterState;
      const fD = { hp: 0, maxHp: 100, hitsLanded: 0 } as FighterState;
      const tags = processOutcomeTags('A', 'Stoppage', fA, fD);
      expect(tags).toContain('Dominance');
    });

    it('adds Comeback tag if winner has < 30% max hp and landed more hits than loser', () => {
      const fA = { hp: 20, maxHp: 100, hitsLanded: 4 } as FighterState;
      const fD = { hp: 0, maxHp: 100, hitsLanded: 3 } as FighterState;
      const tags = processOutcomeTags('A', 'Stoppage', fA, fD);
      expect(tags).toContain('Comeback');
    });

    it('processes tags for defender winning', () => {
      const fA = { hp: 0, maxHp: 100, hitsLanded: 0 } as FighterState;
      const fD = { hp: 100, maxHp: 100, hitsLanded: 6 } as FighterState;
      const tags = processOutcomeTags('D', 'Kill', fA, fD);
      expect(tags).toContain('Kill');
      expect(tags).toContain('Dominance');
    });
  });
});
