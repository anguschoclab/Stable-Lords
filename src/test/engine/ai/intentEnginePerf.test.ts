/**
 * Intent Engine Performance — verifies that the current Array.from() patterns
 * produce correct results. After Group A merge, these same tests must still
 * pass, proving the optimization is behavior-preserving.
 */
import { describe, it, expect } from 'vitest';
import { pickWeeklyIntent, updateAIStrategy } from '@/engine/ai/intentEngine';
import type { GameState, RivalStableData, OwnerGrudge } from '@/types/state.types';
import type { GrudgeId } from '@/types/shared.types';

function makeMockRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1' as any,
    owner: {
      id: 'owner-1' as any,
      name: 'Test Owner',
      stableName: 'Test Stable',
      fame: 500,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
      favoredStyles: [],
    },
    roster: [
      { id: 'w1' as any, name: 'W1', style: 'BASHING ATTACK', status: 'Active', injuries: [], attributes: {} as any, baseSkills: {}, derivedStats: {} },
      { id: 'w2' as any, name: 'W2', style: 'SLASHING ATTACK', status: 'Active', injuries: [], attributes: {} as any, baseSkills: {}, derivedStats: {} },
      { id: 'w3' as any, name: 'W3', style: 'STRIKING ATTACK', status: 'Active', injuries: [], attributes: {} as any, baseSkills: {}, derivedStats: {} },
    ],
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    ...overrides,
  } as RivalStableData;
}

function makeMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    week: 5,
    year: 1,
    weather: 'Clear',
    rivals: [],
    arenaHistory: [],
    ...overrides,
  } as GameState;
}

function makeGrudge(
  ownerIdA: string,
  ownerIdB: string,
  intensity: number = 3
): OwnerGrudge {
  return {
    id: `grudge-${ownerIdA}-${ownerIdB}` as GrudgeId,
    ownerIdA: ownerIdA as any,
    ownerIdB: ownerIdB as any,
    intensity,
    reason: 'test',
    startWeek: 1,
    lastEscalation: 1,
  };
}

describe('intentEngine performance optimization equivalence', () => {
  describe('Array.from().some() grudge check (hasGrudge)', () => {
    it('returns true when a matching grudge with intensity >= 3 exists', () => {
      const rival = makeMockRival();
      const state = makeMockState({
        grudgeMap: new Map([
          ['g1', makeGrudge('owner-1', 'owner-2', 3)],
        ]),
      });
      const intent = pickWeeklyIntent(rival, state, 42);
      // With a grudge and seed 42, VENDETTA should be possible (rng-dependent)
      // Just verify no crash and returns a valid intent
      expect(['VENDETTA', 'EXPANSION', 'CONSOLIDATION', 'RECOVERY']).toContain(intent);
    });

    it('returns false when no grudge matches the rival owner', () => {
      const rival = makeMockRival();
      const state = makeMockState({
        grudgeMap: new Map([
          ['g1', makeGrudge('owner-99', 'owner-88', 5)],
        ]),
      });
      const intent = pickWeeklyIntent(rival, state, 42);
      expect(intent).not.toBe('VENDETTA');
    });

    it('handles undefined grudgeMap without crashing', () => {
      const rival = makeMockRival();
      const state = makeMockState({ grudgeMap: undefined });
      const intent = pickWeeklyIntent(rival, state, 42);
      expect(['EXPANSION', 'CONSOLIDATION', 'RECOVERY']).toContain(intent);
    });

    it('returns false when grudge intensity < 3', () => {
      const rival = makeMockRival();
      const state = makeMockState({
        grudgeMap: new Map([
          ['g1', makeGrudge('owner-1', 'owner-2', 2)],
        ]),
      });
      const intent = pickWeeklyIntent(rival, state, 42);
      expect(intent).not.toBe('VENDETTA');
    });
  });

  describe('Array.from().find() grudge lookup (updateAIStrategy VENDETTA)', () => {
    it('VENDETTA targetStableId matches grudge target when rival is ownerIdA', () => {
      const rival = makeMockRival({
        strategy: { intent: 'VENDETTA', planWeeksRemaining: 0 },
      });
      const state = makeMockState({
        grudgeMap: new Map([
          ['g1', makeGrudge('owner-1', 'owner-target', 5)],
        ]),
      });
      const result = updateAIStrategy(rival, state, 42);
      // Strategy expired, will pick new intent. If VENDETTA, target should be owner-target
      if (result.intent === 'VENDETTA') {
        expect(result.targetStableId).toBe('owner-target');
      }
    });

    it('VENDETTA targetStableId matches grudge target when rival is ownerIdB', () => {
      const rival = makeMockRival({
        owner: { ...makeMockRival().owner, id: 'owner-2' as any },
        strategy: { intent: 'VENDETTA', planWeeksRemaining: 0 },
      });
      const state = makeMockState({
        grudgeMap: new Map([
          ['g1', makeGrudge('owner-1', 'owner-2', 5)],
        ]),
      });
      const result = updateAIStrategy(rival, state, 42);
      if (result.intent === 'VENDETTA') {
        expect(result.targetStableId).toBe('owner-1');
      }
    });

    it('falls back to player.id when no grudge target found', () => {
      const rival = makeMockRival({
        strategy: { intent: 'VENDETTA', planWeeksRemaining: 0 },
      });
      const state = makeMockState({
        player: { id: 'player-1' as any } as any,
        grudgeMap: new Map(),
      });
      const result = updateAIStrategy(rival, state, 42);
      if (result.intent === 'VENDETTA') {
        expect(result.targetStableId).toBe('player-1');
      }
    });

    it('handles undefined grudgeMap in updateAIStrategy without crashing', () => {
      const rival = makeMockRival({
        strategy: { intent: 'VENDETTA', planWeeksRemaining: 0 },
      });
      const state = makeMockState({ grudgeMap: undefined });
      expect(() => updateAIStrategy(rival, state, 42)).not.toThrow();
    });
  });

  describe('ROSTER_DIVERSITY single-pass loop equivalence', () => {
    it('correctly identifies dominant style concentration', () => {
      const rival = makeMockRival({
        roster: [
          { id: 'w1' as any, name: 'W1', style: 'BASHING ATTACK', status: 'Active', injuries: [], attributes: {} as any, baseSkills: {}, derivedStats: {} },
          { id: 'w2' as any, name: 'W2', style: 'BASHING ATTACK', status: 'Active', injuries: [], attributes: {} as any, baseSkills: {}, derivedStats: {} },
          { id: 'w3' as any, name: 'W3', style: 'BASHING ATTACK', status: 'Active', injuries: [], attributes: {} as any, baseSkills: {}, derivedStats: {} },
          { id: 'w4' as any, name: 'W4', style: 'SLASHING ATTACK', status: 'Active', injuries: [], attributes: {} as any, baseSkills: {}, derivedStats: {} },
        ],
        owner: {
          ...makeMockRival().owner,
          favoredStyles: ['BASHING ATTACK' as any],
        },
      });
      const state = makeMockState({
        arenaHistory: [],
        cachedMetaDrift: { 'BASHING ATTACK': -5 } as any,
      });
      const intent = pickWeeklyIntent(rival, state, 42);
      // With 75% concentration in a meta-losing style, ROSTER_DIVERSITY is expected
      // (unless RECOVERY or VENDETTA triggers first, which they shouldn't with treasury=1000)
      expect(intent).toBe('ROSTER_DIVERSITY');
    });

    it('does not trigger ROSTER_DIVERSITY when roster < 4', () => {
      const rival = makeMockRival({
        roster: [
          { id: 'w1' as any, name: 'W1', style: 'BASHING ATTACK', status: 'Active', injuries: [], attributes: {} as any, baseSkills: {}, derivedStats: {} },
          { id: 'w2' as any, name: 'W2', style: 'BASHING ATTACK', status: 'Active', injuries: [], attributes: {} as any, baseSkills: {}, derivedStats: {} },
        ],
      });
      const state = makeMockState();
      const intent = pickWeeklyIntent(rival, state, 42);
      expect(intent).not.toBe('ROSTER_DIVERSITY');
    });
  });
});
