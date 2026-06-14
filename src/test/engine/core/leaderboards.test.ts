import { describe, it, expect } from 'vitest';
import {
  calculateGlobalFameLeaderboard,
  type ArenaLeaderboardEntry,
} from '@/engine/core/leaderboards';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData } from '@/types/game';

function createMockWarrior(
  id: string,
  fame: number,
  status: Warrior['status'] = 'Active'
): Warrior {
  return {
    id: id as Warrior['id'],
    name: `Warrior ${id}`,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status,
    traits: [],
  } as Warrior;
}

function createMockRival(stableName: string, warriors: Warrior[]): RivalStableData {
  return {
    id: `rival-${stableName}` as RivalStableData['id'],
    owner: {
      id: `owner-${stableName}` as RivalStableData['owner']['id'],
      name: `Owner ${stableName}`,
      stableName,
      fame: 0,
      renown: 0,
      titles: 0,
    } as RivalStableData['owner'],
    fame: 0,
    roster: warriors,
    treasury: 0,
  } as RivalStableData;
}

describe('calculateGlobalFameLeaderboard', () => {
  it('returns empty array for empty roster and no rivals', () => {
    const result = calculateGlobalFameLeaderboard([], undefined, 'Player Stable');
    expect(result).toEqual([]);
  });

  it('returns empty array when all warriors are non-Active', () => {
    const roster = [
      createMockWarrior('dead', 100, 'Dead'),
      createMockWarrior('retired', 200, 'Retired'),
    ];
    const result = calculateGlobalFameLeaderboard(roster, undefined, 'Player Stable');
    expect(result).toEqual([]);
  });

  it('ranks player warriors by fame descending when no rivals exist', () => {
    const roster = [
      createMockWarrior('low', 10),
      createMockWarrior('high', 50),
      createMockWarrior('mid', 30),
    ];
    const result = calculateGlobalFameLeaderboard(roster, undefined, 'Player Stable');
    expect(result).toHaveLength(3);
    expect(result[0]!.warrior.id).toBe('high');
    expect(result[1]!.warrior.id).toBe('mid');
    expect(result[2]!.warrior.id).toBe('low');
  });

  it('ranks rival warriors by fame descending when player roster is empty', () => {
    const rivals = [
      createMockRival('Rival A', [createMockWarrior('r-low', 10), createMockWarrior('r-high', 50)]),
    ];
    const result = calculateGlobalFameLeaderboard([], rivals, 'Player Stable');
    expect(result).toHaveLength(2);
    expect(result[0]!.warrior.id).toBe('r-high');
    expect(result[1]!.warrior.id).toBe('r-low');
  });

  it('mixes player and rival warriors in a single descending-fame list', () => {
    const roster = [createMockWarrior('p-mid', 30)];
    const rivals = [
      createMockRival('Rival A', [createMockWarrior('r-high', 50)]),
      createMockRival('Rival B', [createMockWarrior('r-low', 10)]),
    ];
    const result = calculateGlobalFameLeaderboard(roster, rivals, 'Player Stable');
    expect(result).toHaveLength(3);
    expect(result[0]!.warrior.id).toBe('r-high');
    expect(result[1]!.warrior.id).toBe('p-mid');
    expect(result[2]!.warrior.id).toBe('r-low');
  });

  it('sets isPlayer: true for player-roster entries and false for rival entries', () => {
    const roster = [createMockWarrior('p1', 10)];
    const rivals = [createMockRival('Rival A', [createMockWarrior('r1', 20)])];
    const result = calculateGlobalFameLeaderboard(roster, rivals, 'Player Stable');
    expect(result.find((e: ArenaLeaderboardEntry) => e.warrior.id === 'p1')!.isPlayer).toBe(true);
    expect(result.find((e: ArenaLeaderboardEntry) => e.warrior.id === 'r1')!.isPlayer).toBe(false);
  });

  it('maps playerStableName for player entries and rival.owner.stableName for rival entries', () => {
    const roster = [createMockWarrior('p1', 10)];
    const rivals = [createMockRival('Iron Skulls', [createMockWarrior('r1', 20)])];
    const result = calculateGlobalFameLeaderboard(roster, rivals, 'Blood Hawks');
    expect(result.find((e: ArenaLeaderboardEntry) => e.warrior.id === 'p1')!.stableName).toBe('Blood Hawks');
    expect(result.find((e: ArenaLeaderboardEntry) => e.warrior.id === 'r1')!.stableName).toBe('Iron Skulls');
  });

  it('respects default limit of 10', () => {
    const roster = Array.from({ length: 15 }, (_, i) => createMockWarrior(`w${i}`, i * 10));
    const result = calculateGlobalFameLeaderboard(roster, undefined, 'Player Stable');
    expect(result).toHaveLength(10);
    // Highest fame is w14 (140), so top 10 should be w14 down to w5
    expect(result[0]!.warrior.id).toBe('w14');
    expect(result[9]!.warrior.id).toBe('w5');
  });

  it('respects custom limit', () => {
    const roster = [
      createMockWarrior('a', 30),
      createMockWarrior('b', 50),
      createMockWarrior('c', 10),
      createMockWarrior('d', 40),
    ];
    const result = calculateGlobalFameLeaderboard(roster, undefined, 'Player Stable', 3);
    expect(result).toHaveLength(3);
    expect(result[0]!.warrior.id).toBe('b');
    expect(result[1]!.warrior.id).toBe('d');
    expect(result[2]!.warrior.id).toBe('a');
  });

  it('handles limit = 0', () => {
    const roster = [createMockWarrior('a', 100)];
    const result = calculateGlobalFameLeaderboard(roster, undefined, 'Player Stable', 0);
    expect(result).toEqual([]);
  });

  it('handles limit = 1', () => {
    const roster = [createMockWarrior('low', 10), createMockWarrior('high', 50)];
    const result = calculateGlobalFameLeaderboard(roster, undefined, 'Player Stable', 1);
    expect(result).toHaveLength(1);
    expect(result[0]!.warrior.id).toBe('high');
  });

  it('inserts equal-fame entries after existing equal-fame entries when capacity allows', () => {
    const roster = [
      createMockWarrior('first', 10),
      createMockWarrior('second', 10),
      createMockWarrior('third', 10),
    ];
    const result = calculateGlobalFameLeaderboard(roster, undefined, 'Player Stable', 5);
    expect(result).toHaveLength(3);
    expect(result[0]!.warrior.id).toBe('first');
    expect(result[1]!.warrior.id).toBe('second');
    expect(result[2]!.warrior.id).toBe('third');
  });

  it('drops late-arriving equal-fame warriors at the capacity boundary', () => {
    // Gate uses <=, so with limit=2 and three warriors of fame=10,
    // the third warrior sees top[1]!.fame === 10 and 10 <= 10 is true → dropped.
    const roster = [
      createMockWarrior('a', 10),
      createMockWarrior('b', 10),
      createMockWarrior('c', 10),
    ];
    const result = calculateGlobalFameLeaderboard(roster, undefined, 'Player Stable', 2);
    expect(result).toHaveLength(2);
    expect(result[0]!.warrior.id).toBe('a');
    expect(result[1]!.warrior.id).toBe('b');
  });

  it('correctly handles bounded sort with 50+ warriors', () => {
    const roster = Array.from({ length: 50 }, (_, i) => createMockWarrior(`w${i}`, i * 2));
    const result = calculateGlobalFameLeaderboard(roster, undefined, 'Player Stable', 5);
    expect(result).toHaveLength(5);
    // Highest fame is w49 (98), then w48 (96), w47 (94), w46 (92), w45 (90)
    expect(result[0]!.warrior.id).toBe('w49');
    expect(result[1]!.warrior.id).toBe('w48');
    expect(result[2]!.warrior.id).toBe('w47');
    expect(result[3]!.warrior.id).toBe('w46');
    expect(result[4]!.warrior.id).toBe('w45');
  });
});
