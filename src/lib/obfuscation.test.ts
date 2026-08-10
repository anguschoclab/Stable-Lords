import { describe, it, expect } from 'vitest';
import { obfuscateWarrior, type ObfuscatedWarrior } from './obfuscation';
import { FightingStyle } from '@/types/game';
import type { Warrior, InsightToken } from '@/types/game';

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'w1' as Warrior['id'],
    name: 'Test Warrior',
    style: FightingStyle.BashingAttack,
    attributes: { ST: 15, CN: 12, SZ: 10, WT: 8, WL: 6, SP: 4, DF: 22 },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    traits: [],
    equipment: { weapon: 'sword', armor: 'leather', shield: 'buckler' },
    plan: {
      style: FightingStyle.BashingAttack,
      OE: 5,
      AL: 5,
    },
    ...overrides,
  } as Warrior;
}

function makeInsight(
  type: InsightToken['type'],
  warriorId: string,
  targetKey?: string,
): InsightToken {
  return {
    id: `ins-${type}-${warriorId}-${targetKey ?? ''}` as InsightToken['id'],
    type,
    warriorId: warriorId as InsightToken['warriorId'],
    warriorName: 'Test Warrior',
    detail: 'scout report',
    targetKey,
    discoveredWeek: 1,
  } as InsightToken;
}

describe('obfuscateWarrior', () => {
  const warrior = makeWarrior();

  describe('owned by player', () => {
    it('returns fully revealed warrior with isFullyRevealed=true', () => {
      const result = obfuscateWarrior(warrior, [], true);
      expect(result.isFullyRevealed).toBe(true);
      expect(result.style).toBe(warrior.style);
      expect(result.attributes).toEqual(warrior.attributes);
      expect(result.equipment).toEqual(warrior.equipment);
      expect(result.plan).toEqual(warrior.plan);
    });

    it('preserves equipment even when undefined on owned warrior', () => {
      const noEquip = makeWarrior({ equipment: undefined });
      const result = obfuscateWarrior(noEquip, [], true);
      expect(result.equipment).toBe('HIDDEN');
    });
  });

  describe('no insights (enemy warrior)', () => {
    const result = obfuscateWarrior(warrior, [], false);

    it('masks style as UNKNOWN', () => {
      expect(result.style).toBe('UNKNOWN');
    });

    it('hides equipment', () => {
      expect(result.equipment).toBe('HIDDEN');
    });

    it('hides plan', () => {
      expect(result.plan).toBe('HIDDEN');
    });

    it('sets isFullyRevealed=false', () => {
      expect(result.isFullyRevealed).toBe(false);
    });

    it('bands all attributes into qualitative labels', () => {
      // ST=15 → High (13-16), CN=12 → Average (9-12), SZ=10 → Average (9-12),
      // WT=8 → Low (5-8), WL=6 → Low (5-8), SP=4 → Pitiful (<5), DF=22 → Monstrous (>=21)
      expect(result.attributes.ST).toBe('High');
      expect(result.attributes.CN).toBe('Average');
      expect(result.attributes.SZ).toBe('Average');
      expect(result.attributes.WT).toBe('Low');
      expect(result.attributes.WL).toBe('Low');
      expect(result.attributes.SP).toBe('Pitiful');
      expect(result.attributes.DF).toBe('Monstrous');
    });
  });

  describe('attribute banding thresholds', () => {
    it('returns "Monstrous" for values >= 21', () => {
      const w = makeWarrior({ attributes: { ST: 21, CN: 25, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 } });
      const r = obfuscateWarrior(w, [], false);
      expect(r.attributes.ST).toBe('Monstrous');
      expect(r.attributes.CN).toBe('Monstrous');
    });

    it('returns "Exceptional" for values 17-20', () => {
      const w = makeWarrior({ attributes: { ST: 17, CN: 20, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 } });
      const r = obfuscateWarrior(w, [], false);
      expect(r.attributes.ST).toBe('Exceptional');
      expect(r.attributes.CN).toBe('Exceptional');
    });

    it('returns "High" for values 13-16', () => {
      const w = makeWarrior({ attributes: { ST: 13, CN: 16, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 } });
      const r = obfuscateWarrior(w, [], false);
      expect(r.attributes.ST).toBe('High');
      expect(r.attributes.CN).toBe('High');
    });

    it('returns "Average" for values 9-12', () => {
      const w = makeWarrior({ attributes: { ST: 9, CN: 12, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 } });
      const r = obfuscateWarrior(w, [], false);
      expect(r.attributes.ST).toBe('Average');
      expect(r.attributes.CN).toBe('Average');
    });

    it('returns "Low" for values 5-8', () => {
      const w = makeWarrior({ attributes: { ST: 5, CN: 8, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 } });
      const r = obfuscateWarrior(w, [], false);
      expect(r.attributes.ST).toBe('Low');
      expect(r.attributes.CN).toBe('Low');
    });

    it('returns "Pitiful" for values < 5', () => {
      const w = makeWarrior({ attributes: { ST: 4, CN: 1, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 } });
      const r = obfuscateWarrior(w, [], false);
      expect(r.attributes.ST).toBe('Pitiful');
      expect(r.attributes.CN).toBe('Pitiful');
    });
  });

  describe('Style insight', () => {
    it('reveals style when Style insight present', () => {
      const insights = [makeInsight('Style', 'w1')];
      const r = obfuscateWarrior(warrior, insights, false);
      expect(r.style).toBe(warrior.style);
    });

    it('still masks other fields', () => {
      const insights = [makeInsight('Style', 'w1')];
      const r = obfuscateWarrior(warrior, insights, false);
      expect(r.equipment).toBe('HIDDEN');
      expect(r.plan).toBe('HIDDEN');
      expect(r.attributes.ST).toBe('High'); // still banded (15 → High)
    });
  });

  describe('Weapon insight', () => {
    it('reveals equipment when Weapon insight present', () => {
      const insights = [makeInsight('Weapon', 'w1')];
      const r = obfuscateWarrior(warrior, insights, false);
      expect(r.equipment).toEqual(warrior.equipment);
    });
  });

  describe('Rhythm insight', () => {
    it('reveals plan when Rhythm insight present', () => {
      const insights = [makeInsight('Rhythm', 'w1')];
      const r = obfuscateWarrior(warrior, insights, false);
      expect(r.plan).toEqual(warrior.plan);
    });
  });

  describe('Attribute insight', () => {
    it('reveals exact value for targeted attribute', () => {
      const insights = [makeInsight('Attribute', 'w1', 'ST')];
      const r = obfuscateWarrior(warrior, insights, false);
      expect(r.attributes.ST).toBe(15);
    });

    it('leaves non-targeted attributes banded', () => {
      const insights = [makeInsight('Attribute', 'w1', 'ST')];
      const r = obfuscateWarrior(warrior, insights, false);
      expect(r.attributes.CN).toBe('Average'); // 12 → Average (9-12)
    });

    it('reveals multiple attributes with multiple insights', () => {
      const insights = [
        makeInsight('Attribute', 'w1', 'ST'),
        makeInsight('Attribute', 'w1', 'DF'),
      ];
      const r = obfuscateWarrior(warrior, insights, false);
      expect(r.attributes.ST).toBe(15);
      expect(r.attributes.DF).toBe(22);
      expect(r.attributes.CN).toBe('Average');
    });

    it('ignores Attribute insights without targetKey', () => {
      const insights = [makeInsight('Attribute', 'w1')];
      const r = obfuscateWarrior(warrior, insights, false);
      expect(r.attributes.ST).toBe('High');
    });
  });

  describe('insights for other warriors are ignored', () => {
    it('does not reveal anything from insights targeting a different warriorId', () => {
      const insights = [
        makeInsight('Style', 'other'),
        makeInsight('Weapon', 'other'),
        makeInsight('Attribute', 'other', 'ST'),
      ];
      const r = obfuscateWarrior(warrior, insights, false);
      expect(r.style).toBe('UNKNOWN');
      expect(r.equipment).toBe('HIDDEN');
      expect(r.attributes.ST).toBe('High');
    });
  });

  describe('full reveal via combined insights', () => {
    it('reveals all fields when all insight types present', () => {
      const insights = [
        makeInsight('Style', 'w1'),
        makeInsight('Weapon', 'w1'),
        makeInsight('Rhythm', 'w1'),
        makeInsight('Attribute', 'w1', 'ST'),
        makeInsight('Attribute', 'w1', 'CN'),
        makeInsight('Attribute', 'w1', 'SZ'),
        makeInsight('Attribute', 'w1', 'WT'),
        makeInsight('Attribute', 'w1', 'WL'),
        makeInsight('Attribute', 'w1', 'SP'),
        makeInsight('Attribute', 'w1', 'DF'),
      ];
      const r: ObfuscatedWarrior = obfuscateWarrior(warrior, insights, false);
      expect(r.style).toBe(warrior.style);
      expect(r.equipment).toEqual(warrior.equipment);
      expect(r.plan).toEqual(warrior.plan);
      expect(r.attributes).toEqual(warrior.attributes);
      // Even with all insights, isFullyRevealed stays false for enemy warriors
      expect(r.isFullyRevealed).toBe(false);
    });
  });
});
