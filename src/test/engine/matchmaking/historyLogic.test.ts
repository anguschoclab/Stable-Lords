import { describe, it, expect } from 'vitest';
import { addRestState, clearExpiredRest } from '@/engine/matchmaking/historyLogic';
import type { RestState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

describe('addRestState', () => {
  it('returns the array unchanged when outcome is not "KO"', () => {
    const states: RestState[] = [{ warriorId: 'w1' as WarriorId, restUntilWeek: 3 }];
    const result = addRestState(states, 'w2' as WarriorId, 'TKO', 5);
    expect(result).toEqual(states);
  });

  it('returns the array unchanged when outcome is null', () => {
    const states: RestState[] = [{ warriorId: 'w1' as WarriorId, restUntilWeek: 3 }];
    const result = addRestState(states, 'w2' as WarriorId, null, 5);
    expect(result).toEqual(states);
  });

  it('appends a RestState with restUntilWeek = week + 1 when outcome is "KO"', () => {
    const states: RestState[] = [];
    const result = addRestState(states, 'w1' as WarriorId, 'KO', 5);
    expect(result).toEqual([{ warriorId: 'w1' as WarriorId, restUntilWeek: 6 }]);
  });

  it('preserves existing entries when appending a new rest state', () => {
    const states: RestState[] = [{ warriorId: 'w1' as WarriorId, restUntilWeek: 3 }];
    const result = addRestState(states, 'w2' as WarriorId, 'KO', 5);
    expect(result).toEqual([
      { warriorId: 'w1' as WarriorId, restUntilWeek: 3 },
      { warriorId: 'w2' as WarriorId, restUntilWeek: 6 },
    ]);
  });

  it('does not mutate the input array', () => {
    const states: RestState[] = [{ warriorId: 'w1' as WarriorId, restUntilWeek: 3 }];
    const snapshot = [...states];
    addRestState(states, 'w2' as WarriorId, 'KO', 5);
    expect(states).toEqual(snapshot);
  });
});

describe('clearExpiredRest', () => {
  it('returns an empty array for empty input', () => {
    expect(clearExpiredRest([], 5)).toEqual([]);
  });

  it('removes states where restUntilWeek < current week', () => {
    const states: RestState[] = [
      { warriorId: 'w1' as WarriorId, restUntilWeek: 3 },
      { warriorId: 'w2' as WarriorId, restUntilWeek: 5 },
    ];
    expect(clearExpiredRest(states, 5)).toEqual([]);
  });

  it('removes states where restUntilWeek equals current week', () => {
    const states: RestState[] = [
      { warriorId: 'w1' as WarriorId, restUntilWeek: 4 },
      { warriorId: 'w2' as WarriorId, restUntilWeek: 5 },
    ];
    expect(clearExpiredRest(states, 5)).toEqual([]);
  });

  it('keeps states where restUntilWeek is strictly greater than current week', () => {
    const states: RestState[] = [{ warriorId: 'w1' as WarriorId, restUntilWeek: 6 }];
    expect(clearExpiredRest(states, 5)).toEqual(states);
  });

  it('correctly handles a mix of expired, boundary, and future states', () => {
    const states: RestState[] = [
      { warriorId: 'w1' as WarriorId, restUntilWeek: 3 }, // expired
      { warriorId: 'w2' as WarriorId, restUntilWeek: 5 }, // boundary (expired)
      { warriorId: 'w3' as WarriorId, restUntilWeek: 6 }, // future (keep)
      { warriorId: 'w4' as WarriorId, restUntilWeek: 7 }, // future (keep)
    ];
    expect(clearExpiredRest(states, 5)).toEqual([
      { warriorId: 'w3' as WarriorId, restUntilWeek: 6 },
      { warriorId: 'w4' as WarriorId, restUntilWeek: 7 },
    ]);
  });

  it('does not mutate the input array', () => {
    const states: RestState[] = [
      { warriorId: 'w1' as WarriorId, restUntilWeek: 3 },
      { warriorId: 'w2' as WarriorId, restUntilWeek: 6 },
    ];
    const snapshot = [...states];
    clearExpiredRest(states, 5);
    expect(states).toEqual(snapshot);
  });
});
