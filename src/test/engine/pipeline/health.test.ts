import { describe, it, expect } from 'vitest';
import { computeHealthImpact, applyHealthUpdates } from '@/engine/health';
import { type GameState, type InjuryData } from '@/types/game';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { WarriorId } from '@/types/shared.types';

function makeInjury(
  name: string,
  weeksRemaining: number,
  overrides: Partial<InjuryData> = {}
): InjuryData {
  return {
    id: `i-${name}` as any,
    name,
    description: 'test',
    severity: 'Minor',
    weeksRemaining,
    penalties: {},
    ...overrides,
  };
}

function makeMockRNG(uuidValue: string = 'test-uuid'): IRNGService {
  return {
    next: () => 0.5,
    uuid: () => uuidValue,
    pick: <T>(arr: T[]): T => arr[0]!,
    roll: (min: number): number => min,
    shuffle: <T>(arr: T[]): T[] => arr,
    pickWeighted: <T>(items: T[]): T => items[0]!,
    chance: (): boolean => true,
  } as any;
}

describe('pipeline/health', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // computeHealthImpact — fatigue decay
  // ─────────────────────────────────────────────────────────────────────────
  describe('computeHealthImpact — fatigue decay', () => {
    it('reduces fatigue by 25 per week', () => {
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', fatigue: 50 }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.rosterUpdates!.get('w1' as WarriorId)?.fatigue).toBe(25);
    });

    it('floors fatigue at 0', () => {
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', fatigue: 10 }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.rosterUpdates!.get('w1' as WarriorId)?.fatigue).toBe(0);
    });

    it('fatigue exactly 25 drops to 0', () => {
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', fatigue: 25 }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.rosterUpdates!.get('w1' as WarriorId)?.fatigue).toBe(0);
    });

    it('no update when fatigue is 0', () => {
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', fatigue: 0 }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.rosterUpdates!.size).toBe(0);
    });

    it('no update when fatigue is undefined', () => {
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A' }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.rosterUpdates!.size).toBe(0);
    });

    it('no update when fatigue is negative', () => {
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', fatigue: -5 }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.rosterUpdates!.size).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // computeHealthImpact — injury ticking
  // ─────────────────────────────────────────────────────────────────────────
  describe('computeHealthImpact — injury ticking', () => {
    it('ticks injuries via real tickInjuries (weeksRemaining decremented)', () => {
      const injury = makeInjury('Bruised Ribs', 3);
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury] }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      const update = impact.rosterUpdates!.get('w1' as WarriorId);
      expect(update?.injuries).toHaveLength(1);
      expect(update?.injuries?.[0]?.weeksRemaining).toBe(2);
    });

    it('filters string-format injuries (legacy), only processes InjuryData objects', () => {
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: ['old_string'] }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.rosterUpdates!.size).toBe(0);
      expect(impact.newsletterItems).toEqual([]);
    });

    it('handles missing/null injuries gracefully', () => {
      const state = {
        week: 5,
        roster: [
          { id: 'w1' as WarriorId, name: 'A' },
          { id: 'w2' as WarriorId, name: 'B', injuries: null },
        ],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.rosterUpdates!.size).toBe(0);
      expect(impact.newsletterItems).toEqual([]);
    });

    it('generates newsletter when injury heals (weeksRemaining reaches 0)', () => {
      const injury = makeInjury('Sprained Wrist', 1);
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury] }],
      } as any as GameState;

      const impact = computeHealthImpact(state, makeMockRNG());

      expect(impact.newsletterItems).toHaveLength(1);
      expect(impact.newsletterItems?.[0]?.items).toContain('A recovered from Sprained Wrist.');
    });

    it('omits newsletter when no injuries heal', () => {
      const injury = makeInjury('Bruised Ribs', 3);
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury] }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.newsletterItems).toEqual([]);
    });

    it('multiple injuries healing on same warrior are joined with ", "', () => {
      const injury1 = makeInjury('Bruised Ribs', 1);
      const injury2 = makeInjury('Sprained Wrist', 1);
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury1, injury2] }],
      } as any as GameState;

      const impact = computeHealthImpact(state, makeMockRNG());

      expect(impact.newsletterItems).toHaveLength(1);
      expect(impact.newsletterItems?.[0]?.items[0]).toBe(
        'A recovered from Bruised Ribs, Sprained Wrist.'
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // computeHealthImpact — combined fatigue + injury
  // ─────────────────────────────────────────────────────────────────────────
  describe('computeHealthImpact — combined fatigue + injury', () => {
    it('same warrior gets both fatigue decay and injury tick in one update', () => {
      const injury = makeInjury('Bruised Ribs', 2);
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', fatigue: 50, injuries: [injury] }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      const update = impact.rosterUpdates!.get('w1' as WarriorId);
      expect(update?.fatigue).toBe(25);
      expect(update?.injuries).toHaveLength(1);
      expect(update?.injuries?.[0]?.weeksRemaining).toBe(1);
    });

    it('warrior with fatigue but no injuries only gets fatigue update', () => {
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', fatigue: 50, injuries: [] }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      const update = impact.rosterUpdates!.get('w1' as WarriorId);
      expect(update?.fatigue).toBe(25);
      expect(update?.injuries).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // computeHealthImpact — RNG
  // ─────────────────────────────────────────────────────────────────────────
  describe('computeHealthImpact — RNG', () => {
    it('uses injected rngService.uuid() for newsletter item ID', () => {
      const injury = makeInjury('Bruised Ribs', 1);
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury] }],
      } as any as GameState;

      const impact = computeHealthImpact(state, makeMockRNG('custom-id-123'));

      expect(impact.newsletterItems?.[0]?.id).toBe('custom-id-123');
    });

    it('falls back to SeededRNGService(state.week) when no RNG provided', () => {
      const injury = makeInjury('Bruised Ribs', 1);
      const state = {
        week: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury] }],
      } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.newsletterItems?.[0]?.id).toBeTruthy();
      expect(typeof impact.newsletterItems?.[0]?.id).toBe('string');
      expect(impact.newsletterItems?.[0]?.id.length).toBeGreaterThan(0);
    });

    it('newsletter item has correct week and title', () => {
      const injury = makeInjury('Bruised Ribs', 1);
      const state = {
        week: 7,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury] }],
      } as any as GameState;

      const impact = computeHealthImpact(state, makeMockRNG());

      expect(impact.newsletterItems?.[0]?.week).toBe(7);
      expect(impact.newsletterItems?.[0]?.title).toBe('Medical Report');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // computeHealthImpact — edge cases
  // ─────────────────────────────────────────────────────────────────────────
  describe('computeHealthImpact — edge cases', () => {
    it('empty roster produces empty updates and newsletter', () => {
      const state = { week: 5, roster: [] } as any as GameState;

      const impact = computeHealthImpact(state);

      expect(impact.rosterUpdates!.size).toBe(0);
      expect(impact.newsletterItems).toEqual([]);
    });

    it("multiple warriors: some heal, some don't — newsletter contains only healed entries", () => {
      const healingInjury = makeInjury('Bruised Ribs', 1);
      const activeInjury = makeInjury('Broken Arm', 5);
      const state = {
        week: 5,
        roster: [
          { id: 'w1' as WarriorId, name: 'Healer', injuries: [healingInjury] },
          { id: 'w2' as WarriorId, name: 'StillHurt', injuries: [activeInjury] },
        ],
      } as any as GameState;

      const impact = computeHealthImpact(state, makeMockRNG());

      expect(impact.rosterUpdates!.size).toBe(2);
      expect(impact.newsletterItems).toHaveLength(1);
      expect(impact.newsletterItems?.[0]?.items).toEqual(['Healer recovered from Bruised Ribs.']);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // applyHealthUpdates — roster updates
  // ─────────────────────────────────────────────────────────────────────────
  describe('applyHealthUpdates — roster updates', () => {
    it('applies fatigue updates to roster', () => {
      const state = {
        week: 5,
        absoluteWeek: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', fatigue: 50 }],
        restStates: [],
        newsletter: [],
      } as any as GameState;

      const newState = applyHealthUpdates(state);

      expect(newState.roster[0]!.fatigue).toBe(25);
    });

    it('applies injury updates to roster', () => {
      const injury = makeInjury('Bruised Ribs', 2);
      const state = {
        week: 5,
        absoluteWeek: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury] }],
        restStates: [],
        newsletter: [],
      } as any as GameState;

      const newState = applyHealthUpdates(state);

      expect(newState.roster[0]!.injuries).toHaveLength(1);
      expect(newState.roster[0]!.injuries[0]!.weeksRemaining).toBe(1);
    });

    it('unchanged warriors retain reference equality; roster array is new', () => {
      const unchangedWarrior = { id: 'w2' as WarriorId, name: 'B', injuries: [] };
      const state = {
        week: 5,
        absoluteWeek: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', fatigue: 50 }, unchangedWarrior],
        restStates: [],
        newsletter: [],
      } as any as GameState;

      const newState = applyHealthUpdates(state);

      expect(newState.roster).not.toBe(state.roster);
      expect(newState.roster[1]).toBe(unchangedWarrior);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // applyHealthUpdates — rest states (real clearExpiredRest)
  // ─────────────────────────────────────────────────────────────────────────
  describe('applyHealthUpdates — rest states', () => {
    it('clears expired rest states (restUntilWeek == week is removed)', () => {
      const state = {
        week: 5,
        absoluteWeek: 5,
        roster: [],
        restStates: [{ warriorId: 'w1' as WarriorId, restUntilWeek: 5 }],
        newsletter: [],
      } as any as GameState;

      const newState = applyHealthUpdates(state);

      expect(newState.restStates).toEqual([]);
    });

    it('preserves non-expired rest states (restUntilWeek > week)', () => {
      const rest = { warriorId: 'w1' as WarriorId, restUntilWeek: 6 };
      const state = {
        week: 5,
        absoluteWeek: 5,
        roster: [],
        restStates: [rest],
        newsletter: [],
      } as any as GameState;

      const newState = applyHealthUpdates(state);

      expect(newState.restStates).toEqual([rest]);
    });

    it('uses absoluteWeek when available (year boundary)', () => {
      const state = {
        week: 1,
        absoluteWeek: 53,
        roster: [],
        restStates: [
          { warriorId: 'w1' as WarriorId, restUntilWeek: 53 },
          { warriorId: 'w2' as WarriorId, restUntilWeek: 54 },
        ],
        newsletter: [],
      } as any as GameState;

      const newState = applyHealthUpdates(state);

      expect(newState.restStates).toEqual([{ warriorId: 'w2' as WarriorId, restUntilWeek: 54 }]);
    });

    it('falls back to week when absoluteWeek is undefined', () => {
      const state = {
        week: 5,
        roster: [],
        restStates: [{ warriorId: 'w1' as WarriorId, restUntilWeek: 5 }],
        newsletter: [],
      } as any as GameState;

      const newState = applyHealthUpdates(state);

      expect(newState.restStates).toEqual([]);
    });

    it('absoluteWeek=0 is used (not fallen back to week)', () => {
      const state = {
        week: 5,
        absoluteWeek: 0,
        roster: [],
        restStates: [{ warriorId: 'w1' as WarriorId, restUntilWeek: 0 }],
        newsletter: [],
      } as any as GameState;

      const newState = applyHealthUpdates(state);

      expect(newState.restStates).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // applyHealthUpdates — newsletter
  // ─────────────────────────────────────────────────────────────────────────
  describe('applyHealthUpdates — newsletter', () => {
    it('appends new newsletter items to existing newsletter array', () => {
      const injury = makeInjury('Bruised Ribs', 1);
      const existingItem = { id: 'old', week: 4, title: 'Old News', items: ['old item'] };
      const state = {
        week: 5,
        absoluteWeek: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury] }],
        restStates: [],
        newsletter: [existingItem],
      } as any as GameState;

      const newState = applyHealthUpdates(state, makeMockRNG());

      expect(newState.newsletter).toHaveLength(2);
      expect(newState.newsletter?.[0]).toBe(existingItem);
      expect(newState.newsletter?.[1]?.title).toBe('Medical Report');
    });

    it('handles undefined newsletter (creates new array)', () => {
      const injury = makeInjury('Bruised Ribs', 1);
      const state = {
        week: 5,
        absoluteWeek: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury] }],
        restStates: [],
      } as any as GameState;

      const newState = applyHealthUpdates(state, makeMockRNG());

      expect(newState.newsletter).toHaveLength(1);
      expect(newState.newsletter?.[0]?.title).toBe('Medical Report');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // applyHealthUpdates — immutability & RNG forwarding
  // ─────────────────────────────────────────────────────────────────────────
  describe('applyHealthUpdates — immutability & RNG forwarding', () => {
    it('does not mutate original state', () => {
      const injury = makeInjury('Bruised Ribs', 2);
      const originalWarrior = { id: 'w1' as WarriorId, name: 'A', fatigue: 50, injuries: [injury] };
      const originalRestStates = [{ warriorId: 'w1' as WarriorId, restUntilWeek: 3 }];
      const originalNewsletter: any[] = [];
      const state = {
        week: 5,
        absoluteWeek: 5,
        roster: [originalWarrior],
        restStates: originalRestStates,
        newsletter: originalNewsletter,
      } as any as GameState;

      applyHealthUpdates(state);

      expect(state.roster[0]!.fatigue).toBe(50);
      expect(state.roster[0]!.injuries[0]!.weeksRemaining).toBe(2);
      expect(state.restStates).toBe(originalRestStates);
      expect(state.restStates).toHaveLength(1);
      expect(state.newsletter).toBe(originalNewsletter);
      expect(state.newsletter).toHaveLength(0);
    });

    it('forwards RNG parameter to computeHealthImpact', () => {
      const injury = makeInjury('Bruised Ribs', 1);
      const state = {
        week: 5,
        absoluteWeek: 5,
        roster: [{ id: 'w1' as WarriorId, name: 'A', injuries: [injury] }],
        restStates: [],
        newsletter: [],
      } as any as GameState;

      const newState = applyHealthUpdates(state, makeMockRNG('forwarded-rng-id'));

      expect(newState.newsletter?.[0]?.id).toBe('forwarded-rng-id');
    });
  });
});
