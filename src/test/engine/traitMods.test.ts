import { describe, it, expect } from 'vitest';
import { getStaticTraitMods, getDynamicTraitMods, getTraitFightPlanMods } from '@/engine/traitMods';
import type { Warrior } from '@/types/warrior.types';
import type { DynamicTraitContext } from '@/engine/traitMods';

describe('traitMods', () => {
  describe('getStaticTraitMods', () => {
    it('returns default mods if warrior has no traits', () => {
      const result = getStaticTraitMods({} as Warrior);
      expect(result).toEqual({
        attMod: 0,
        parMod: 0,
        defMod: 0,
        iniMod: 0,
        ripMod: 0,
        decMod: 0,
        dmgBonus: 0,
        enduranceMult: 1.0,
      });
    });

    it('returns default mods if warrior is undefined', () => {
      const result = getStaticTraitMods(undefined);
      expect(result.attMod).toBe(0);
    });

    it('accumulates static modifiers correctly using actual traits', () => {
      // Pick known static traits: agile (+1 defMod), slow (-1 iniMod)
      const warrior = { traits: ['agile', 'slow', 'non-existent'] } as Warrior;
      const result = getStaticTraitMods(warrior);
      expect(result.defMod).toBe(1); // from agile
      expect(result.iniMod).toBe(-1); // from slow
    });
  });

  describe('getDynamicTraitMods', () => {
    it('returns default mods if warrior has no traits', () => {
      const ctx: DynamicTraitContext = { phase: 'MID', hpRatio: 1, endRatio: 1, consecutiveHits: 0 };
      const result = getDynamicTraitMods({}, ctx);
      expect(result).toEqual({ attMod: 0, parMod: 0, defMod: 0, iniMod: 0, killWindowBonus: 0 });
    });

    it('returns default mods if warrior is undefined', () => {
      const ctx: DynamicTraitContext = { phase: 'MID', hpRatio: 1, endRatio: 1, consecutiveHits: 0 };
      const result = getDynamicTraitMods(undefined, ctx);
      expect(result.attMod).toBe(0);
    });

    it('applies low HP mods correctly using actual traits', () => {
      // cornered_beast has defModLowHp: 2
      const warrior = { traits: ['cornered_beast'] };

      // High HP
      const ctxHigh: DynamicTraitContext = { phase: 'MID', hpRatio: 0.8, endRatio: 0.5, consecutiveHits: 0 };
      let result = getDynamicTraitMods(warrior, ctxHigh);
      expect(result.defMod).toBe(0);

      // Low HP
      const ctxLow: DynamicTraitContext = { phase: 'MID', hpRatio: 0.4, endRatio: 0.5, consecutiveHits: 0 };
      result = getDynamicTraitMods(warrior, ctxLow);
      expect(result.defMod).toBe(2);
    });

    it('applies phase-specific mods correctly using actual traits', () => {
      // paranoid has defModEarly: 2
      const warrior = { traits: ['paranoid'] };

      // Early
      const ctxEarly: DynamicTraitContext = { phase: 'OPENING', hpRatio: 0.6, endRatio: 0.5, consecutiveHits: 0 };
      let result = getDynamicTraitMods(warrior, ctxEarly);
      expect(result.defMod).toBe(2);

      // Late
      const ctxLate: DynamicTraitContext = { phase: 'LATE', hpRatio: 0.6, endRatio: 0.5, consecutiveHits: 0 };
      result = getDynamicTraitMods(warrior, ctxLate);
      expect(result.defMod).toBe(0);
    });

    it('applies misc conditional mods correctly using actual traits', () => {
      // comboartist has attModConsecutiveHits: 1
      const warrior = { traits: ['comboartist'] };

      // Consecutive hits < 2
      const ctxLowHits: DynamicTraitContext = { phase: 'MID', hpRatio: 0.6, endRatio: 0.8, consecutiveHits: 1 };
      let result = getDynamicTraitMods(warrior, ctxLowHits);
      expect(result.attMod).toBe(0);

      // Consecutive hits >= 2
      const ctxHits: DynamicTraitContext = { phase: 'MID', hpRatio: 0.6, endRatio: 0.5, consecutiveHits: 2 };
      result = getDynamicTraitMods(warrior, ctxHits);
      expect(result.attMod).toBe(1);
    });
  });

  describe('getTraitFightPlanMods', () => {
    it('returns empty object if warrior has no traits', () => {
      expect(getTraitFightPlanMods({} as Warrior)).toEqual({});
    });

    it('returns empty object if warrior is undefined', () => {
      expect(getTraitFightPlanMods(undefined)).toEqual({});
    });

    it('combines fight plan mods correctly using actual traits', () => {
      // brutal has { OE: 8, killDesire: 5, AL: -5 }
      // aggressive has { OE: 4, AL: -1, killDesire: 5 }
      const warrior = { traits: ['brutal', 'aggressive'] } as Warrior;
      const result = getTraitFightPlanMods(warrior);
      expect(result).toEqual({
        OE: 12, // 8 + 4
        AL: -6, // -5 - 1
        killDesire: 10, // 5 + 5
      });
    });
  });
});
