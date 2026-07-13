/**
 * Social impact handlers — unit tests.
 * Tests all 5 handlers in src/engine/impacts/social.ts directly,
 * plus the socialHandlers export map.
 */
import { describe, it, expect } from 'vitest';
import {
  ownerGrudges,
  rivalries,
  playerChallenges,
  playerAvoids,
  unacknowledgedDeaths,
  socialHandlers,
} from '@/engine/impacts/social';
import type { OwnerGrudge, Rivalry } from '@/types/state.types';

function makeGrudge(id: string, ownerIdA: string, ownerIdB: string): OwnerGrudge {
  return {
    id: id as any,
    ownerIdA: ownerIdA as any,
    ownerIdB: ownerIdB as any,
    intensity: 3,
    reason: 'Test grudge',
    startWeek: 1,
    lastEscalation: 1,
  };
}

function makeRivalry(id: string, stableIdA: string, stableIdB: string): Rivalry {
  return {
    id: id as any,
    stableIdA: stableIdA as any,
    stableIdB: stableIdB as any,
    intensity: 3,
    reason: 'Test rivalry',
    startWeek: 1,
  };
}

describe('social impact handlers', () => {
  // ─── ownerGrudges (replace strategy) ──────────────────────────────────

  describe('ownerGrudges', () => {
    it('replaces existing grudges with new array', () => {
      const state: any = { ownerGrudges: [makeGrudge('g1', 'a', 'b')] };
      const newGrudges = [makeGrudge('g2', 'x', 'y'), makeGrudge('g3', 'p', 'q')];
      ownerGrudges(state, newGrudges);
      expect(state.ownerGrudges).toHaveLength(2);
      expect(state.ownerGrudges[0]?.id).toBe('g2');
      expect(state.ownerGrudges[1]?.id).toBe('g3');
    });

    it('overwrites with empty array (clears grudges)', () => {
      const state: any = { ownerGrudges: [makeGrudge('g1', 'a', 'b')] };
      ownerGrudges(state, []);
      expect(state.ownerGrudges).toHaveLength(0);
    });

    it('assigns direct reference (not a copy)', () => {
      const state: any = { ownerGrudges: [] };
      const value = [makeGrudge('g1', 'a', 'b')];
      ownerGrudges(state, value);
      expect(state.ownerGrudges).toBe(value);
    });

    it('does not append to existing grudges', () => {
      const state: any = { ownerGrudges: [makeGrudge('g1', 'a', 'b')] };
      const newGrudges = [makeGrudge('g2', 'x', 'y')];
      ownerGrudges(state, newGrudges);
      expect(state.ownerGrudges).toHaveLength(1);
      expect(state.ownerGrudges[0]?.id).toBe('g2');
    });
  });

  // ─── rivalries (replace strategy) ─────────────────────────────────────

  describe('rivalries', () => {
    it('replaces existing rivalries with new array', () => {
      const state: any = { rivalries: [makeRivalry('r1', 'a', 'b')] };
      const newRivalries = [makeRivalry('r2', 'x', 'y'), makeRivalry('r3', 'p', 'q')];
      rivalries(state, newRivalries);
      expect(state.rivalries).toHaveLength(2);
      expect(state.rivalries[0]?.id).toBe('r2');
      expect(state.rivalries[1]?.id).toBe('r3');
    });

    it('overwrites with empty array', () => {
      const state: any = { rivalries: [makeRivalry('r1', 'a', 'b')] };
      rivalries(state, []);
      expect(state.rivalries).toHaveLength(0);
    });

    it('assigns direct reference (not a copy)', () => {
      const state: any = { rivalries: [] };
      const value = [makeRivalry('r1', 'a', 'b')];
      rivalries(state, value);
      expect(state.rivalries).toBe(value);
    });

    it('does not append to existing rivalries', () => {
      const state: any = { rivalries: [makeRivalry('r1', 'a', 'b')] };
      const newRivalries = [makeRivalry('r2', 'x', 'y')];
      rivalries(state, newRivalries);
      expect(state.rivalries).toHaveLength(1);
      expect(state.rivalries[0]?.id).toBe('r2');
    });
  });

  // ─── playerChallenges (append strategy) ───────────────────────────────

  describe('playerChallenges', () => {
    it('appends values to existing array', () => {
      const state: any = { playerChallenges: ['rival-1'] };
      playerChallenges(state, ['rival-2', 'rival-3']);
      expect(state.playerChallenges).toHaveLength(3);
      expect(state.playerChallenges).toEqual(['rival-1', 'rival-2', 'rival-3']);
    });

    it('handles undefined state.playerChallenges', () => {
      const state: any = { playerChallenges: undefined };
      playerChallenges(state, ['rival-1']);
      expect(state.playerChallenges).toHaveLength(1);
      expect(state.playerChallenges[0]).toBe('rival-1');
    });

    it('appends empty array (no change to existing)', () => {
      const state: any = { playerChallenges: ['rival-1', 'rival-2'] };
      playerChallenges(state, []);
      expect(state.playerChallenges).toHaveLength(2);
      expect(state.playerChallenges).toEqual(['rival-1', 'rival-2']);
    });

    it('appends multiple values', () => {
      const state: any = { playerChallenges: [] };
      playerChallenges(state, ['r1', 'r2', 'r3', 'r4']);
      expect(state.playerChallenges).toHaveLength(4);
    });

    it('creates new array (does not mutate original reference)', () => {
      const original: string[] = ['rival-1'];
      const state: any = { playerChallenges: original };
      playerChallenges(state, ['rival-2']);
      expect(state.playerChallenges).not.toBe(original);
      expect(original).toEqual(['rival-1']);
    });
  });

  // ─── playerAvoids (append strategy) ───────────────────────────────────

  describe('playerAvoids', () => {
    it('appends values to existing array', () => {
      const state: any = { playerAvoids: ['rival-1'] };
      playerAvoids(state, ['rival-2', 'rival-3']);
      expect(state.playerAvoids).toHaveLength(3);
      expect(state.playerAvoids).toEqual(['rival-1', 'rival-2', 'rival-3']);
    });

    it('handles undefined state.playerAvoids', () => {
      const state: any = { playerAvoids: undefined };
      playerAvoids(state, ['rival-1']);
      expect(state.playerAvoids).toHaveLength(1);
      expect(state.playerAvoids[0]).toBe('rival-1');
    });

    it('appends empty array (no change to existing)', () => {
      const state: any = { playerAvoids: ['rival-1', 'rival-2'] };
      playerAvoids(state, []);
      expect(state.playerAvoids).toHaveLength(2);
      expect(state.playerAvoids).toEqual(['rival-1', 'rival-2']);
    });

    it('appends multiple values', () => {
      const state: any = { playerAvoids: [] };
      playerAvoids(state, ['r1', 'r2', 'r3', 'r4']);
      expect(state.playerAvoids).toHaveLength(4);
    });

    it('creates new array (does not mutate original reference)', () => {
      const original: string[] = ['rival-1'];
      const state: any = { playerAvoids: original };
      playerAvoids(state, ['rival-2']);
      expect(state.playerAvoids).not.toBe(original);
      expect(original).toEqual(['rival-1']);
    });
  });

  // ─── unacknowledgedDeaths (append strategy) ───────────────────────────

  describe('unacknowledgedDeaths', () => {
    it('appends values to existing array', () => {
      const state: any = { unacknowledgedDeaths: ['w1'] };
      unacknowledgedDeaths(state, ['w2', 'w3']);
      expect(state.unacknowledgedDeaths).toHaveLength(3);
      expect(state.unacknowledgedDeaths).toEqual(['w1', 'w2', 'w3']);
    });

    it('handles undefined state.unacknowledgedDeaths', () => {
      const state: any = { unacknowledgedDeaths: undefined };
      unacknowledgedDeaths(state, ['w1']);
      expect(state.unacknowledgedDeaths).toHaveLength(1);
      expect(state.unacknowledgedDeaths[0]).toBe('w1');
    });

    it('appends empty array (no change to existing)', () => {
      const state: any = { unacknowledgedDeaths: ['w1', 'w2'] };
      unacknowledgedDeaths(state, []);
      expect(state.unacknowledgedDeaths).toHaveLength(2);
      expect(state.unacknowledgedDeaths).toEqual(['w1', 'w2']);
    });

    it('appends multiple values', () => {
      const state: any = { unacknowledgedDeaths: [] };
      unacknowledgedDeaths(state, ['w1', 'w2', 'w3', 'w4']);
      expect(state.unacknowledgedDeaths).toHaveLength(4);
    });

    it('creates new array (does not mutate original reference)', () => {
      const original: string[] = ['w1'];
      const state: any = { unacknowledgedDeaths: original };
      unacknowledgedDeaths(state, ['w2']);
      expect(state.unacknowledgedDeaths).not.toBe(original);
      expect(original).toEqual(['w1']);
    });
  });

  // ─── socialHandlers map ───────────────────────────────────────────────

  describe('socialHandlers', () => {
    it('has all 5 handler keys', () => {
      expect(Object.keys(socialHandlers).sort()).toEqual([
        'ownerGrudges',
        'playerAvoids',
        'playerChallenges',
        'rivalries',
        'unacknowledgedDeaths',
      ]);
    });

    it('each value is a function', () => {
      expect(typeof socialHandlers.ownerGrudges).toBe('function');
      expect(typeof socialHandlers.rivalries).toBe('function');
      expect(typeof socialHandlers.playerChallenges).toBe('function');
      expect(typeof socialHandlers.playerAvoids).toBe('function');
      expect(typeof socialHandlers.unacknowledgedDeaths).toBe('function');
    });
  });
});
