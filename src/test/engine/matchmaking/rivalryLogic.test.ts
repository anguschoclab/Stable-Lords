import { describe, it, expect } from 'vitest';
import { updateRivalriesFromBouts } from '@/engine/matchmaking/rivalryLogic';
import type { FightSummary } from '@/types/combat.types';
import type { Rivalry } from '@/types/state.types';
import type { FightId, WarriorId, StableId } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';

// ─── Factory helpers ────────────────────────────────────────────────────────

function makeFight(overrides: Partial<FightSummary> = {}): FightSummary {
  return {
    id: 'f1' as FightId,
    week: 1,
    title: 'Alice vs Bob',
    warriorIdA: 'w1' as WarriorId,
    warriorIdD: 'w2' as WarriorId,
    stableIdA: 'StableA' as StableId,
    stableIdD: 'StableB' as StableId,
    winner: 'A',
    by: 'KO',
    styleA: 'BA',
    styleD: 'TP',
    fameA: 50,
    fameD: 50,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as FightSummary;
}

function makeRivalry(overrides: Partial<Rivalry> = {}): Rivalry {
  return {
    id: 'rv-1' as any,
    stableIdA: 'StableA' as StableId,
    stableIdB: 'StableB' as StableId,
    intensity: 1,
    reason: 'Initial clash',
    startWeek: 1,
    ...overrides,
  } as Rivalry;
}

function makeRng(seed: number = 12345): SeededRNG {
  return new SeededRNG(seed);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('updateRivalriesFromBouts', () => {
  it('returns existing rivalries unchanged when weekFights is empty', () => {
    const existing: Rivalry[] = [makeRivalry()];
    const result = updateRivalriesFromBouts(existing, [], 5, makeRng());
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(existing[0]);
  });

  it('skips fights missing stableIdA', () => {
    const fights: FightSummary[] = [makeFight({ stableIdA: undefined as any })];
    const result = updateRivalriesFromBouts([], fights, 1, makeRng());
    expect(result).toHaveLength(0);
  });

  it('skips fights missing stableIdD', () => {
    const fights: FightSummary[] = [makeFight({ stableIdD: undefined as any })];
    const result = updateRivalriesFromBouts([], fights, 1, makeRng());
    expect(result).toHaveLength(0);
  });

  it('sets kill reason with correct name format including week number', () => {
    const fights: FightSummary[] = [
      makeFight({
        title: 'Alice vs Bob',
        by: 'Kill',
        winner: 'A',
        week: 7,
      }),
    ];
    const result = updateRivalriesFromBouts([], fights, 7, makeRng());
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toContain('killed');
    expect(result[0]!.reason).toContain('Alice');
    expect(result[0]!.reason).toContain('Bob');
    expect(result[0]!.reason).toContain('Week 7');
  });

  it('sets upset reason when loser fame exceeds winner by 20+', () => {
    const fights: FightSummary[] = [
      makeFight({
        title: 'Alice vs Bob',
        winner: 'A',
        by: 'KO',
        fameA: 10,
        fameD: 50,
        week: 3,
      }),
    ];
    const result = updateRivalriesFromBouts([], fights, 3, makeRng());
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toContain('upset');
    expect(result[0]!.reason).toContain('Week 3');
  });

  it('kill reason takes priority over upset reason', () => {
    const fights: FightSummary[] = [
      makeFight({
        title: 'Alice vs Bob',
        winner: 'A',
        by: 'Kill',
        fameA: 10,
        fameD: 50,
        week: 2,
      }),
    ];
    const result = updateRivalriesFromBouts([], fights, 2, makeRng());
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toContain('killed');
    expect(result[0]!.reason).not.toContain('upset');
  });

  it('preserves existing reason when no deaths or upsets in new fights', () => {
    const existing: Rivalry[] = [makeRivalry({ intensity: 2, reason: 'Original blood' })];
    const fights: FightSummary[] = [
      makeFight({
        title: 'Alice vs Bob',
        by: 'KO',
        winner: 'A',
        fameA: 50,
        fameD: 50,
        week: 2,
      }),
    ];
    const result = updateRivalriesFromBouts(existing, fights, 2, makeRng());
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toBe('Original blood');
  });

  it('uses default reason for new rivalry with no deaths or upsets', () => {
    const fights: FightSummary[] = [
      makeFight({
        title: 'Alice vs Bob',
        by: 'KO',
        winner: 'A',
        fameA: 50,
        fameD: 50,
        week: 1,
      }),
    ];
    const result = updateRivalriesFromBouts([], fights, 1, makeRng());
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toBe('Clashed in the arena');
  });

  it('does not push new entries into the input existingRivalries array', () => {
    const existing: Rivalry[] = [makeRivalry({ intensity: 1, reason: 'Original' })];
    const originalLength = existing.length;

    const fights: FightSummary[] = [
      // Fight between a DIFFERENT pair to create a new rivalry
      makeFight({
        stableIdA: 'StableX' as StableId,
        stableIdD: 'StableY' as StableId,
        by: 'Kill',
        winner: 'A',
        week: 2,
      }),
    ];
    const result = updateRivalriesFromBouts(existing, fights, 2, makeRng());

    // The original array should not have grown — new rivalries go into the copy
    expect(existing).toHaveLength(originalLength);
    // The result should contain the new rivalry
    expect(result).toHaveLength(2);
  });

  it('aggregates multiple fights between same pair in one week', () => {
    const fights: FightSummary[] = [
      makeFight({ id: 'f1' as FightId, by: 'KO', winner: 'A', week: 5 }),
      makeFight({ id: 'f2' as FightId, by: 'KO', winner: 'D', week: 5 }),
      makeFight({ id: 'f3' as FightId, by: 'KO', winner: 'A', week: 5 }),
    ];
    const result = updateRivalriesFromBouts([], fights, 5, makeRng());
    expect(result).toHaveLength(1);
    // 3 fights aggregated into a single rivalry — intensity should reflect multiple bouts
    expect(result[0]!.intensity).toBeGreaterThanOrEqual(1);
  });

  it('parses title with parenthetical subtitle correctly', () => {
    const fights: FightSummary[] = [
      makeFight({
        title: 'Alice vs Bob (Main Event)',
        by: 'Kill',
        winner: 'A',
        week: 4,
      }),
    ];
    const result = updateRivalriesFromBouts([], fights, 4, makeRng());
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toContain('Alice');
    expect(result[0]!.reason).toContain('Bob');
    expect(result[0]!.reason).not.toContain('Main Event');
  });

  it('sets startWeek to week parameter for new rivalry', () => {
    const fights: FightSummary[] = [makeFight({ week: 9 })];
    const result = updateRivalriesFromBouts([], fights, 9, makeRng());
    expect(result).toHaveLength(1);
    expect(result[0]!.startWeek).toBe(9);
  });

  it('new rivalry id has rivalry prefix from rng.uuid', () => {
    const fights: FightSummary[] = [makeFight()];
    const result = updateRivalriesFromBouts([], fights, 1, makeRng());
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toMatch(/^rivalry-/);
  });

  it('clamps existing rivalry intensity to max 5', () => {
    const existing: Rivalry[] = [makeRivalry({ intensity: 4, reason: 'Old feud' })];
    // Multiple kill bouts in one week to push intensity past 5
    const fights: FightSummary[] = [
      makeFight({ id: 'f1' as FightId, by: 'Kill', winner: 'A', fameA: 90, fameD: 95, week: 2 }),
      makeFight({ id: 'f2' as FightId, by: 'Kill', winner: 'D', fameA: 90, fameD: 95, week: 2 }),
      makeFight({ id: 'f3' as FightId, by: 'Kill', winner: 'A', fameA: 90, fameD: 95, week: 2 }),
    ];
    const result = updateRivalriesFromBouts(existing, fights, 2, makeRng());
    expect(result).toHaveLength(1);
    expect(result[0]!.intensity).toBeLessThanOrEqual(5);
  });
});
