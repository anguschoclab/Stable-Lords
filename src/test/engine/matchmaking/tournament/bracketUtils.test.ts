import { describe, it, expect } from 'vitest';
import { findCurrentRoundBouts } from '@/engine/matchmaking/tournament/bracketUtils';
import type { TournamentBout } from '@/types/state.types';

function makeBout(round: number, matchIndex: number, winner?: 'A' | 'D'): TournamentBout {
  return {
    round,
    matchIndex,
    warriorIdA: `wA${round}_${matchIndex}` as any,
    warriorIdD: `wD${round}_${matchIndex}` as any,
    ...(winner !== undefined ? { winner } : {}),
  };
}

describe('findCurrentRoundBouts', () => {
  it('returns null round and empty array for empty bracket', () => {
    const result = findCurrentRoundBouts([]);
    expect(result.currentRound).toBeNull();
    expect(result.roundBouts).toEqual([]);
  });

  it('returns null round and empty array when all bouts are resolved', () => {
    const bracket = [
      makeBout(1, 0, 'A'),
      makeBout(1, 1, 'D'),
      makeBout(2, 0, 'A'),
    ];
    const result = findCurrentRoundBouts(bracket);
    expect(result.currentRound).toBeNull();
    expect(result.roundBouts).toEqual([]);
  });

  it('returns the correct round and bout for a single unresolved bout', () => {
    const bracket = [makeBout(3, 0)];
    const result = findCurrentRoundBouts(bracket);
    expect(result.currentRound).toBe(3);
    expect(result.roundBouts).toHaveLength(1);
    expect(result.roundBouts[0]).toBe(bracket[0]);
  });

  it('collects all unresolved bouts in the same round', () => {
    const bracket = [
      makeBout(1, 0),
      makeBout(1, 1),
      makeBout(1, 2),
    ];
    const result = findCurrentRoundBouts(bracket);
    expect(result.currentRound).toBe(1);
    expect(result.roundBouts).toHaveLength(3);
  });

  it('returns only the minimum round bouts when multiple rounds are unresolved', () => {
    const bracket = [
      makeBout(2, 0),
      makeBout(3, 0),
      makeBout(2, 1),
      makeBout(4, 0),
    ];
    const result = findCurrentRoundBouts(bracket);
    expect(result.currentRound).toBe(2);
    expect(result.roundBouts).toHaveLength(2);
    expect(result.roundBouts.every((b) => b.round === 2)).toBe(true);
  });

  it('handles non-monotonic round order (e.g. [r3, r1, r2])', () => {
    const bracket = [
      makeBout(3, 0),
      makeBout(1, 0),
      makeBout(2, 0),
    ];
    const result = findCurrentRoundBouts(bracket);
    expect(result.currentRound).toBe(1);
    expect(result.roundBouts).toHaveLength(1);
    expect(result.roundBouts[0]!.round).toBe(1);
  });

  it('skips resolved bouts and only considers unresolved ones', () => {
    const bracket = [
      makeBout(1, 0, 'A'),
      makeBout(1, 1),
      makeBout(2, 0),
    ];
    const result = findCurrentRoundBouts(bracket);
    expect(result.currentRound).toBe(1);
    expect(result.roundBouts).toHaveLength(1);
    expect(result.roundBouts[0]!.matchIndex).toBe(1);
  });

  it('handles duplicate rounds with resolved bouts interspersed', () => {
    const bracket = [
      makeBout(1, 0, 'A'),
      makeBout(2, 0),
      makeBout(1, 1),
      makeBout(1, 2, 'D'),
      makeBout(3, 0),
    ];
    const result = findCurrentRoundBouts(bracket);
    expect(result.currentRound).toBe(1);
    expect(result.roundBouts).toHaveLength(1);
    expect(result.roundBouts[0]!.matchIndex).toBe(1);
  });
});
