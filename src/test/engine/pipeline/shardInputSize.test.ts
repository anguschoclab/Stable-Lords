import { describe, it, expect } from 'vitest';
import {
  narrowRivalShardState,
  runRivalShardChunk,
  buildSuccessorIndex,
} from '@/engine/pipeline/passes/rivalStableShard';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import { makeGameState, makeRival, makeWarrior } from '@/test/_fixtures/factories';
import type { GameState } from '@/types/state.types';

/**
 * Shard payloads cross postMessage via structuredClone — every unread field
 * in the broadcast ctx is pure transport cost, paid once per shard per week.
 * narrowRivalShardState strips the provably-unread heavy fields; the in-line
 * path consumes the SAME narrowed ctx, so equivalence here is what makes the
 * narrowing safe for sequential execution too.
 */

/** A state with populated payload fields so the size bound is meaningful. */
function populatedState(): GameState {
  const rival = makeRival({ id: 'r1' as never });
  return makeGameState({
    rivals: [rival],
    roster: [makeWarrior({ id: 'p1' as never })],
    retired: [makeWarrior({ id: 'r-old' as never, fame: 300, stableId: 'r1' as never })],
    newsletter: Array.from({ length: 20 }, (_, i) => ({
      id: `n${i}`,
      week: i,
      title: `News ${i}`,
      items: ['a'.repeat(200)],
    })),
    gazettes: Array.from({ length: 20 }, (_, i) => ({ id: `g${i}` }) as never),
    matchHistory: Array.from({ length: 50 }, (_, i) => ({ id: `m${i}` }) as never),
    ledger: Array.from({ length: 50 }, (_, i) => ({ id: `l${i}` }) as never),
    deferredBoutLogs: Array.from({ length: 10 }, (_, i) => ({
      year: 1,
      season: 0,
      boutId: `d${i}`,
      transcript: ['x'.repeat(500)],
    })),
  } as Partial<GameState>);
}

describe('narrowRivalShardState', () => {
  it('empties fields the rival shard tree never reads', () => {
    const narrowed = narrowRivalShardState(populatedState());
    expect(narrowed.newsletter).toEqual([]);
    expect(narrowed.gazettes).toEqual([]);
    expect(narrowed.matchHistory).toEqual([]);
    expect(narrowed.ledger).toEqual([]);
    expect(narrowed.deferredBoutLogs).toEqual([]);
    expect(narrowed.pendingResolutionData).toBeUndefined();
    expect(narrowed.lastWeekBoutDisplay).toBeUndefined();
    expect(narrowed.lastSimulationReport).toBeUndefined();
  });

  it('preserves the read surface (identities, not copies)', () => {
    const full = populatedState();
    const narrowed = narrowRivalShardState(full);
    for (const key of [
      'roster',
      'rivals',
      'retired',
      'graveyard',
      'deadWarriorIds',
      'arenaHistory',
      'recruitPool',
      'freeAgents',
      'tournaments',
      'boutOffers',
      'rivalries',
      'ownerGrudges',
      'realmRankings',
      'arenaChampions',
      'restStates',
      'trainingAssignments',
      'hiringPool',
      'trainers',
      'legacyFounderQueue',
      'playerChallenges',
      'playerAvoids',
      'player',
    ] as const) {
      expect(narrowed[key], `field "${key}" must survive narrowing`).toBe(full[key]);
    }
  });

  it('shrinks the serialized payload', () => {
    const full = populatedState();
    const narrowed = narrowRivalShardState(full);
    expect(JSON.stringify(narrowed).length).toBeLessThan(JSON.stringify(full).length);
  });

  it('produces byte-identical shard output vs full state (audit-miss detector)', () => {
    const full = populatedState();
    const narrowed = narrowRivalShardState(full);
    const inputs = [{ rival: full.rivals[0]!, index: 0 }];
    const ctx = (state: GameState) => ({
      state,
      perception: buildPerceptionSnapshot(state),
      successorByStable: buildSuccessorIndex(state.retired),
      nextWeek: state.week + 1,
    });
    const a = runRivalShardChunk(inputs, ctx(full));
    const b = runRivalShardChunk(inputs, ctx(narrowed));
    expect(b).toEqual(a);
  });
});
