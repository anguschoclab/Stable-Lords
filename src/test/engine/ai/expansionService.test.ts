import { describe, it, expect, beforeEach } from 'vitest';
import { ExpansionService } from '@/engine/ai/expansionService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { SeededRNGService } from '@/utils/random';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { ATTRS_10 } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { GameState, RivalStableData, Warrior } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import {
  WORLD_RIVAL_FLOOR,
  WORLD_RIVAL_HARD_CAP,
  EXPANSION_MAX_PER_CHURN,
} from '@/constants/world';

function makeFounder(name: string): Warrior {
  return makeWarrior(undefined, name, FightingStyle.StrikingAttack, ATTRS_10, {
    age: 45,
    fame: 1600,
    career: { wins: 60, losses: 12, kills: 4 },
  });
}

/** Clone a template stable `count` times with distinct branded ids/names. */
function padRivals(template: RivalStableData, count: number): RivalStableData[] {
  return Array.from({ length: count }, (_, i) => ({
    ...template,
    id: `rival-${i}` as StableId,
    owner: { ...template.owner, stableName: `Stable ${i}` },
    roster: [],
  }));
}

describe('ExpansionService', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
    state.rivals = state.rivals.slice(0, 5); // Reduce to 5 stables
    state.legacyFounderQueue = [];
  });

  describe('processExpansion', () => {
    it('returns updated state plus minted stables with origin tags', () => {
      const { updatedState, minted } = ExpansionService.processExpansion(
        state,
        new SeededRNGService(12345)
      );

      expect(Array.isArray(updatedState.rivals)).toBe(true);
      expect(Array.isArray(minted)).toBe(true);
      minted.forEach((m) => {
        expect(['legacy', 'floor-refill', 'organic']).toContain(m.origin);
      });
    });

    it('refills toward the floor, bounded by EXPANSION_MAX_PER_CHURN', () => {
      const { updatedState, minted } = ExpansionService.processExpansion(
        state,
        new SeededRNGService(1)
      );

      expect(minted.length).toBeGreaterThan(0);
      expect(minted.length).toBeLessThanOrEqual(EXPANSION_MAX_PER_CHURN);
      expect(updatedState.rivals.length).toBe(5 + minted.length);
      minted.forEach((m) => expect(m.origin).toBe('floor-refill'));
    });

    it('does not refill when the world is already at the floor', () => {
      state.rivals = padRivals(state.rivals[0]!, WORLD_RIVAL_FLOOR);

      const { minted } = ExpansionService.processExpansion(state, new SeededRNGService(12345));

      // No floor refill; organic licensing may fire but the count must not
      // exceed floor + batch budget.
      minted.forEach((m) => expect(m.origin).not.toBe('floor-refill'));
    });

    it('consumes legacy founders from state.legacyFounderQueue additively', () => {
      state.rivals = padRivals(state.rivals[0]!, WORLD_RIVAL_FLOOR);
      state.legacyFounderQueue = [makeFounder('Legend A'), makeFounder('Legend B')];

      const { updatedState, minted } = ExpansionService.processExpansion(
        state,
        new SeededRNGService(12345)
      );

      const legacy = minted.filter((m) => m.origin === 'legacy');
      expect(legacy.length).toBe(2);
      expect(updatedState.legacyFounderQueue?.length ?? 0).toBe(0);
      // Additive: founders open stables even at the floor
      expect(updatedState.rivals.length).toBeGreaterThan(WORLD_RIVAL_FLOOR);
    });

    it('legacy founders get lineage fields and a head trainer', () => {
      const founder = makeFounder('Legend A');
      state.legacyFounderQueue = [founder];

      const { minted } = ExpansionService.processExpansion(state, new SeededRNGService(12345));

      const legacy = minted.find((m) => m.origin === 'legacy');
      expect(legacy).toBeDefined();
      if (legacy) {
        const o = legacy.stable.owner;
        expect(o.name).toBe('Legend A');
        expect(o.backstoryId).toBe('gladiator');
        expect(o.foundedByWarriorId).toBe(founder.id);
        expect(o.foundedByWarriorName).toBe('Legend A');
        expect(o.personality).toBeDefined();
        expect(o.favoredStyles).toContain(FightingStyle.StrikingAttack);
        expect((legacy.stable.trainers ?? []).length).toBeGreaterThan(0);
      }
    });

    it('leaves queued founders past the hard cap waiting', () => {
      state.rivals = padRivals(state.rivals[0]!, WORLD_RIVAL_HARD_CAP);
      state.legacyFounderQueue = [makeFounder('Waiting Legend')];

      const { updatedState, minted } = ExpansionService.processExpansion(
        state,
        new SeededRNGService(12345)
      );

      expect(minted.length).toBe(0);
      expect(updatedState.rivals.length).toBe(WORLD_RIVAL_HARD_CAP);
      expect(updatedState.legacyFounderQueue?.some((w) => w.name === 'Waiting Legend')).toBe(true);
    });

    it('generated stables have valid structure', () => {
      const { minted } = ExpansionService.processExpansion(state, new SeededRNGService(12345));

      minted.forEach(({ stable }) => {
        expect(stable.id).toBeDefined();
        expect(stable.owner).toBeDefined();
        expect(stable.owner.name).toBeDefined();
        expect(stable.owner.stableName).toBeDefined();
        expect(Array.isArray(stable.roster)).toBe(true);
      });
    });

    it('is deterministic with the same seed', () => {
      const { minted: m1 } = ExpansionService.processExpansion(state, new SeededRNGService(12345));
      const { minted: m2 } = ExpansionService.processExpansion(state, new SeededRNGService(12345));

      expect(m1.length).toBe(m2.length);
      if (m1.length > 0 && m2.length > 0) {
        expect(m1[0]!.stable.owner.name).toBe(m2[0]!.stable.owner.name);
      }
    });
  });
});
