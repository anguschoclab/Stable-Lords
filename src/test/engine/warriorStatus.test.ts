import { describe, it, expect } from 'vitest';
import { isDead, isRetired, isActive, isFightReady } from '@/engine/warriorStatus';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { WarriorId, InjuryId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';

// Helper to create injury data for isFightReady tests
const makeInjury = (severity: InjuryData['severity'], weeksRemaining: number): InjuryData => ({
  id: 'test-injury' as InjuryId,
  name: 'Test Injury',
  description: 'Test',
  severity,
  weeksRemaining,
  penalties: {},
});

describe('isDead', () => {
  it('returns true when status is Dead', () => {
    const warrior = { status: 'Dead' as const };
    expect(isDead(warrior)).toBe(true);
  });

  it('returns false when status is Active', () => {
    const warrior = { status: 'Active' as const };
    expect(isDead(warrior)).toBe(false);
  });

  it('returns false when status is Retired', () => {
    const warrior = { status: 'Retired' as const };
    expect(isDead(warrior)).toBe(false);
  });

  it('checks status field, not isDead property', () => {
    // Warrior with isDead property but Active status should return false
    const warrior = { status: 'Active' as const, isDead: true } as any;
    expect(isDead(warrior)).toBe(false);
  });

  it('accepts minimal Pick<Warrior, "status"> type', () => {
    const warrior = { status: 'Dead' as const };
    expect(isDead(warrior)).toBe(true);
  });
});

describe('isRetired', () => {
  it('returns true when status is Retired', () => {
    const warrior = { status: 'Retired' as const };
    expect(isRetired(warrior)).toBe(true);
  });

  it('returns false when status is Active', () => {
    const warrior = { status: 'Active' as const };
    expect(isRetired(warrior)).toBe(false);
  });

  it('returns false when status is Dead', () => {
    const warrior = { status: 'Dead' as const };
    expect(isRetired(warrior)).toBe(false);
  });

  it('accepts minimal Pick<Warrior, "status"> type', () => {
    const warrior = { status: 'Retired' as const };
    expect(isRetired(warrior)).toBe(true);
  });
});

describe('isActive', () => {
  it('returns true when status is Active', () => {
    const warrior = { status: 'Active' as const };
    expect(isActive(warrior)).toBe(true);
  });

  it('returns false when status is Dead', () => {
    const warrior = { status: 'Dead' as const };
    expect(isActive(warrior)).toBe(false);
  });

  it('returns false when status is Retired', () => {
    const warrior = { status: 'Retired' as const };
    expect(isActive(warrior)).toBe(false);
  });

  it('accepts minimal Pick<Warrior, "status"> type', () => {
    const warrior = { status: 'Active' as const };
    expect(isActive(warrior)).toBe(true);
  });
});

describe('isFightReady', () => {
  const makeWarrior = (status: 'Active' | 'Dead' | 'Retired', fatigue?: number, injuries?: InjuryData[]): Warrior => ({
    id: 'test-warrior' as WarriorId,
    name: 'Test Warrior',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: {} as any,
    derivedStats: {} as any,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: injuries || [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status,
    fatigue,
    traits: [],
  });

  describe('status checks', () => {
    it('returns false for dead warriors', () => {
      const warrior = makeWarrior('Dead', 0, []);
      expect(isFightReady(warrior)).toBe(false);
    });

    it('returns false for retired warriors', () => {
      const warrior = makeWarrior('Retired', 0, []);
      expect(isFightReady(warrior)).toBe(false);
    });
  });

  describe('fatigue checks', () => {
    it('returns false for active warriors with fatigue >= 50 (regular bout)', () => {
      const warrior = makeWarrior('Active', 50, []);
      expect(isFightReady(warrior, false)).toBe(false);
    });

    it('returns false for active warriors with fatigue > 50 (regular bout)', () => {
      const warrior = makeWarrior('Active', 75, []);
      expect(isFightReady(warrior, false)).toBe(false);
    });

    it('returns true for active warriors with fatigue >= 50 (tournament mode)', () => {
      const warrior = makeWarrior('Active', 50, []);
      expect(isFightReady(warrior, true)).toBe(true);
    });

    it('returns true for active warriors with fatigue > 50 (tournament mode)', () => {
      const warrior = makeWarrior('Active', 75, []);
      expect(isFightReady(warrior, true)).toBe(true);
    });

    it('returns true for active warriors with fatigue < 50 (regular bout)', () => {
      const warrior = makeWarrior('Active', 49, []);
      expect(isFightReady(warrior, false)).toBe(true);
    });
  });

  describe('injury checks', () => {
    it('returns false for active warriors with severe injury (>2 weeks remaining)', () => {
      const warrior = makeWarrior('Active', 0, [makeInjury('Severe', 5)]);
      expect(isFightReady(warrior)).toBe(false);
    });

    it('returns true for active warriors with severe injury (<=2 weeks remaining)', () => {
      const warrior = makeWarrior('Active', 0, [makeInjury('Severe', 2)]);
      expect(isFightReady(warrior)).toBe(true);
    });

    it('returns true for active warriors with no injuries', () => {
      const warrior = makeWarrior('Active', 0, []);
      expect(isFightReady(warrior)).toBe(true);
    });

    it('returns true for active warriors with minor/moderate injuries', () => {
      const warrior = makeWarrior('Active', 0, [makeInjury('Minor', 3), makeInjury('Moderate', 4)]);
      expect(isFightReady(warrior)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles string injuries in array (legacy format - filtered out)', () => {
      const warrior = makeWarrior('Active', 0, ['old-format-injury'] as any);
      expect(isFightReady(warrior)).toBe(true);
    });

    it('handles undefined fatigue (defaults to 0)', () => {
      const warrior = makeWarrior('Active', undefined, []);
      expect(isFightReady(warrior)).toBe(true);
    });

    it('handles null fatigue (defaults to 0)', () => {
      const warrior = makeWarrior('Active', null as any, []);
      expect(isFightReady(warrior)).toBe(true);
    });

    it('handles undefined injuries (defaults to empty array)', () => {
      const warrior = makeWarrior('Active', 0, undefined as any);
      expect(isFightReady(warrior)).toBe(true);
    });

    it('handles null injuries (defaults to empty array)', () => {
      const warrior = makeWarrior('Active', 0, null as any);
      expect(isFightReady(warrior)).toBe(true);
    });

    it('combines fatigue and injury checks correctly', () => {
      const warrior = makeWarrior('Active', 30, []);
      expect(isFightReady(warrior, false)).toBe(true);
    });

    it('returns false when both fatigue and injury checks fail', () => {
      const warrior = makeWarrior('Active', 60, [makeInjury('Severe', 5)]);
      expect(isFightReady(warrior, false)).toBe(false);
    });
  });
});
