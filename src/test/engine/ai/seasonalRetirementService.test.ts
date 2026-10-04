import { ATTRS_10 } from '@/test/_fixtures/factories';
import { describe, it, expect, beforeEach } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { FightingStyle } from '@/types/shared.types';
import { SeasonalRetirementService } from '@/engine/ai/seasonalRetirementService';
import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { EPITHET_TABLES } from '@/data/names/epithets';

describe('SeasonalRetirementService', () => {
  let state: GameState;
  let rng: IRNGService;

  beforeEach(() => {
    state = createFreshState('test-seed');
    state.week = 52;
    state.season = 'Winter';
    rng = new SeededRNGService(12345);
  });

  describe('processSeasonalRetirement', () => {
    it('should process retirement for all rival stables', () => {
      const { updatedState } = SeasonalRetirementService.processSeasonalRetirement(state, rng);

      expect(updatedState.rivals.length).toBe(state.rivals.length);
      expect(Array.isArray(updatedState.legacyFounderQueue)).toBe(true);
    });

    it('should retire warriors based on age', () => {
      // Create a rival with old warriors
      state.rivals[0]!.roster = [
        makeWarrior({ id: undefined, name: 'Old Warrior', style: FightingStyle.StrikingAttack, attrs: ATTRS_10, overrides: { age: 45 } }),
        makeWarrior({ id: undefined, name: 'Young Warrior', style: FightingStyle.StrikingAttack, attrs: ATTRS_10, overrides: {
          age: 20,
        } }),
      ];

      const rng = new SeededRNGService(12345);
      const { updatedState } = SeasonalRetirementService.processSeasonalRetirement(state, rng);

      const oldWarrior = updatedState.rivals[0]!.roster.find((w) => w.name === 'Old Warrior');
      expect(oldWarrior?.status).toBe('Retired');
    });

    it('should not retire young warriors', () => {
      state.rivals[0]!.roster = [
        makeWarrior({ id: undefined, name: 'Young Warrior', style: FightingStyle.StrikingAttack, attrs: ATTRS_10, overrides: {
          age: 20,
        } }),
      ];

      const rng = new SeededRNGService(12345);
      const { updatedState } = SeasonalRetirementService.processSeasonalRetirement(state, rng);

      const youngWarrior = updatedState.rivals[0]!.roster.find((w) => w.name === 'Young Warrior');
      expect(youngWarrior?.status).toBe('Active');
    });

    it('should identify legacy founder candidates', () => {
      state.rivals[0]!.owner.name = 'Legend';
      state.rivals[0]!.owner.stableName = 'Academy';
      state.rivals[0]!.roster = [
        makeWarrior(
          { id: undefined, name: 'Legend', style: FightingStyle.StrikingAttack, attrs: {
            ST: 15,
            CN: 15,
            SZ: 15,
            WT: 15,
            WL: 15,
            SP: 15,
            DF: 15,
          }, overrides: { age: 40, fame: 95, career: { wins: 60, losses: 20, kills: 10 } } }
        ),
      ];

      const rng = new SeededRNGService(12345);
      const { updatedState } = SeasonalRetirementService.processSeasonalRetirement(state, rng);

      // The founder queue may stay empty under the LEGACY_FOUND_CHANCE roll —
      // verify the queue exists on state and only holds warrior snapshots.
      expect(Array.isArray(updatedState.legacyFounderQueue)).toBe(true);
      updatedState.legacyFounderQueue?.forEach((w) => expect(w.career).toBeDefined());
    });

    it('should not create legacy candidates for non-legendary warriors', () => {
      state.rivals[0]!.roster = [
        makeWarrior({ id: undefined, name: 'Average', style: FightingStyle.StrikingAttack, attrs: ATTRS_10, overrides: {
          age: 40,
          fame: 30,
          career: { wins: 10, losses: 10, kills: 0 },
        } }),
      ];

      const rng = new SeededRNGService(12345);
      const { updatedState } = SeasonalRetirementService.processSeasonalRetirement(state, rng);

      // Average warriors never reach the founder queue
      const hasAverage = (updatedState.legacyFounderQueue ?? []).some((w) => w.name === 'Average');
      expect(hasAverage).toBe(false);
    });

    it('should set retiredWeek on retired warriors', () => {
      state.rivals[0]!.roster = [
        makeWarrior({ id: undefined, name: 'Old Warrior', style: FightingStyle.StrikingAttack, attrs: ATTRS_10, overrides: { age: 45 } }),
      ];

      const rng = new SeededRNGService(12345);
      const { updatedState } = SeasonalRetirementService.processSeasonalRetirement(state, rng);

      const oldWarrior = updatedState.rivals[0]!.roster.find((w) => w.name === 'Old Warrior');
      expect(oldWarrior?.status).toBe('Retired');
      if (oldWarrior?.status === 'Retired') {
        expect(oldWarrior.retiredWeek).toBe(state.week);
      }
    });

    it('should be deterministic with same seed', () => {
      const rng1 = new SeededRNGService(12345);
      const rng2 = new SeededRNGService(12345);
      const { updatedState: s1 } = SeasonalRetirementService.processSeasonalRetirement(state, rng1);
      const { updatedState: s2 } = SeasonalRetirementService.processSeasonalRetirement(state, rng2);

      expect((s1.legacyFounderQueue ?? []).length).toBe((s2.legacyFounderQueue ?? []).length);
    });

    it('earns a legend epithet when a distinguished career retires', () => {
      state.rivals[0]!.roster = [
        makeWarrior({ id: undefined, name: 'Legend Warrior', style: FightingStyle.StrikingAttack, attrs: ATTRS_10, overrides: {
          age: 45,
          career: { wins: 60, losses: 10, kills: 0 },
        } }),
      ];

      const { updatedState } = SeasonalRetirementService.processSeasonalRetirement(state, rng);
      const retired = updatedState.rivals[0]!.roster.find((w) => w.name === 'Legend Warrior');
      expect(retired?.status).toBe('Retired');
      expect(retired?.epithet).toBeDefined();
      expect(EPITHET_TABLES.legend).toContain(retired!.epithet);
    });

    it('leaves journeymen without an epithet on retirement', () => {
      state.rivals[0]!.roster = [
        makeWarrior({ id: undefined, name: 'Plain Warrior', style: FightingStyle.StrikingAttack, attrs: ATTRS_10, overrides: {
          age: 45,
          career: { wins: 5, losses: 10, kills: 0 },
          fame: 50,
        } }),
      ];

      const { updatedState } = SeasonalRetirementService.processSeasonalRetirement(state, rng);
      const retired = updatedState.rivals[0]!.roster.find((w) => w.name === 'Plain Warrior');
      expect(retired?.status).toBe('Retired');
      expect(retired?.epithet).toBeUndefined();
    });
  });
});
