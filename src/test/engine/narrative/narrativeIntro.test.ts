import { describe, it, expect } from 'vitest';
import {
  generateWarriorIntro,
  battleOpener,
  type WarriorIntroData,
} from '@/engine/narrative/narrativeIntro';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);

const baseData: WarriorIntroData = {
  name: 'Rex',
  style: FightingStyle.SlashingAttack,
  weaponId: 'longsword',
  armorId: 'leather',
  helmId: 'open_helm',
};

describe('narrativeIntro', () => {
  describe('generateWarriorIntro', () => {
    it('produces multiple lines with no raw tokens', () => {
      const rng = new SeededRNG(1);
      const lines = generateWarriorIntro(rng, baseData, 12);
      expect(lines.length).toBeGreaterThan(3);
      for (const line of lines) {
        expect(noRawTokens(line)).toBe(true);
      }
    });

    it('includes height line when sz is provided', () => {
      const rng = new SeededRNG(1);
      const lines = generateWarriorIntro(rng, baseData, 12);
      expect(lines[0]).toContain('Rex is');
      expect(lines[0]).toContain(`'`);
    });

    it('omits height line when sz is not provided', () => {
      const rng = new SeededRNG(1);
      const lines = generateWarriorIntro(rng, baseData);
      expect(lines[0]).not.toMatch(/\d+'\d+"/);
    });

    it('includes handedness line', () => {
      const rng = new SeededRNG(1);
      const lines = generateWarriorIntro(rng, baseData, 12);
      expect(lines.some((l) => l.includes('handed') || l.includes('ambidextrous'))).toBe(true);
    });

    it('uses deterministic handedness when provided', () => {
      const rng = new SeededRNG(1);
      const data: WarriorIntroData = { ...baseData, handedness: 'left' };
      const lines = generateWarriorIntro(rng, data, 12);
      expect(lines.some((l) => l.includes('left handed'))).toBe(true);
    });

    it('includes armor line when armorId is provided', () => {
      const rng = new SeededRNG(1);
      const lines = generateWarriorIntro(rng, baseData, 12);
      expect(lines.some((l) => l.includes('armor'))).toBe(true);
    });

    it('includes no-armor line when armorId is absent', () => {
      const rng = new SeededRNG(1);
      const data: WarriorIntroData = { ...baseData, armorId: undefined };
      const lines = generateWarriorIntro(rng, data, 12);
      expect(lines.some((l) => l.includes('without body armor'))).toBe(true);
    });

    it('includes style line', () => {
      const rng = new SeededRNG(1);
      const lines = generateWarriorIntro(rng, baseData, 12);
      expect(lines.some((l) => l.includes('style'))).toBe(true);
    });

    it('includes weapon-fitness statement when attributes are provided', () => {
      const rng = new SeededRNG(1);
      const data: WarriorIntroData = {
        ...baseData,
        attributes: { ST: 12, SZ: 12, SP: 12, DF: 12, WL: 12, CN: 12, CT: 12 } as any,
      };
      const lines = generateWarriorIntro(rng, data, 12);
      expect(lines.some((l) => l.includes('suited') || l.includes('strains'))).toBe(true);
    });

    it('includes backup weapon when provided', () => {
      const rng = new SeededRNG(1);
      const data: WarriorIntroData = { ...baseData, backupWeaponId: 'dagger' };
      const lines = generateWarriorIntro(rng, data, 12);
      expect(lines.some((l) => l.includes('backup'))).toBe(true);
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(generateWarriorIntro(r1, baseData, 12)).toEqual(
        generateWarriorIntro(r2, baseData, 12)
      );
    });
  });

  describe('battleOpener', () => {
    it('returns a non-empty string with no raw tokens', () => {
      const rng = new SeededRNG(1);
      const result = battleOpener(rng, 'Garath', 'Vellis');
      expect(typeof result).toBe('string');
      expect(noRawTokens(result)).toBe(true);
    });

    it('works without attacker/defender names', () => {
      const rng = new SeededRNG(1);
      const result = battleOpener(rng);
      expect(typeof result).toBe('string');
      expect(noRawTokens(result)).toBe(true);
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(battleOpener(r1, 'A', 'B')).toBe(battleOpener(r2, 'A', 'B'));
    });
  });
});
