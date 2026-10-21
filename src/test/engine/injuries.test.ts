import { describe, it, expect } from 'vitest';
import { generateInjury, isTooInjuredToFight } from '@/engine/injuries';
import { computeHealthImpact } from '@/engine/warrior/health';
import { FightingStyle, type WarriorId, type InjuryId } from '@/types/shared.types';
import type { InjuryData } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import { makeGameState, makeWarrior, makeInjury as sharedMakeInjury } from '@/test/_fixtures/factories';

describe('generateInjury', () => {
  const mockWarrior = makeWarrior({
    id: 'test-warrior' as WarriorId,
    name: 'Test Warrior',
    style: FightingStyle.StrikingAttack,
    age: 20,
  });

  const mockOutcome: FightOutcome = {
    winner: 'D',
    by: 'KO',
    minutes: 5,
    log: [],
    post: {
      hitsA: 10,
      hitsD: 5,
      xpA: 10,
      xpD: 10,
      gotKillA: false,
      gotKillD: false,
    },
  };

  it('should generate an ID for an injury', () => {
    const res = generateInjury(mockWarrior, mockOutcome, 'A', 12345);
    expect(res).toBeDefined();
    if (res) {
      expect(res.id).toBeDefined();
      expect(res.name).toBeDefined();
      expect(res.weeksRemaining).toBeGreaterThan(0);
    }
  });
});

describe('isTooInjuredToFight', () => {
  const makeInjury = (severity: InjuryData['severity'], weeksRemaining: number): InjuryData =>
    sharedMakeInjury({ severity, weeksRemaining });

  describe('empty and non-Severe severities', () => {
    it('returns false for empty injury array', () => {
      expect(isTooInjuredToFight([])).toBe(false);
    });

    it('returns false for Minor injuries (any weeksRemaining)', () => {
      expect(isTooInjuredToFight([makeInjury('Minor', 10)])).toBe(false);
    });

    it('returns false for Moderate injuries (any weeksRemaining)', () => {
      expect(isTooInjuredToFight([makeInjury('Moderate', 10)])).toBe(false);
    });

    it('returns true for Critical injuries with more than 2 weeks remaining', () => {
      expect(isTooInjuredToFight([makeInjury('Critical', 10)])).toBe(true);
    });

    it('returns true for Permanent injuries with more than 2 weeks remaining', () => {
      expect(isTooInjuredToFight([makeInjury('Permanent', 999)])).toBe(true);
    });
  });

  describe('Severe injury border cases', () => {
    it('returns false when severe injury has exactly 2 weeks remaining (border case)', () => {
      expect(isTooInjuredToFight([makeInjury('Severe', 2)])).toBe(false);
    });

    it('returns false when severe injury has 1 week remaining', () => {
      expect(isTooInjuredToFight([makeInjury('Severe', 1)])).toBe(false);
    });

    it('returns false when severe injury has 0 weeks remaining (healed)', () => {
      expect(isTooInjuredToFight([makeInjury('Severe', 0)])).toBe(false);
    });

    it('returns false when severe injury has negative weeksRemaining (edge case)', () => {
      expect(isTooInjuredToFight([makeInjury('Severe', -1)])).toBe(false);
    });

    it('returns true when severe injury has 3 weeks remaining', () => {
      expect(isTooInjuredToFight([makeInjury('Severe', 3)])).toBe(true);
    });

    it('returns true when severe injury has >2 weeks remaining (6 weeks)', () => {
      expect(isTooInjuredToFight([makeInjury('Severe', 6)])).toBe(true);
    });

    it('returns true when severe injury has >2 weeks remaining (12 weeks)', () => {
      expect(isTooInjuredToFight([makeInjury('Severe', 12)])).toBe(true);
    });
  });

  describe('multiple injury combinations', () => {
    it('returns true when multiple injuries include one severe with >2 weeks', () => {
      const injuries = [makeInjury('Minor', 1), makeInjury('Moderate', 2), makeInjury('Severe', 5)];
      expect(isTooInjuredToFight(injuries)).toBe(true);
    });

    it('returns false when multiple injuries but none are severe with >2 weeks', () => {
      const injuries = [makeInjury('Minor', 1), makeInjury('Moderate', 2), makeInjury('Severe', 2)];
      expect(isTooInjuredToFight(injuries)).toBe(false);
    });

    it('returns true when multiple severe injuries, at least one with >2 weeks', () => {
      const injuries = [makeInjury('Severe', 1), makeInjury('Severe', 5)];
      expect(isTooInjuredToFight(injuries)).toBe(true);
    });

    it('returns false when multiple severe injuries but all have <=2 weeks', () => {
      const injuries = [makeInjury('Severe', 1), makeInjury('Severe', 2)];
      expect(isTooInjuredToFight(injuries)).toBe(false);
    });

    it('short-circuits on first matching injury (some() behavior)', () => {
      const injuries = [makeInjury('Severe', 10), makeInjury('Severe', 1)];
      expect(isTooInjuredToFight(injuries)).toBe(true);
    });
  });
});

describe('Health System Boundary Testing', () => {
  it('should handle warrior health / injuries correctly at boundaries', () => {
    const mockInjury: InjuryData = {
      id: 'i1' as InjuryId,
      name: 'cut',
      description: 'cut',
      severity: 'Minor',
      weeksRemaining: -1,
      penalties: {},
    };

    const mockInjury2: InjuryData = {
      id: 'i2' as InjuryId,
      name: 'bruise',
      description: 'bruise',
      severity: 'Minor',
      weeksRemaining: 0,
      penalties: {},
    };

    const mockState = makeGameState({
      week: 5,
      roster: [
        makeWarrior({ id: 'w1' as WarriorId, name: 'Warrior 1', injuries: [mockInjury] }),
        makeWarrior({ id: 'w2' as WarriorId, name: 'Warrior 2', injuries: [mockInjury2] }),
      ],
    });

    const impact = computeHealthImpact(mockState);

    expect(impact.rosterUpdates?.get('w1' as WarriorId)?.injuries).toEqual([]);
    expect(impact.rosterUpdates?.get('w2' as WarriorId)?.injuries).toEqual([]);

    expect(impact.newsletterItems?.[0]!.items).toContain('Warrior 1 recovered from cut.');
    expect(impact.newsletterItems?.[0]!.items).toContain('Warrior 2 recovered from bruise.');
  });
});

describe('generateInjury — limb-hit coupling', () => {
  const warrior = makeWarrior({
    id: 'limb-test' as WarriorId,
    name: 'Limb Test',
    style: FightingStyle.StrikingAttack,
    age: 20,
  });

  const basePost = {
    hitsA: 10,
    hitsD: 10,
    xpA: 10,
    xpD: 10,
    gotKillA: false,
    gotKillD: false,
  };

  const outcome = (post: Record<string, number>): FightOutcome => ({
    winner: 'D',
    by: 'KO',
    minutes: 5,
    log: [],
    post: { ...basePost, ...post },
  });

  /** Collect generated injuries across a deterministic seed sweep. */
  const collect = (out: FightOutcome, side: 'A' | 'D', seeds: number) => {
    const found: InjuryData[] = [];
    for (let s = 0; s < seeds; s++) {
      const inj = generateInjury(warrior, out, side, s);
      if (inj) found.push(inj);
    }
    return found;
  };

  it('high arm-hit attrition yields only arm injuries', () => {
    const injuries = collect(outcome({ armHitsA: 6 }), 'A', 400);
    expect(injuries.length).toBeGreaterThan(0);
    for (const inj of injuries) {
      expect(['Right Arm', 'Left Arm']).toContain(inj.location);
    }
  });

  it('high leg-hit attrition yields leg injuries where the tier has them', () => {
    const injuries = collect(outcome({ legHitsA: 6 }), 'A', 400);
    expect(injuries.length).toBeGreaterThan(0);
    expect(injuries.some((i) => ['Right Leg', 'Left Leg'].includes(i.location ?? ''))).toBe(true);
    // Severity tiers with no leg entry fall back to the full pool — only
    // assert that the bias actually produced leg injuries at all.
    for (const inj of injuries) {
      if (['Minor', 'Severe'].includes(inj.severity)) {
        expect(['Right Leg', 'Left Leg']).toContain(inj.location);
      }
    }
  });

  it('without limb attrition the pool is unweighted (non-arm injuries appear)', () => {
    const injuries = collect(outcome({}), 'A', 400);
    expect(injuries.length).toBeGreaterThan(0);
    expect(injuries.some((i) => !['Right Arm', 'Left Arm'].includes(i.location ?? ''))).toBe(true);
  });
});
