import { describe, it, expect } from 'vitest';
import {
  getStyleSuitabilityBias,
  getStyleMatchupMods,
} from '@/engine/ai/matchup/styleMatcher';
import { FightingStyle } from '@/types/shared.types';

describe('styleMatcher', () => {
  describe('getStyleSuitabilityBias', () => {
    it('returns positive OE bias for aggressive styles', () => {
      const bias = getStyleSuitabilityBias(FightingStyle.BashingAttack);
      expect(bias.oe).toBeGreaterThan(0);
      expect(bias.al).toBeLessThan(0);
    });

    it('returns positive AL bias for defensive styles', () => {
      const bias = getStyleSuitabilityBias(FightingStyle.TotalParry);
      expect(bias.al).toBeGreaterThan(0);
      expect(bias.oe).toBeLessThan(0);
    });

    it('returns neutral or mixed biases for balanced styles', () => {
      const bias = getStyleSuitabilityBias(FightingStyle.SlashingAttack);
      expect(bias.oe).toBeGreaterThan(0);
      expect(bias.al).toBe(0);
    });

    it('returns { oe: 0, al: 0 } for unknown styles', () => {
      // @ts-expect-error testing invalid enum
      const bias = getStyleSuitabilityBias('UnknownStyle');
      expect(bias.oe).toBe(0);
      expect(bias.al).toBe(0);
    });
  });

  describe('getStyleMatchupMods', () => {
    it('returns correct mods for AimedBlow vs BashingAttack', () => {
      const mods = getStyleMatchupMods(FightingStyle.AimedBlow, FightingStyle.BashingAttack);
      expect(mods.oe).toBe(-1);
      expect(mods.al).toBe(0);
      expect(mods.kd).toBe(0);
    });

    it('returns correct mods for AimedBlow vs TotalParry', () => {
      const mods = getStyleMatchupMods(FightingStyle.AimedBlow, FightingStyle.TotalParry);
      expect(mods.oe).toBe(1);
      expect(mods.al).toBe(1);
      expect(mods.kd).toBe(0);
    });

    it('returns neutral mods for AimedBlow vs LungingAttack (unmapped)', () => {
      const mods = getStyleMatchupMods(FightingStyle.AimedBlow, FightingStyle.LungingAttack);
      expect(mods.oe).toBe(0);
      expect(mods.al).toBe(0);
      expect(mods.kd).toBe(0);
    });

    it('returns correct mods for BashingAttack vs LungingAttack', () => {
      const mods = getStyleMatchupMods(FightingStyle.BashingAttack, FightingStyle.LungingAttack);
      expect(mods.oe).toBe(2);
      expect(mods.al).toBe(1);
      expect(mods.kd).toBe(1);
    });

    it('returns correct mods for LungingAttack vs TotalParry', () => {
      const mods = getStyleMatchupMods(FightingStyle.LungingAttack, FightingStyle.TotalParry);
      expect(mods.oe).toBe(-2);
      expect(mods.al).toBe(1);
      expect(mods.kd).toBe(-1);
    });

    it('returns correct mods for ParryLunge vs SlashingAttack', () => {
      const mods = getStyleMatchupMods(FightingStyle.ParryLunge, FightingStyle.SlashingAttack);
      expect(mods.oe).toBe(-1);
      expect(mods.al).toBe(0);
      expect(mods.kd).toBe(0);
    });

    it('returns correct mods for ParryRiposte vs BashingAttack', () => {
      const mods = getStyleMatchupMods(FightingStyle.ParryRiposte, FightingStyle.BashingAttack);
      expect(mods.oe).toBe(-2);
      expect(mods.al).toBe(0);
      expect(mods.kd).toBe(0);
    });

    it('returns correct mods for ParryStrike vs SlashingAttack', () => {
      const mods = getStyleMatchupMods(FightingStyle.ParryStrike, FightingStyle.SlashingAttack);
      expect(mods.oe).toBe(1);
      expect(mods.al).toBe(0);
      expect(mods.kd).toBe(1);
    });

    it('returns correct mods for StrikingAttack vs WallOfSteel', () => {
      const mods = getStyleMatchupMods(FightingStyle.StrikingAttack, FightingStyle.WallOfSteel);
      expect(mods.oe).toBe(2);
      expect(mods.al).toBe(0);
      expect(mods.kd).toBe(1);
    });

    it('returns correct mods for SlashingAttack vs TotalParry', () => {
      const mods = getStyleMatchupMods(FightingStyle.SlashingAttack, FightingStyle.TotalParry);
      expect(mods.oe).toBe(1);
      expect(mods.al).toBe(0);
      expect(mods.kd).toBe(0);
    });

    it('returns correct mods for TotalParry vs LungingAttack', () => {
      const mods = getStyleMatchupMods(FightingStyle.TotalParry, FightingStyle.LungingAttack);
      expect(mods.oe).toBe(-2);
      expect(mods.al).toBe(-1);
      expect(mods.kd).toBe(-1);
    });

    it('returns correct mods for WallOfSteel vs StrikingAttack', () => {
      const mods = getStyleMatchupMods(FightingStyle.WallOfSteel, FightingStyle.StrikingAttack);
      expect(mods.oe).toBe(0);
      expect(mods.al).toBe(1);
      expect(mods.kd).toBe(0);
    });

    it('returns { oe: 0, al: 0, kd: 0 } for unmapped matchers', () => {
      // @ts-expect-error testing invalid enum
      const mods = getStyleMatchupMods('UnknownStyle', FightingStyle.BashingAttack);
      expect(mods.oe).toBe(0);
      expect(mods.al).toBe(0);
      expect(mods.kd).toBe(0);
    });
  });
});
