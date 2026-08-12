import { describe, it, expect } from 'vitest';
import { isDead, isRetired, isActive, isFightReady, isBookable } from '@/engine/warriorStatus';
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { WarriorId, InjuryId } from '@/types/shared.types';
import type { RestState, TrainingAssignment } from '@/types/state.types';
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
  const makeWarrior = (
    status: 'Active' | 'Dead' | 'Retired',
    fatigue?: number,
    injuries?: InjuryData[]
  ): Warrior => ({
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
    it('returns false for active warriors with fatigue > 60 (regular bout)', () => {
      const warrior = makeWarrior('Active', 61, []);
      expect(isFightReady(warrior, false)).toBe(false);
    });

    it('returns false for active warriors with fatigue >> 60 (regular bout)', () => {
      const warrior = makeWarrior('Active', 75, []);
      expect(isFightReady(warrior, false)).toBe(false);
    });

    it('returns true for active warriors with fatigue <= 60 (tournament mode)', () => {
      const warrior = makeWarrior('Active', 60, []);
      expect(isFightReady(warrior, true)).toBe(true);
    });

    it('returns true for active warriors with fatigue >> 60 (tournament mode)', () => {
      const warrior = makeWarrior('Active', 75, []);
      expect(isFightReady(warrior, true)).toBe(true);
    });

    it('returns true for active warriors with fatigue <= 60 (regular bout)', () => {
      const warrior = makeWarrior('Active', 60, []);
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

describe('isBookable', () => {
  const makeBookableWarrior = (
    status: 'Active' | 'Dead' | 'Retired' = 'Active',
    injuries: InjuryData[] = [],
    isDead = false
  ): Warrior => ({
    id: 'test-warrior' as WarriorId,
    name: 'Test Warrior',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: {} as any,
    derivedStats: {} as any,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries,
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status,
    isDead,
    traits: [],
  });

  const noRest: RestState[] = [];
  const noTraining: TrainingAssignment[] = [];
  const targetWeek = 10;

  describe('status checks', () => {
    it('returns true for active, healthy, non-resting, non-training warrior', () => {
      expect(isBookable(makeBookableWarrior(), { restStates: noRest, trainingAssignments: noTraining, targetWeek })).toBe(true);
    });

    it('returns false for dead warrior (status === Dead)', () => {
      expect(isBookable(makeBookableWarrior('Dead'), { restStates: noRest, trainingAssignments: noTraining, targetWeek })).toBe(false);
    });

    it('returns false for retired warrior', () => {
      expect(isBookable(makeBookableWarrior('Retired'), { restStates: noRest, trainingAssignments: noTraining, targetWeek })).toBe(false);
    });

    it('returns false for warrior with isDead: true property even if status is Active', () => {
      expect(isBookable(makeBookableWarrior('Active', [], true), { restStates: noRest, trainingAssignments: noTraining, targetWeek })).toBe(false);
    });
  });

  describe('rest gate', () => {
    it('returns false for warrior with active rest state (restUntilWeek > targetWeek)', () => {
      const restStates: RestState[] = [{ warriorId: 'test-warrior' as WarriorId, restUntilWeek: 12 }];
      expect(isBookable(makeBookableWarrior(), { restStates: restStates, trainingAssignments: noTraining, targetWeek: 10 })).toBe(false);
    });

    it('returns true for warrior with expired rest state (restUntilWeek <= targetWeek)', () => {
      const restStates: RestState[] = [{ warriorId: 'test-warrior' as WarriorId, restUntilWeek: 10 }];
      expect(isBookable(makeBookableWarrior(), { restStates: restStates, trainingAssignments: noTraining, targetWeek: 10 })).toBe(true);
    });

    it('returns true when targetWeek is beyond rest period', () => {
      const restStates: RestState[] = [{ warriorId: 'test-warrior' as WarriorId, restUntilWeek: 5 }];
      expect(isBookable(makeBookableWarrior(), { restStates: restStates, trainingAssignments: noTraining, targetWeek: 10 })).toBe(true);
    });

    it('returns true when rest state is for a different warrior', () => {
      const restStates: RestState[] = [{ warriorId: 'other-warrior' as WarriorId, restUntilWeek: 20 }];
      expect(isBookable(makeBookableWarrior(), { restStates: restStates, trainingAssignments: noTraining, targetWeek: 10 })).toBe(true);
    });
  });

  describe('injury gate', () => {
    it('returns false for warrior with severe injury (>2 weeks remaining)', () => {
      expect(isBookable(makeBookableWarrior('Active', [makeInjury('Severe', 5)]), { restStates: noRest, trainingAssignments: noTraining, targetWeek })).toBe(false);
    });

    it('returns true for warrior with moderate injury (not too injured to fight)', () => {
      expect(isBookable(makeBookableWarrior('Active', [makeInjury('Moderate', 4)]), { restStates: noRest, trainingAssignments: noTraining, targetWeek })).toBe(true);
    });

    it('returns true for warrior with severe injury (<=2 weeks remaining)', () => {
      expect(isBookable(makeBookableWarrior('Active', [makeInjury('Severe', 2)]), { restStates: noRest, trainingAssignments: noTraining, targetWeek })).toBe(true);
    });
  });

  describe('training gate', () => {
    it('returns false for warrior with active training assignment', () => {
      const training: TrainingAssignment[] = [{ warriorId: 'test-warrior' as WarriorId, type: 'trait', weeksRemaining: 3 }];
      expect(isBookable(makeBookableWarrior(), { restStates: noRest, trainingAssignments: training, targetWeek })).toBe(false);
    });

    it('returns true for warrior with no training assignment', () => {
      expect(isBookable(makeBookableWarrior(), { restStates: noRest, trainingAssignments: noTraining, targetWeek })).toBe(true);
    });

    it('returns true when training assignment is for a different warrior', () => {
      const training: TrainingAssignment[] = [{ warriorId: 'other-warrior' as WarriorId, type: 'trait', weeksRemaining: 3 }];
      expect(isBookable(makeBookableWarrior(), { restStates: noRest, trainingAssignments: training, targetWeek })).toBe(true);
    });
  });

  describe('combined gates', () => {
    it('returns false when multiple gates fail simultaneously (rest + injury + training)', () => {
      const restStates: RestState[] = [{ warriorId: 'test-warrior' as WarriorId, restUntilWeek: 20 }];
      const training: TrainingAssignment[] = [{ warriorId: 'test-warrior' as WarriorId, type: 'trait', weeksRemaining: 3 }];
      expect(isBookable(makeBookableWarrior('Active', [makeInjury('Severe', 5)]), { restStates, trainingAssignments: training, targetWeek: 10 })).toBe(false);
    });
  });
});
