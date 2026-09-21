import { describe, it, expect } from 'vitest';
import { FightingStyle as S } from '@/types/shared.types';
import {
  ALL_STYLES,
  without,
  FENCING_PREFERRED_STYLES,
  BASHING_STRIKE_STYLES,
  CRUSHING_PREFERRED_STYLES,
  FENCING_RESTRICTED_STYLES,
  SPEAR_RESTRICTED_STYLES,
  HEAVY_RESTRICTED_STYLES,
  CRUSHING_RESTRICTED_STYLES,
  BASHING_RESTRICTED_STYLES,
} from '@/data/equipment/weaponStyles';

const ENUM_ORDER: S[] = [
  S.AimedBlow,
  S.BashingAttack,
  S.LungingAttack,
  S.ParryLunge,
  S.ParryRiposte,
  S.ParryStrike,
  S.SlashingAttack,
  S.StrikingAttack,
  S.TotalParry,
  S.WallOfSteel,
];

describe('weaponStyles module', () => {
  describe('ALL_STYLES', () => {
    it('has exactly 10 styles', () => {
      expect(ALL_STYLES).toHaveLength(10);
    });

    it('matches FightingStyle enum-declaration order', () => {
      expect(ALL_STYLES).toEqual(ENUM_ORDER);
    });
  });

  describe('without()', () => {
    it('returns all styles except the excluded ones, in enum order', () => {
      expect(without(S.BashingAttack, S.WallOfSteel)).toEqual([
        S.AimedBlow,
        S.LungingAttack,
        S.ParryLunge,
        S.ParryRiposte,
        S.ParryStrike,
        S.SlashingAttack,
        S.StrikingAttack,
        S.TotalParry,
      ]);
    });

    it('with no args returns a copy equal to ALL_STYLES but not the same reference', () => {
      const result = without();
      expect(result).toEqual(ALL_STYLES);
      expect(result).not.toBe(ALL_STYLES);
    });

    it('with all styles returns an empty array', () => {
      expect(without(...ALL_STYLES)).toEqual([]);
    });

    it('does not mutate ALL_STYLES', () => {
      const before = [...ALL_STYLES];
      without(S.BashingAttack, S.WallOfSteel);
      expect(ALL_STYLES).toEqual(before);
    });

    it('returns a fresh array each call', () => {
      const a = without(S.BashingAttack);
      const b = without(S.BashingAttack);
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
    });
  });

  describe('named preferredStyles constants', () => {
    it('FENCING_PREFERRED_STYLES = all except bashing & wall-of-steel', () => {
      expect(FENCING_PREFERRED_STYLES).toEqual([
        S.AimedBlow,
        S.LungingAttack,
        S.ParryLunge,
        S.ParryRiposte,
        S.ParryStrike,
        S.SlashingAttack,
        S.StrikingAttack,
        S.TotalParry,
      ]);
    });

    it('BASHING_STRIKE_STYLES = [bashing, striking]', () => {
      expect(BASHING_STRIKE_STYLES).toEqual([S.BashingAttack, S.StrikingAttack]);
    });

    it('CRUSHING_PREFERRED_STYLES = [bashing, striking, wall-of-steel]', () => {
      expect(CRUSHING_PREFERRED_STYLES).toEqual([
        S.BashingAttack,
        S.StrikingAttack,
        S.WallOfSteel,
      ]);
    });
  });

  describe('named restrictedStyles constants', () => {
    it('FENCING_RESTRICTED_STYLES = [bashing, wall-of-steel]', () => {
      expect(FENCING_RESTRICTED_STYLES).toEqual([S.BashingAttack, S.WallOfSteel]);
    });

    it('SPEAR_RESTRICTED_STYLES = [bashing, slashing, wall-of-steel]', () => {
      expect(SPEAR_RESTRICTED_STYLES).toEqual([
        S.BashingAttack,
        S.SlashingAttack,
        S.WallOfSteel,
      ]);
    });

    it('HEAVY_RESTRICTED_STYLES = [aimed-blow, lunging, parry-lunge, parry-riposte]', () => {
      expect(HEAVY_RESTRICTED_STYLES).toEqual([
        S.AimedBlow,
        S.LungingAttack,
        S.ParryLunge,
        S.ParryRiposte,
      ]);
    });

    it('CRUSHING_RESTRICTED_STYLES = [aimed-blow, lunging, parry-lunge, parry-riposte, slashing, total-parry]', () => {
      expect(CRUSHING_RESTRICTED_STYLES).toEqual([
        S.AimedBlow,
        S.LungingAttack,
        S.ParryLunge,
        S.ParryRiposte,
        S.SlashingAttack,
        S.TotalParry,
      ]);
    });

    it('BASHING_RESTRICTED_STYLES = [aimed-blow, lunging, parry-lunge, parry-riposte, slashing, wall-of-steel]', () => {
      expect(BASHING_RESTRICTED_STYLES).toEqual([
        S.AimedBlow,
        S.LungingAttack,
        S.ParryLunge,
        S.ParryRiposte,
        S.SlashingAttack,
        S.WallOfSteel,
      ]);
    });
  });

  describe('named constants are distinct references (not aliased)', () => {
    it('preferred constants are not aliased to each other', () => {
      expect(FENCING_PREFERRED_STYLES).not.toBe(BASHING_STRIKE_STYLES);
      expect(FENCING_PREFERRED_STYLES).not.toBe(CRUSHING_PREFERRED_STYLES);
      expect(BASHING_STRIKE_STYLES).not.toBe(CRUSHING_PREFERRED_STYLES);
    });

    it('restricted constants are not aliased to each other', () => {
      const restrictedConsts = [
        FENCING_RESTRICTED_STYLES,
        SPEAR_RESTRICTED_STYLES,
        HEAVY_RESTRICTED_STYLES,
        CRUSHING_RESTRICTED_STYLES,
        BASHING_RESTRICTED_STYLES,
      ];
      for (let i = 0; i < restrictedConsts.length; i++) {
        for (let j = i + 1; j < restrictedConsts.length; j++) {
          expect(restrictedConsts[i], `index ${i} aliased to ${j}`).not.toBe(restrictedConsts[j]);
        }
      }
    });
  });
});
