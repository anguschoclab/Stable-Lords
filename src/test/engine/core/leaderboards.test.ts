import { describe, it, expect } from 'vitest';
import {
  calculateGlobalFameLeaderboard,
  calculatePerArenaLeaderboards,
  calculateArenaLeaderboard,
  type ArenaLeaderboardEntry,
} from '@/engine/core/leaderboards';
import { getAllArenas, STANDARD_ARENA } from '@/data/arenas';
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
    expect(result.find((e: ArenaLeaderboardEntry) => e.warrior.id === 'p1')!.stableName).toBe(
      'Blood Hawks'
    );
    expect(result.find((e: ArenaLeaderboardEntry) => e.warrior.id === 'r1')!.stableName).toBe(
      'Iron Skulls'
    );
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

  it('filters out warriors with isDead: true even when status is Active', () => {
    const roster = [
      createMockWarrior('alive', 50),
      { ...createMockWarrior('dead-flag', 100), isDead: true } as Warrior,
    ];
    const result = calculateGlobalFameLeaderboard(roster, undefined, 'Player Stable');
    expect(result).toHaveLength(1);
    expect(result[0]!.warrior.id).toBe('alive');
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

function createArenaWarrior(
  id: string,
  arenaId: string,
  wins: number,
  losses: number,
  kills: number,
  overrides: Partial<Warrior> = {}
): Warrior {
  return {
    ...createMockWarrior(id, 0, 'Active'),
    career: {
      wins: 0,
      losses: 0,
      kills: 0,
      byArena: {
        [arenaId]: { wins, losses, kills },
      },
    },
    ...overrides,
  } as Warrior;
}

describe('calculatePerArenaLeaderboards', () => {
  it('returns one ArenaLeaderboardData per registered arena', () => {
    const arenas = getAllArenas();
    const result = calculatePerArenaLeaderboards([], 'Player Stable', []);
    expect(result).toHaveLength(arenas.length);
  });

  it('filters out non-active warriors (Dead/Retired excluded)', () => {
    const arenaId = STANDARD_ARENA.id;
    const active = createArenaWarrior('active', arenaId, 5, 2, 1);
    const dead = createArenaWarrior('dead', arenaId, 10, 0, 5, { status: 'Dead' });
    const retired = createArenaWarrior('retired', arenaId, 10, 0, 5, { status: 'Retired' });
    const result = calculatePerArenaLeaderboards([active, dead, retired], 'Player Stable', []);
    const stdArena = result.find((a) => a.arenaId === arenaId);
    expect(stdArena).toBeDefined();
    expect(stdArena!.topWarriors).toHaveLength(1);
    expect(stdArena!.topWarriors[0]!.warriorId).toBe('active');
  });

  it('filters out warriors with isDead: true', () => {
    const arenaId = STANDARD_ARENA.id;
    const alive = createArenaWarrior('alive', arenaId, 3, 1, 0);
    const deadFlag = createArenaWarrior('deadflag', arenaId, 10, 0, 5, { isDead: true } as any);
    const result = calculatePerArenaLeaderboards([alive, deadFlag], 'Player Stable', []);
    const stdArena = result.find((a) => a.arenaId === arenaId);
    expect(stdArena!.topWarriors).toHaveLength(1);
    expect(stdArena!.topWarriors[0]!.warriorId).toBe('alive');
  });

  it('only includes warriors who have fought at that arena (wins + losses > 0)', () => {
    const arenaId = STANDARD_ARENA.id;
    const fought = createArenaWarrior('fought', arenaId, 3, 2, 1);
    const noFights = createArenaWarrior('nofights', arenaId, 0, 0, 0);
    const result = calculatePerArenaLeaderboards([fought, noFights], 'Player Stable', []);
    const stdArena = result.find((a) => a.arenaId === arenaId);
    expect(stdArena!.topWarriors).toHaveLength(1);
    expect(stdArena!.topWarriors[0]!.warriorId).toBe('fought');
  });

  it('sorts topWarriors by wins desc, then winRate desc, then kills desc', () => {
    const arenaId = STANDARD_ARENA.id;
    const w1 = createArenaWarrior('w1', arenaId, 5, 5, 0); // 50% rate
    const w2 = createArenaWarrior('w2', arenaId, 5, 3, 2); // 62.5% rate, more kills
    const w3 = createArenaWarrior('w3', arenaId, 5, 0, 0); // 100% rate
    const result = calculatePerArenaLeaderboards([w1, w2, w3], 'Player Stable', []);
    const stdArena = result.find((a) => a.arenaId === arenaId);
    // All have 5 wins, so sort by winRate: w3 (100%), w2 (62.5%), w1 (50%)
    expect(stdArena!.topWarriors.map((e) => e.warriorId)).toEqual(['w3', 'w2', 'w1']);
  });

  it('sorts topKillers by kills desc, then wins desc', () => {
    const arenaId = STANDARD_ARENA.id;
    const w1 = createArenaWarrior('w1', arenaId, 2, 0, 5);
    const w2 = createArenaWarrior('w2', arenaId, 10, 0, 3);
    const result = calculatePerArenaLeaderboards([w1, w2], 'Player Stable', []);
    const stdArena = result.find((a) => a.arenaId === arenaId);
    expect(stdArena!.topKillers[0]!.warriorId).toBe('w1');
    expect(stdArena!.topKillers[1]!.warriorId).toBe('w2');
  });

  it('topKillers excludes warriors with 0 kills', () => {
    const arenaId = STANDARD_ARENA.id;
    const killer = createArenaWarrior('killer', arenaId, 5, 0, 3);
    const noKills = createArenaWarrior('nokills', arenaId, 5, 0, 0);
    const result = calculatePerArenaLeaderboards([killer, noKills], 'Player Stable', []);
    const stdArena = result.find((a) => a.arenaId === arenaId);
    expect(stdArena!.topKillers).toHaveLength(1);
    expect(stdArena!.topKillers[0]!.warriorId).toBe('killer');
  });

  it('respects custom limit parameter', () => {
    const arenaId = STANDARD_ARENA.id;
    const warriors = Array.from({ length: 10 }, (_, i) =>
      createArenaWarrior(`w${i}`, arenaId, i + 1, 0, 0)
    );
    const result = calculatePerArenaLeaderboards(warriors, 'Player Stable', [], 3);
    const stdArena = result.find((a) => a.arenaId === arenaId);
    expect(stdArena!.topWarriors).toHaveLength(3);
    // Highest wins: w9 (9), w8 (8), w7 (7)
    expect(stdArena!.topWarriors[0]!.warriorId).toBe('w9');
    expect(stdArena!.topWarriors[2]!.warriorId).toBe('w7');
  });

  it('uses rival.owner.stableName for rival stableName', () => {
    const arenaId = STANDARD_ARENA.id;
    const rivalW = createArenaWarrior('r1', arenaId, 3, 1, 0);
    const rival = createMockRival('Iron Skulls', [rivalW]);
    const result = calculatePerArenaLeaderboards([], 'Player Stable', [rival]);
    const stdArena = result.find((a) => a.arenaId === arenaId);
    expect(stdArena!.topWarriors[0]!.stableName).toBe('Iron Skulls');
  });

  it('returns empty topWarriors and topKillers for arena with no fight records', () => {
    const result = calculatePerArenaLeaderboards([createMockWarrior('p1', 0)], 'Player Stable', []);
    const stdArena = result.find((a) => a.arenaId === STANDARD_ARENA.id);
    expect(stdArena!.topWarriors).toEqual([]);
    expect(stdArena!.topKillers).toEqual([]);
  });

  it('handles empty roster and empty rivals', () => {
    const result = calculatePerArenaLeaderboards([], 'Player Stable', []);
    expect(result).toHaveLength(getAllArenas().length);
    for (const arena of result) {
      expect(arena.topWarriors).toEqual([]);
      expect(arena.topKillers).toEqual([]);
    }
  });
});

describe('calculateArenaLeaderboard', () => {
  it('returns data for a single arena', () => {
    const result = calculateArenaLeaderboard(STANDARD_ARENA.id, [], 'Player Stable', []);
    expect(result.arenaId).toBe(STANDARD_ARENA.id);
    expect(result.arenaName).toBe(STANDARD_ARENA.name);
  });

  it('falls back to STANDARD_ARENA name for unknown arena id', () => {
    const result = calculateArenaLeaderboard('nonexistent_arena', [], 'Player Stable', []);
    // arenaId is the input; arenaName falls back to STANDARD_ARENA.name
    expect(result.arenaId).toBe('nonexistent_arena');
    expect(result.arenaName).toBe(STANDARD_ARENA.name);
  });

  it('filters non-active and dead warriors', () => {
    const arenaId = STANDARD_ARENA.id;
    const active = createArenaWarrior('active', arenaId, 5, 2, 1);
    const dead = createArenaWarrior('dead', arenaId, 10, 0, 5, { status: 'Dead' });
    const result = calculateArenaLeaderboard(arenaId, [active, dead], 'Player Stable', []);
    expect(result.topWarriors).toHaveLength(1);
    expect(result.topWarriors[0]!.warriorId).toBe('active');
  });

  it('only includes warriors with fights at that arena', () => {
    const arenaId = STANDARD_ARENA.id;
    const fought = createArenaWarrior('fought', arenaId, 3, 2, 1);
    const noFights = createArenaWarrior('nofights', arenaId, 0, 0, 0);
    const result = calculateArenaLeaderboard(arenaId, [fought, noFights], 'Player Stable', []);
    expect(result.topWarriors).toHaveLength(1);
    expect(result.topWarriors[0]!.warriorId).toBe('fought');
  });

  it('sorts topWarriors and topKillers correctly', () => {
    const arenaId = STANDARD_ARENA.id;
    const w1 = createArenaWarrior('w1', arenaId, 3, 0, 0);
    const w2 = createArenaWarrior('w2', arenaId, 10, 0, 5);
    const result = calculateArenaLeaderboard(arenaId, [w1, w2], 'Player Stable', []);
    expect(result.topWarriors[0]!.warriorId).toBe('w2');
    expect(result.topKillers[0]!.warriorId).toBe('w2');
  });

  it('respects custom limit', () => {
    const arenaId = STANDARD_ARENA.id;
    const warriors = Array.from({ length: 10 }, (_, i) =>
      createArenaWarrior(`w${i}`, arenaId, i + 1, 0, 0)
    );
    const result = calculateArenaLeaderboard(arenaId, warriors, 'Player Stable', [], 3);
    expect(result.topWarriors).toHaveLength(3);
  });

  it('handles empty roster and rivals', () => {
    const result = calculateArenaLeaderboard(STANDARD_ARENA.id, [], 'Player Stable', []);
    expect(result.topWarriors).toEqual([]);
    expect(result.topKillers).toEqual([]);
  });

  it('includes rival warriors in the leaderboard', () => {
    const arenaId = STANDARD_ARENA.id;
    const rivalW = createArenaWarrior('r1', arenaId, 5, 1, 2);
    const rival = createMockRival('Rival Stable', [rivalW]);
    const result = calculateArenaLeaderboard(arenaId, [], 'Player Stable', [rival]);
    expect(result.topWarriors).toHaveLength(1);
    expect(result.topWarriors[0]!.warriorId).toBe('r1');
    expect(result.topWarriors[0]!.isPlayer).toBe(false);
  });

  it('sets isPlayer: true for player warriors', () => {
    const arenaId = STANDARD_ARENA.id;
    const pw = createArenaWarrior('p1', arenaId, 3, 1, 0);
    const result = calculateArenaLeaderboard(arenaId, [pw], 'Player Stable', []);
    expect(result.topWarriors[0]!.isPlayer).toBe(true);
  });

  it('uses rival.owner.stableName for rival stableName', () => {
    const arenaId = STANDARD_ARENA.id;
    const rivalW = createArenaWarrior('r1', arenaId, 5, 1, 2);
    const rival = createMockRival('Iron Skulls', [rivalW]);
    const result = calculateArenaLeaderboard(arenaId, [], 'Player Stable', [rival]);
    expect(result.topWarriors[0]!.stableName).toBe('Iron Skulls');
  });
});

describe('shared warrior entry collection', () => {
  it('produces consistent isPlayer and stableName across all three functions', () => {
    const arenaId = STANDARD_ARENA.id;
    const playerW = createArenaWarrior('p1', arenaId, 3, 1, 0);
    const rivalW = createArenaWarrior('r1', arenaId, 5, 2, 1);
    const rival = createMockRival('Iron Skulls', [rivalW]);

    const global = calculateGlobalFameLeaderboard([playerW], [rival], 'Blood Hawks');
    const perArena = calculatePerArenaLeaderboards([playerW], 'Blood Hawks', [rival]);
    const single = calculateArenaLeaderboard(arenaId, [playerW], 'Blood Hawks', [rival]);

    const gPlayer = global.find((e) => e.warrior.id === 'p1')!;
    const gRival = global.find((e) => e.warrior.id === 'r1')!;
    expect(gPlayer.isPlayer).toBe(true);
    expect(gPlayer.stableName).toBe('Blood Hawks');
    expect(gRival.isPlayer).toBe(false);
    expect(gRival.stableName).toBe('Iron Skulls');

    const paArena = perArena.find((a) => a.arenaId === arenaId)!;
    const paPlayer = paArena.topWarriors.find((e) => e.warriorId === 'p1')!;
    const paRival = paArena.topWarriors.find((e) => e.warriorId === 'r1')!;
    expect(paPlayer.isPlayer).toBe(true);
    expect(paPlayer.stableName).toBe('Blood Hawks');
    expect(paRival.isPlayer).toBe(false);
    expect(paRival.stableName).toBe('Iron Skulls');

    const sPlayer = single.topWarriors.find((e) => e.warriorId === 'p1')!;
    const sRival = single.topWarriors.find((e) => e.warriorId === 'r1')!;
    expect(sPlayer.isPlayer).toBe(true);
    expect(sPlayer.stableName).toBe('Blood Hawks');
    expect(sRival.isPlayer).toBe(false);
    expect(sRival.stableName).toBe('Iron Skulls');
  });
});
