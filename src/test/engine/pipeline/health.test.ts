import { describe, it, expect } from 'vitest';
import { computeHealthImpact } from '@/engine/health';
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

});
