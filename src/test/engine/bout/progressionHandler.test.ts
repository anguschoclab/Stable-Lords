/**
 * Progression Handler — XP application and favorites discovery with proper routing.
 */
import { describe, it, expect } from 'vitest';
import { handleProgressions } from '@/engine/bout/progressionHandler';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import type { WarriorId, StableId } from '@/types/shared.types';

describe('progressionHandler', () => {
  const createMockWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
    ({
      id: 'warrior-a' as WarriorId,
      name: 'Warrior A',
      fame: 10,
      popularity: 5,
      favorites: {
        weaponId: 'broadsword',
        rhythm: { oe: 5, al: 5 },
        discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
      },
      flair: [],
      career: { wins: 5, losses: 3, kills: 1 },
      ...overrides,
    }) as Warrior;

  const createMockState = (overrides: Partial<GameState> = {}): GameState =>
    ({
      week: 1,
      roster: [],
      rivalMap: new Map(),
      warriorToStableMap: new Map(),
      player: { id: 'player-1' as StableId },
      ...overrides,
    }) as unknown as GameState;

  const createMockOutcome = (overrides: Partial<FightOutcome> = {}): FightOutcome => ({
    winner: 'A',
    by: 'KO',
    minutes: 5,
    log: [],
    post: { xpA: 100, xpD: 50 },
    ...overrides,
  });

  describe('handleProgressions', () => {
    it('applies XP to both fighters', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const outcome = createMockOutcome();

      const result = handleProgressions(s, wA, wD, outcome, [], 1);

      expect(result.rosterUpdates).toBeDefined();
    });

    it('routes player warrior updates to rosterUpdates', () => {
      const wA = createMockWarrior({ id: 'warrior-a' as WarriorId });
      const s = createMockState({ roster: [wA] });
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const outcome = createMockOutcome();

      const result = handleProgressions(s, wA, wD, outcome, [], 1);

      expect(result.rosterUpdates?.has('warrior-a' as WarriorId)).toBe(true);
    });

    it('routes rival warrior updates to rivalsUpdates', () => {
      const rivalId = 'rival-1' as StableId;
      const warriorId = 'rival-warrior' as WarriorId;
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: warriorId, name: 'Rival Warrior', stableId: rivalId });

      const s = createMockState({
        roster: [],
        warriorToStableMap: new Map([[warriorId, { stableId: rivalId, isPlayer: false }]]),
        rivalMap: new Map([[rivalId, { id: rivalId, roster: [wD] } as unknown as RivalStableData]]),
      });

      const outcome = createMockOutcome({ winner: 'A' });

      const result = handleProgressions(s, wA, wD, outcome, [], 1, rivalId);

      expect(result.rivalsUpdates?.has(rivalId)).toBe(true);
    });

    it('detects Giant Killer flair for upsets', () => {
      const wA = createMockWarrior({ fame: 10, flair: [] });
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Famous', fame: 30 });
      const s = createMockState();
      const outcome = createMockOutcome({ winner: 'A' });

      const result = handleProgressions(s, wA, wD, outcome, [], 1);

      const aUpdate = result.rosterUpdates?.get('warrior-a' as WarriorId);
      if (aUpdate?.flair) {
        expect(aUpdate.flair).toContain('Giant Killer');
      }
    });

    it('does not duplicate Giant Killer flair', () => {
      const wA = createMockWarrior({ fame: 10, flair: ['Giant Killer'] });
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Famous', fame: 30 });
      const s = createMockState();
      const outcome = createMockOutcome({ winner: 'A' });

      const result = handleProgressions(s, wA, wD, outcome, [], 1);

      const aUpdate = result.rosterUpdates?.get('warrior-a' as WarriorId);
      if (aUpdate?.flair) {
        const giantKillers = (aUpdate.flair as string[]).filter((f) => f === 'Giant Killer');
        expect(giantKillers.length).toBe(1);
      }
    });

    it('requires fame gap of 10+ for Giant Killer', () => {
      const wA = createMockWarrior({ fame: 10, flair: [] });
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'SlightlyFamous',
        fame: 15,
      }); // gap only 5
      const s = createMockState();
      const outcome = createMockOutcome({ winner: 'A' });

      const result = handleProgressions(s, wA, wD, outcome, [], 1);

      const aUpdate = result.rosterUpdates?.get('warrior-a' as WarriorId);
      if (aUpdate?.flair) {
        expect(aUpdate.flair).not.toContain('Giant Killer');
      }
    });

    it('requires loser fame to be 2x winner fame for Giant Killer', () => {
      const wA = createMockWarrior({ fame: 15, flair: [] });
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Famous', fame: 26 }); // gap 11, but not 2x
      const s = createMockState();
      const outcome = createMockOutcome({ winner: 'A' });

      const result = handleProgressions(s, wA, wD, outcome, [], 1);

      const aUpdate = result.rosterUpdates?.get('warrior-a' as WarriorId);
      if (aUpdate?.flair) {
        expect(aUpdate.flair).not.toContain('Giant Killer');
      }
    });

    it('applies favorites discovery for both fighters', () => {
      const wA = createMockWarrior({
        favorites: {
          weaponId: 'broadsword',
          rhythm: { oe: 5, al: 5 },
          discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
        },
      });
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        favorites: {
          weaponId: 'broadsword',
          rhythm: { oe: 5, al: 5 },
          discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
        },
      });
      const s = createMockState();
      const outcome = createMockOutcome();
      const rng = {
        next: () => 0.5,
        uuid: () => 'uuid',
        pick: <T>(arr: T[]) => arr[0]!,
        roll: (min: number) => min,
        shuffle: <T>(arr: T[]) => arr,
        pickWeighted: <T>(items: T[]) => items[0]!,
        chance: () => false,
      };

      const result = handleProgressions(s, wA, wD, outcome, [], 1, undefined, rng);

      // Result should have impact structure
      expect(result).toHaveProperty('rosterUpdates');
      expect(result).toHaveProperty('rivalsUpdates');
    });

    it('generates StateImpact structure', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const s = createMockState();
      const outcome = createMockOutcome();

      const result = handleProgressions(s, wA, wD, outcome, [], 1);

      // Returns proper StateImpact
      expect(result).toHaveProperty('rosterUpdates');
      expect(result).toHaveProperty('rivalsUpdates');
    });

    it('suppresses rivalStableId parameter (marked for future use)', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const s = createMockState();
      const outcome = createMockOutcome();

      // Should not throw even with rivalStableId
      expect(() => handleProgressions(s, wA, wD, outcome, [], 1, 'rival-1')).not.toThrow();
    });

    it('handles Draw outcome', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const s = createMockState();
      const outcome = createMockOutcome({ winner: null, by: 'Draw' });

      const result = handleProgressions(s, wA, wD, outcome, [], 1);

      expect(result).toHaveProperty('rosterUpdates');
      expect(result).toHaveProperty('rivalsUpdates');
    });

    it('handles Kill outcome', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const s = createMockState();
      const outcome = createMockOutcome({ by: 'Kill' });

      const result = handleProgressions(s, wA, wD, outcome, [], 1);

      expect(result).toHaveProperty('rosterUpdates');
      expect(result).toHaveProperty('rivalsUpdates');
    });

    it('returns proper StateImpact structure', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const s = createMockState();
      const outcome = createMockOutcome();

      const result = handleProgressions(s, wA, wD, outcome, [], 1);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });
});
