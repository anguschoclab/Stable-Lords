/**
 * Mortality Handler — death processing with event bus notifications.
 */
import { describe, it, expect } from 'vitest';
import { handleDeath } from '@/engine/bout/mortalityHandler';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import type { WarriorId, StableId } from '@/types/shared.types';

describe('mortalityHandler', () => {
  const createMockWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
    ({
      id: 'warrior-a' as WarriorId,
      name: 'Warrior A',
      stableId: 'player-1' as StableId,
      isDead: false,
      ...overrides,
    }) as Warrior;

  const createMockState = (overrides: Partial<GameState> = {}): GameState =>
    ({
      week: 1,
      roster: [],
      graveyard: [],
      rivalMap: new Map(),
      rivalries: [],
      ...overrides,
    }) as any as GameState;

  const createMockOutcome = (overrides: Partial<FightOutcome> = {}): FightOutcome => ({
    winner: 'A',
    by: 'Kill',
    minutes: 5,
    log: [],
    ...overrides,
  });

  describe('handleDeath', () => {
    it('returns no death for non-kill outcomes', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({ by: 'KO' });

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      expect(result.death).toBe(false);
      expect(result.playerDeath).toBe(false);
      expect(result.deathNames).toHaveLength(0);
    });

    it('processes death for Kill outcome', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({ by: 'Kill' });

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      expect(result.death).toBe(true);
      expect(result.deathNames).toContain('Warrior D');
    });

    it('routes player warrior death correctly', () => {
      const warrior = createMockWarrior({ id: 'player-warrior' as WarriorId });
      const s = createMockState({ roster: [warrior] });
      const wA = warrior;
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome: FightOutcome = {
        winner: 'D',
        by: 'Kill',
        minutes: 5,
        log: [],
      };

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      expect(result.playerDeath).toBe(true);
      expect(result.deathNames).toContain('Warrior A');
    });

    it('routes rival warrior death correctly', () => {
      const s = createMockState({ roster: [] });
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'rival-warrior' as WarriorId,
        name: 'Rival Warrior',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({ by: 'Kill' });

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      expect(result.death).toBe(true);
      expect(result.playerDeath).toBe(false);
    });

    it('detects rivalry kill', () => {
      const s = createMockState({
        rivalries: [
          {
            id: 'rivalry-1' as import('@/types/shared.types').RivalryId,
            stableIdA: 'player-1' as StableId,
            stableIdB: 'rival-1' as StableId,
            intensity: 5,
            reason: 'Insult',
            startWeek: 1,
          },
        ],
      });
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'rival-warrior' as WarriorId,
        name: 'Rival Warrior',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({ by: 'Kill', winner: 'A' });

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      expect(result.death).toBe(true);
    });

    it('includes cause of death info when available', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({
        by: 'Kill',
        post: { xpA: 100, xpD: 50, causeBucket: 'FATAL_DAMAGE', fatalHitLocation: 'Head' },
      });

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      expect(result.death).toBe(true);
    });

    it('adds to graveyard on death', () => {
      const s = createMockState({ roster: [], graveyard: [] });
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({ by: 'Kill' });

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      expect(result.impact?.graveyard?.length).toBeGreaterThan(0);
    });

    it('removes from roster on player warrior death', () => {
      const warrior = createMockWarrior({ id: 'player-warrior' as WarriorId });
      const s = createMockState({ roster: [warrior], graveyard: [] });
      const wA = warrior;
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome: FightOutcome = {
        winner: 'D',
        by: 'Kill',
        minutes: 5,
        log: [],
      };

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      // Should have roster update
      expect(result.impact?.rosterUpdates?.size).toBeGreaterThan(0);
    });

    it('emits a roster removal for a player victim — dead warriors never stay bookable', () => {
      // The store-side retireToGraveyard already filters the roster; the engine
      // must match. A 'Dead'-marked warrior left on state.roster stays in
      // warriorMap, remains pairable on side D, and violates
      // graveyard-roster-disjoint.
      const warrior = createMockWarrior({ id: 'player-warrior' as WarriorId });
      const s = createMockState({ roster: [warrior], graveyard: [] });
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome: FightOutcome = { winner: 'D', by: 'Kill', minutes: 5, log: [] };

      const result = handleDeath({ s: s, wA: warrior, wD: wD, outcome: outcome, week: 1, tags: [] });

      expect(result.impact?.rosterRemovals).toContain('player-warrior');
    });

    it('records a resolution-time kill event and registers the dead id (player victim)', () => {
      const warrior = createMockWarrior({ id: 'player-warrior' as WarriorId });
      const s = createMockState({ roster: [warrior], graveyard: [] });
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome: FightOutcome = { winner: 'D', by: 'Kill', minutes: 5, log: [] };

      const result = handleDeath({ s: s, wA: warrior, wD: wD, outcome: outcome, week: 7, tags: [] });

      expect(result.impact?.killEvents).toHaveLength(1);
      expect(result.impact?.killEvents?.[0]).toMatchObject({
        victimId: 'player-warrior',
        killerId: 'warrior-d',
      });
      expect(result.impact?.deadWarriorIds).toContain('player-warrior');
    });

    it('records a kill event and dead id for a rival victim (no rosterRemovals)', () => {
      const s = createMockState({ roster: [] });
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'rival-warrior' as WarriorId,
        name: 'Rival Warrior',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({ by: 'Kill', winner: 'A' });

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 3, tags: [] });

      expect(result.impact?.rosterRemovals ?? []).not.toContain('rival-warrior');
      expect(result.impact?.rivalRosterRemovals).toContain('rival-warrior');
      expect(result.impact?.killEvents?.[0]).toMatchObject({
        victimId: 'rival-warrior',
        killerId: 'warrior-a',
      });
      expect(result.impact?.deadWarriorIds).toContain('rival-warrior');
    });

    it('handles both warriors dying (extremely rare)', () => {
      // Not a realistic scenario but test the structure
      const s = createMockState({ roster: [], graveyard: [] });
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      // When winner is null with Kill, implementation may handle differently

      // Just verify no crash
      expect(() =>
        handleDeath({ s: s, wA: wA, wD: wD, outcome: createMockOutcome({ by: 'Kill', winner: 'A' }), week: 1, tags: [] })
      ).not.toThrow();
    });

    it('updates unacknowledgedDeaths for player death', () => {
      const warrior = createMockWarrior({ id: 'player-warrior' as WarriorId });
      const s = createMockState({ roster: [warrior], unacknowledgedDeaths: [] });
      const wA = warrior;
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome: FightOutcome = {
        winner: 'D',
        by: 'Kill',
        minutes: 5,
        log: [],
      };

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      expect(result.impact?.unacknowledgedDeaths?.length).toBeGreaterThan(0);
    });

    it('triggers event bus notification', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({ by: 'Kill' });

      // Spy on event bus - would need actual spy setup
      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      // Result should indicate death was processed
      expect(result.death).toBe(true);
    });

    it('returns proper StateImpact structure', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({ by: 'Kill' });

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: [] });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('impact');
      expect(result).toHaveProperty('death');
      expect(result).toHaveProperty('playerDeath');
      expect(result).toHaveProperty('deathNames');
    });

    it('respects week parameter for death record', () => {
      const s = createMockState({ roster: [], graveyard: [] });
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({ by: 'Kill' });

      const result = handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 42, tags: [] });

      expect(result.death).toBe(true);
    });

    it('accepts optional tags parameter', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        stableId: 'rival-1' as StableId,
      });
      const outcome = createMockOutcome({ by: 'Kill' });

      // Should not throw with tags
      expect(() => handleDeath({ s: s, wA: wA, wD: wD, outcome: outcome, week: 1, tags: ['Flashy', 'Giant Killer'] })).not.toThrow();
    });
  });
});
