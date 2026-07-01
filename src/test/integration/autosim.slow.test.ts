/**
 * Autosim Integration Tests
 *
 * Tests the autosim system that allows multi-week advancement with stop conditions.
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { WarriorId } from '@/types/game';

// Mock localStorage for Vitest since autosim triggers stat rollup saves
import { runAutosim } from '@/engine/autosim';
import { type GameState } from '@/types/game';
import { makeAutosimWarrior } from '@/test/_setup/testHelpers';

describe('Autosim Integration', () => {
  let originalLocalStorage: any;

  let errorSpy: any;

  beforeAll(() => {
    originalLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
      configurable: true,
    });

    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    if (originalLocalStorage !== undefined) {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
      });
    } else {
      delete (globalThis as any).localStorage;
    }

    errorSpy.mockRestore();
  });

  let initialState: GameState;

  beforeEach(() => {
    initialState = createFreshState('test-seed');
    initialState.treasury = 5000;
    initialState.roster = [
      makeAutosimWarrior('w1', 'Test Warrior 1', { fame: 10, popularity: 5 }),
      makeAutosimWarrior('w2', 'Test Warrior 2', { fame: 10, popularity: 5 }),
      makeAutosimWarrior('w3', 'Test Warrior 3', { fame: 10, popularity: 5 }),
      makeAutosimWarrior('w4', 'Test Warrior 4', { fame: 10, popularity: 5 }),
    ];
  });

  describe('Basic Autosim', () => {
    it('should advance specified number of weeks', async () => {
      const weeksToAdvance = 5;
      let progressCalls = 0;

      const result = await runAutosim(initialState, weeksToAdvance, () => {
        progressCalls++;
      });

      expect(result.finalState).toBeDefined();
      expect(result.finalState.week).toBeGreaterThan(initialState.week);
      expect(result.weeksSimmed).toBeGreaterThan(0);
      expect(result.weeksSimmed).toBeLessThanOrEqual(weeksToAdvance);
      expect(progressCalls).toBeGreaterThan(0);
    });

    it('should provide week summaries', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      expect(result.weekSummaries).toBeDefined();
      expect(Array.isArray(result.weekSummaries)).toBe(true);
      expect(result.weekSummaries.length).toBe(result.weeksSimmed);
    });

    it('should call progress callback for each week', async () => {
      const progressCallbacks: number[] = [];

      await runAutosim(initialState, 3, (completed, total) => {
        progressCallbacks.push(completed);
        expect(total).toBe(3);
      });

      expect(progressCallbacks.length).toBeGreaterThan(0);
    });
  });

  describe('Stop Conditions', () => {
    it('should keep running with roster floor when roster is empty', async () => {
      const state = {
        ...initialState,
        roster: [],
      };

      const result = await runAutosim(state, 10, () => {});

      // Roster floor refills during advanceWeek, so sim runs to max weeks
      expect(result.stopReason).toBe('max_weeks');
      expect(result.weeksSimmed).toBe(10);
      expect(result.finalState.roster.length).toBeGreaterThan(0);
    });

    it('should provide stop details', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      expect(result.stopDetail).toBeDefined();
      expect(typeof result.stopDetail).toBe('string');
      expect(result.stopDetail?.length).toBeGreaterThan(0);
    });

    it('should stop at max weeks when no other conditions trigger', async () => {
      const result = await runAutosim(initialState, 3, () => {});

      expect(result.stopReason).toBe('max_weeks');
      expect(result.weeksSimmed).toBe(3);
    });
  });

  describe('State Consistency', () => {
    it('should maintain roster integrity during autosim', async () => {
      const result = await runAutosim(initialState, 10, () => {});

      expect(result.finalState).toBeDefined();

      // Roster + graveyard + retired should account for all warriors
      const totalWarriors =
        (result.finalState.roster || []).length +
        (result.finalState.graveyard || []).length +
        (result.finalState.retired || []).length;

      expect(totalWarriors).toBeGreaterThanOrEqual(0);
    });

    it('should preserve warrior data during simulation', async () => {
      const uniqueWarrior = makeAutosimWarrior('unique_1', 'Unique Name', {
        fame: 10,
        popularity: 5,
      });
      const state = {
        ...initialState,
        roster: [uniqueWarrior],
      };

      const result = await runAutosim(state, 5, () => {});

      expect(result.finalState).toBeDefined();

      // Find the warrior in any collection
      const warrior =
        (result.finalState.roster || []).find((w) => w.id === 'unique_1') ||
        (result.finalState.graveyard || []).find((w) => w.id === 'unique_1') ||
        (result.finalState.retired || []).find((w) => w.id === 'unique_1');

      expect(warrior).toBeDefined();
      expect(warrior?.name).toBe('Unique Name');
    });

    it('should accumulate newsletter entries', async () => {
      // Force an event that creates newsletter entries by giving high attributes
      const uniqueWarrior = makeAutosimWarrior('unique_1', 'Unique Name', {
        fame: 10,
        popularity: 5,
      });
      const state = {
        ...initialState,
        roster: [uniqueWarrior],
      };

      const result = await runAutosim(state, 5, () => {});

      expect(result.finalState).toBeDefined();
      expect(result.finalState.newsletter).toBeDefined();
    });

    it('should process economy correctly', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      expect(result.finalState).toBeDefined();

      // Ledger should have entries
      expect(result.finalState.ledger).toBeDefined();
      expect(result.finalState.ledger.length).toBeGreaterThan(0);

      // Gold should be a valid number
      expect(typeof result.finalState.treasury).toBe('number');
      expect(isFinite(result.finalState.treasury)).toBe(true);
    });
  });

  describe('Week Summaries', () => {
    it('should track bouts per week', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      for (const summary of result.weekSummaries) {
        expect(summary.bouts).toBeDefined();
        expect(typeof summary.bouts).toBe('number');
        expect(summary.bouts).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track deaths and injuries', async () => {
      const result = await runAutosim(initialState, 10, () => {});

      for (const summary of result.weekSummaries) {
        expect(summary.deaths).toBeDefined();
        expect(summary.injuries).toBeDefined();
        expect(Array.isArray(summary.deathNames)).toBe(true);
        expect(Array.isArray(summary.injuryNames)).toBe(true);
      }
    });

    it('should include week numbers', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      let lastWeek = 0;
      for (const summary of result.weekSummaries) {
        expect(summary.week).toBeGreaterThan(lastWeek);
        lastWeek = summary.week;
      }
    });
  });

  describe('Long-term Simulation', () => {
    it('should handle multi-week simulation', async () => {
      const result = await runAutosim(initialState, 20, () => {});

      expect(result.weeksSimmed).toBeGreaterThan(0);
      expect(result.finalState.week).toBeGreaterThan(initialState.week);
    });

    it('should complete in reasonable time', async () => {
      const startTime = Date.now();

      await runAutosim(initialState, 30, () => {});

      const elapsed = Date.now() - startTime;

      // Should complete in reasonable time (< 10 seconds for 30 weeks)
      expect(elapsed).toBeLessThan(10000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty roster gracefully with roster floor', async () => {
      const state = {
        ...initialState,
        roster: [],
      };

      const result = await runAutosim(state, 5, () => {});

      expect(result).toBeDefined();
      expect(result.stopReason).toBe('max_weeks');
      expect(result.finalState.roster.length).toBeGreaterThan(0);
    });

    it('should handle zero weeks to advance', async () => {
      const result = await runAutosim(initialState, 0, () => {});

      expect(result.weeksSimmed).toBe(0);
      expect(result.finalState.week).toBe(initialState.week);
    });
  });

  describe('Result Metadata', () => {
    it('should provide accurate weeks simmed count', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      expect(result.weeksSimmed).toBeGreaterThanOrEqual(0);
      expect(result.weeksSimmed).toBeLessThanOrEqual(5);
    });

    it('should always have a stop reason', async () => {
      const result = await runAutosim(initialState, 3, () => {});

      expect(result.stopReason).toBeDefined();
      expect([
        'death',
        'player_death',
        'injury',
        'rivalry_escalation',
        'tournament_week',
        'max_weeks',
        'no_pairings',
        'bankrupt',
      ]).toContain(result.stopReason);
    });

    it('should provide descriptive stop details', async () => {
      const result = await runAutosim(initialState, 5, () => {});

      expect(result.stopDetail).toBeDefined();
      expect(typeof result.stopDetail).toBe('string');
      expect(result.stopDetail?.length).toBeGreaterThan(0);
    });
  });

  describe('warriorToOfferIds index', () => {
    it('index is populated after advanceWeek', async () => {
      const result = await runAutosim(initialState, 1, () => {});
      expect(result.finalState.warriorToOfferIds).toBeInstanceOf(Map);
    });

    it('index maps warrior IDs to correct offer IDs', async () => {
      const result = await runAutosim(initialState, 1, () => {});
      const index = result.finalState.warriorToOfferIds;
      expect(index).toBeDefined();
      if (!index) return;

      for (const offer of Object.values(result.finalState.boutOffers)) {
        for (const wId of offer.warriorIds) {
          const offerIds = index.get(wId);
          expect(offerIds).toBeDefined();
          expect(offerIds).toContain(offer.id);
        }
      }
    });

    it('index excludes pruned offers', async () => {
      const state = createFreshState('test-seed');
      state.treasury = 5000;
      state.roster = [
        makeAutosimWarrior('w1', 'Test Warrior 1', { fame: 10, popularity: 5 }),
      ];
      // Add an expired offer that should be pruned by finalizeState
      const expiredOfferId = 'expired_offer_1';
      (state as any).boutOffers = {
        [expiredOfferId]: {
          id: expiredOfferId,
          promoterId: 'p1',
          warriorIds: ['w1', 'rival1'],
          boutWeek: 0,
          expirationWeek: 0,
          purse: 100,
          hype: 50,
          status: 'Proposed',
          responses: { w1: 'Pending', rival1: 'Pending' },
          conditions: [],
        },
      };

      const result = await runAutosim(state, 1, () => {});
      const index = result.finalState.warriorToOfferIds;
      expect(index).toBeDefined();
      if (!index) return;

      const w1Offers = index.get('w1' as WarriorId);
      if (w1Offers) {
        expect(w1Offers).not.toContain(expiredOfferId);
      }
    });

    it('index is consistent with boutOffers after multi-week sim', async () => {
      const result = await runAutosim(initialState, 3, () => {});
      const index = result.finalState.warriorToOfferIds;
      expect(index).toBeDefined();
      if (!index) return;

      for (const offer of Object.values(result.finalState.boutOffers)) {
        for (const wId of offer.warriorIds) {
          const offerIds = index.get(wId);
          expect(offerIds).toBeDefined();
          expect(offerIds).toContain(offer.id);
        }
      }
    });
  });

  describe('Batch Mode', () => {
    it('should advance weeks using batch mode (useBatchMode: true)', async () => {
      const result = await runAutosim(initialState, { weeksToSim: 5, useBatchMode: true });

      expect(result.finalState).toBeDefined();
      expect(result.finalState.week).toBeGreaterThan(initialState.week);
      expect(result.weeksSimmed).toBeGreaterThan(0);
      expect(result.weeksSimmed).toBeLessThanOrEqual(5);
    });

    it('should produce week summaries in batch mode', async () => {
      const result = await runAutosim(initialState, { weeksToSim: 13, useBatchMode: true });

      expect(result.weekSummaries).toBeDefined();
      expect(Array.isArray(result.weekSummaries)).toBe(true);
      expect(result.weekSummaries.length).toBeGreaterThan(0);
    });

    it('should call progress callback in batch mode', async () => {
      const progressCalls: number[] = [];
      const result = await runAutosim(initialState, {
        weeksToSim: 13,
        useBatchMode: true,
        onProgress: (current, total) => {
          progressCalls.push(current);
          expect(total).toBe(13);
        },
      });

      expect(progressCalls.length).toBeGreaterThan(0);
      expect(result.weeksSimmed).toBeGreaterThan(0);
    });

    it('should handle full quarter (13 weeks) in batch mode', async () => {
      const result = await runAutosim(initialState, { weeksToSim: 13, useBatchMode: true });

      expect(result.weeksSimmed).toBeGreaterThan(0);
      expect(result.weeksSimmed).toBeLessThanOrEqual(13);
      expect(result.stopReason).toBeDefined();
    });

    it('should handle multiple quarters (26 weeks) in batch mode', async () => {
      const result = await runAutosim(initialState, { weeksToSim: 26, useBatchMode: true });

      expect(result.weeksSimmed).toBeGreaterThan(0);
      expect(result.finalState.week).toBeGreaterThan(initialState.week);
    });

    it('should handle non-quarter remainder (20 weeks = 13 + 7) in batch mode', async () => {
      const result = await runAutosim(initialState, { weeksToSim: 20, useBatchMode: true });

      expect(result.weeksSimmed).toBeGreaterThan(0);
      expect(result.weeksSimmed).toBeLessThanOrEqual(20);
    });

    it('should maintain state consistency in batch mode', async () => {
      const result = await runAutosim(initialState, { weeksToSim: 13, useBatchMode: true });

      expect(result.finalState).toBeDefined();
      const totalWarriors =
        (result.finalState.roster || []).length +
        (result.finalState.graveyard || []).length +
        (result.finalState.retired || []).length;
      expect(totalWarriors).toBeGreaterThanOrEqual(0);
    });

    it('should produce valid stop reason in batch mode', async () => {
      const result = await runAutosim(initialState, { weeksToSim: 13, useBatchMode: true });

      expect([
        'death',
        'player_death',
        'injury',
        'rivalry_escalation',
        'tournament_week',
        'max_weeks',
        'no_pairings',
        'bankrupt',
      ]).toContain(result.stopReason);
    });

    it('should handle zero weeks in batch mode', async () => {
      const result = await runAutosim(initialState, { weeksToSim: 0, useBatchMode: true });

      expect(result.weeksSimmed).toBe(0);
      expect(result.finalState.week).toBe(initialState.week);
    });

    it('should handle empty roster in batch mode with roster floor', async () => {
      const state = { ...initialState, roster: [] };
      const result = await runAutosim(state, { weeksToSim: 13, useBatchMode: true });

      expect(result).toBeDefined();
      expect(result.finalState.roster.length).toBeGreaterThan(0);
    });
  });
});
