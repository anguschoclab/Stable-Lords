import { describe, it, expect } from 'vitest';
import {
  detectUpsets,
  detectDebuts,
  computeStreaks,
  computeFightAnalysis,
  detectRivalryMatchup,
  detectGazetteTags,
  detectHotStreakers,
  detectRisingStars,
} from '@/engine/gazette/gazetteDetections';
import type { FightSummary } from '@/types/combat.types';
import type { FightId, WarriorId, StableId } from '@/types/shared.types';

const nameToId = (name: string) => `w-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

const createFight = (overrides: any = {}): FightSummary => {
  const { a, d, ...rest } = overrides;
  const title = rest.title || `${a || 'Alice'} vs ${d || 'Bob'}`;
  return {
    id: 'f1' as FightId,
    week: 1,
    title,
    warriorIdA: (rest.warriorIdA || nameToId(a || 'Alice')) as WarriorId,
    warriorIdD: (rest.warriorIdD || nameToId(d || 'Bob')) as WarriorId,
    stableIdA: 'sa' as StableId,
    stableIdD: 'sd' as StableId,
    winner: 'A',
    by: 'KO',
    styleA: 'Brawler',
    styleD: 'Swordsman',
    createdAt: new Date().toISOString(),
    fameA: 10,
    fameD: 10,
    ...rest,
  };
};

describe('detectUpsets', () => {
  it('detects an upset when the underdog wins significantly', () => {
    // Loser fame (30) >= winner fame (10) + 10 AND loser fame (30) >= 2 * winner fame (10)
    const fights = [
      createFight({ a: 'Underdog', d: 'Favorite', winner: 'A', fameA: 10, fameD: 30 }),
    ];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(1);
    expect(upsets[0]).toEqual({
      winner: 'Underdog',
      loser: 'Favorite',
      winnerFame: 10,
      loserFame: 30,
    });
  });

  it('does not detect an upset when fame difference is small', () => {
    // Loser fame (15) < winner fame (10) + 10
    const fights = [
      createFight({ a: 'Underdog', d: 'Favorite', winner: 'A', fameA: 10, fameD: 15 }),
    ];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(0);
  });

  it('does not detect an upset when ratio is small', () => {
    // Loser fame (25) >= winner fame (15) + 10 is TRUE
    // BUT loser fame (25) < 2 * winner fame (15) (30)
    const fights = [
      createFight({ a: 'Underdog', d: 'Favorite', winner: 'A', fameA: 15, fameD: 25 }),
    ];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(0);
  });

  it('does not detect an upset when the favorite wins', () => {
    const fights = [
      createFight({ a: 'Favorite', d: 'Underdog', winner: 'A', fameA: 30, fameD: 10 }),
    ];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(0);
  });

  it('does not detect an upset on a draw', () => {
    const fights = [createFight({ winner: null, fameA: 10, fameD: 30 })];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(0);
  });

  it('does not detect an upset when fame data is missing', () => {
    const fights = [
      createFight({ a: 'Underdog', d: 'Favorite', winner: 'A', fameA: undefined, fameD: 30 }),
    ];
    const upsets = detectUpsets(fights);
    expect(upsets).toHaveLength(0);
  });
});

describe('detectDebuts', () => {
  it('identifies warriors making their first appearance', () => {
    const allFights = [
      createFight({ id: 'f1', a: 'Alice', d: 'Bob' }),
      createFight({ id: 'f2', a: 'Alice', d: 'Charlie' }),
    ];
    const weekFights = [
      createFight({ id: 'f2', a: 'Alice', d: 'Charlie' }), // Charlie debut
      createFight({ id: 'f3', a: 'Dave', d: 'Alice' }), // Dave debut
    ];
    const fullAllFights = [
      ...allFights,
      createFight({ id: 'f3', a: 'Dave', d: 'Alice' }),
    ];
    const ctx = computeFightAnalysis(weekFights, fullAllFights);
    const debuts = detectDebuts(weekFights, ctx);
    expect(debuts).toContain('Charlie');
    expect(debuts).toContain('Dave');
    expect(debuts).not.toContain('Alice');
    expect(debuts).not.toContain('Bob');
  });

  it('handles the first week correctly (all are debuts)', () => {
    const weekFights = [
      createFight({ id: 'f1', a: 'Alice', d: 'Bob' }),
      createFight({ id: 'f2', a: 'Charlie', d: 'Dave' }),
    ];
    const ctx = computeFightAnalysis(weekFights, weekFights);
    const debuts = detectDebuts(weekFights, ctx);
    expect(debuts).toHaveLength(4);
    expect(debuts).toContain('Alice');
    expect(debuts).toContain('Bob');
    expect(debuts).toContain('Charlie');
    expect(debuts).toContain('Dave');
  });

  it('returns an empty array when weekFights is empty', () => {
    const allFights = [createFight({ id: 'f1', a: 'Alice', d: 'Bob' })];
    const ctx = computeFightAnalysis([], allFights);
    const debuts = detectDebuts([], ctx);
    expect(debuts).toHaveLength(0);
  });

  it('does not return duplicates if a debuting fighter fights multiple times in a week', () => {
    const allFights = [createFight({ id: 'f1', a: 'Alice', d: 'Bob' })];
    const weekFights = [
      createFight({ id: 'f2', a: 'Charlie', d: 'Dave' }),
      createFight({ id: 'f3', a: 'Charlie', d: 'Eve' }),
    ];
    const fullAllFights = [...allFights, ...weekFights];
    const ctx = computeFightAnalysis(weekFights, fullAllFights);
    const debuts = detectDebuts(weekFights, ctx);
    expect(debuts).toHaveLength(3);
    expect(debuts).toContain('Charlie');
    expect(debuts).toContain('Dave');
    expect(debuts).toContain('Eve');
    expect(debuts.filter((d) => d === 'Charlie')).toHaveLength(1); // Only 1 Charlie
  });

  it('safely handles undefined or null entries in allFights', () => {
    const allFights = [
      createFight({ id: 'f1', a: 'Alice', d: 'Bob' }),
      undefined as any as FightSummary,
      null as any as FightSummary,
    ];
    const weekFights = [createFight({ id: 'f2', a: 'Alice', d: 'Charlie' })];
    const fullAllFights = [...allFights, ...weekFights];
    const ctx = computeFightAnalysis(weekFights, fullAllFights);
    const debuts = detectDebuts(weekFights, ctx);
    expect(debuts).toHaveLength(1);
    expect(debuts).toContain('Charlie');
  });
});

describe('computeStreaks', () => {
  it('correctly tracks win and loss streaks (legacy integration test)', () => {
    const fights = [
      createFight({ a: 'Alice', d: 'Bob', winner: 'A' }), // Alice 1, Bob -1
      createFight({ a: 'Alice', d: 'Charlie', winner: 'A' }), // Alice 2, Charlie -1
      createFight({ a: 'Dave', d: 'Alice', winner: 'D' }), // Alice 3, Dave -1
      createFight({ a: 'Alice', d: 'Eve', winner: 'D' }), // Alice -1, Eve 1
    ];
    const streaks = computeStreaks(fights);
    expect(streaks.get('w-alice' as WarriorId)).toBe(-1);
    expect(streaks.get('w-bob' as WarriorId)).toBe(-1);
    expect(streaks.get('w-charlie' as WarriorId)).toBe(-1);
    expect(streaks.get('w-dave' as WarriorId)).toBe(-1);
    expect(streaks.get('w-eve' as WarriorId)).toBe(1);
  });

  it('initializes streaks to 1 and -1 on a single win/loss', () => {
    const fights = [createFight({ a: 'Hero', d: 'Villain', winner: 'A' })];
    const streaks = computeStreaks(fights);
    expect(streaks.get('w-hero' as WarriorId)).toBe(1);
    expect(streaks.get('w-villain' as WarriorId)).toBe(-1);
  });

  it('builds positive streaks correctly on consecutive wins', () => {
    const fights = [
      createFight({ a: 'Hero', d: 'Villain1', winner: 'A' }),
      createFight({ a: 'Hero', d: 'Villain2', winner: 'A' }),
      createFight({ a: 'Hero', d: 'Villain3', winner: 'A' }),
    ];
    const streaks = computeStreaks(fights);
    expect(streaks.get('w-hero' as WarriorId)).toBe(3);
    expect(streaks.get('w-villain1' as WarriorId)).toBe(-1);
    expect(streaks.get('w-villain2' as WarriorId)).toBe(-1);
    expect(streaks.get('w-villain3' as WarriorId)).toBe(-1);
  });

  it('builds negative streaks correctly on consecutive losses', () => {
    const fights = [
      createFight({ a: 'Hero', d: 'Villain1', winner: 'D' }),
      createFight({ a: 'Hero', d: 'Villain2', winner: 'D' }),
      createFight({ a: 'Hero', d: 'Villain3', winner: 'D' }),
    ];
    const streaks = computeStreaks(fights);
    expect(streaks.get('w-hero' as WarriorId)).toBe(-3);
    expect(streaks.get('w-villain1' as WarriorId)).toBe(1);
    expect(streaks.get('w-villain2' as WarriorId)).toBe(1);
    expect(streaks.get('w-villain3' as WarriorId)).toBe(1);
  });

  it('breaks a losing streak and sets the streak to 1 on a win', () => {
    const fights = [
      createFight({ a: 'Hero', d: 'Villain1', winner: 'D' }), // Hero -1
      createFight({ a: 'Hero', d: 'Villain2', winner: 'D' }), // Hero -2
      createFight({ a: 'Hero', d: 'Villain3', winner: 'A' }), // Hero wins! Streak becomes 1
    ];
    const streaks = computeStreaks(fights);
    expect(streaks.get('w-hero' as WarriorId)).toBe(1);
    expect(streaks.get('w-villain3' as WarriorId)).toBe(-1);
  });

  it('breaks a winning streak and sets the streak to -1 on a loss', () => {
    const fights = [
      createFight({ a: 'Hero', d: 'Villain1', winner: 'A' }), // Hero 1
      createFight({ a: 'Hero', d: 'Villain2', winner: 'A' }), // Hero 2
      createFight({ a: 'Hero', d: 'Villain3', winner: 'D' }), // Hero loses! Streak becomes -1
    ];
    const streaks = computeStreaks(fights);
    expect(streaks.get('w-hero' as WarriorId)).toBe(-1);
    expect(streaks.get('w-villain3' as WarriorId)).toBe(1);
  });

  it('resets both fighters streaks to 0 on a draw', () => {
    const fights = [
      createFight({ a: 'Hero', d: 'Villain1', winner: 'A' }), // Hero 1
      createFight({ a: 'Villain2', d: 'Bystander', winner: 'A' }), // Villain2 1
      createFight({ a: 'Hero', d: 'Villain2', winner: null }), // Draw!
    ];
    const streaks = computeStreaks(fights);
    expect(streaks.get('w-hero' as WarriorId)).toBe(0);
    expect(streaks.get('w-villain2' as WarriorId)).toBe(0);
  });

  it('gracefully ignores null or undefined fight objects', () => {
    const fights = [
      createFight({ a: 'Hero', d: 'Villain', winner: 'A' }),
      null as any,
      undefined as any,
      createFight({ a: 'Hero', d: 'Villain2', winner: 'A' }),
    ];
    const streaks = computeStreaks(fights);
    expect(streaks.get('w-hero' as WarriorId)).toBe(2);
  });
});

describe('detectRivalryMatchup', () => {
  it('detects a rivalry when warriors meet 3+ times', () => {
    const f1 = createFight({ a: 'Alice', d: 'Bob' });
    const f2 = createFight({ a: 'Alice', d: 'Bob' });
    const f3 = createFight({ a: 'Alice', d: 'Bob' });
    const allFights = [f1, f2, f3];
    const weekFights = [f3];

    const ctx = computeFightAnalysis(weekFights, allFights);
    const rivalry = detectRivalryMatchup(weekFights, ctx);
    expect(rivalry).toEqual({ a: 'Alice', b: 'Bob', count: 3 });
  });

  it('does not detect rivalry with fewer than 3 meetings', () => {
    const f1 = createFight({ a: 'Alice', d: 'Bob' });
    const f2 = createFight({ a: 'Alice', d: 'Bob' });
    const allFights = [f1, f2];
    const weekFights = [f2];

    const ctx = computeFightAnalysis(weekFights, allFights);
    const rivalry = detectRivalryMatchup(weekFights, ctx);
    expect(rivalry).toBeNull();
  });

  it('correctly normalizes attacker/defender order', () => {
    const f1 = createFight({ a: 'Alice', d: 'Bob' });
    const f2 = createFight({ a: 'Bob', d: 'Alice' });
    const f3 = createFight({ a: 'Alice', d: 'Bob' });
    const allFights = [f1, f2, f3];
    const weekFights = [f3];

    const ctx = computeFightAnalysis(weekFights, allFights);
    const rivalry = detectRivalryMatchup(weekFights, ctx);
    expect(rivalry).toEqual({ a: 'Alice', b: 'Bob', count: 3 });
  });

  it('selects the rivalry with the highest count when multiple candidates exist', () => {
    // Alice & Bob fought 3 times
    const ab1 = createFight({ a: 'Alice', d: 'Bob' });
    const ab2 = createFight({ a: 'Alice', d: 'Bob' });
    const ab3 = createFight({ a: 'Alice', d: 'Bob' });

    // Charlie & Dave fought 4 times
    const cd1 = createFight({ a: 'Charlie', d: 'Dave' });
    const cd2 = createFight({ a: 'Charlie', d: 'Dave' });
    const cd3 = createFight({ a: 'Charlie', d: 'Dave' });
    const cd4 = createFight({ a: 'Charlie', d: 'Dave' });

    const allFights = [ab1, ab2, ab3, cd1, cd2, cd3, cd4];
    const weekFights = [ab3, cd4];

    const ctx = computeFightAnalysis(weekFights, allFights);
    const rivalry = detectRivalryMatchup(weekFights, ctx);
    // Should pick Charlie/Dave because count is 4 > 3
    expect(rivalry).toEqual({ a: 'Charlie', b: 'Dave', count: 4 });
  });

  it('handles null or undefined fights gracefully', () => {
    const f1 = createFight({ a: 'Alice', d: 'Bob' });
    const f2 = createFight({ a: 'Alice', d: 'Bob' });
    const f3 = createFight({ a: 'Alice', d: 'Bob' });

    // Explicitly add undefined/null (as any as FightSummary to bypass type check in test)
    const allFights = [f1, null, f2, undefined, f3] as any as FightSummary[];
    const weekFights = [null, f3] as any as FightSummary[];

    const ctx = computeFightAnalysis(weekFights, allFights);
    const rivalry = detectRivalryMatchup(weekFights, ctx);
    expect(rivalry).toEqual({ a: 'Alice', b: 'Bob', count: 3 });
  });
});

describe('detectHotStreakers', () => {
  it('detects winners on a streak of 5+', () => {
    const streaks = new Map<WarriorId, number>([
      ['w-alice' as WarriorId, 5],
      ['w-bob' as WarriorId, 4],
    ]);
    const weekFights = [
      createFight({ a: 'Alice', d: 'Charlie', winner: 'A' }),
      createFight({ a: 'Bob', d: 'Dave', winner: 'A' }),
    ];
    const hot = detectHotStreakers(weekFights, streaks);
    expect(hot).toHaveLength(1);
    expect(hot[0]!.name).toBe('Alice');
    expect(hot[0]!.streak).toBe(5);
  });
});

describe('detectRisingStars', () => {
  it('detects warriors who are 3-0 after this week', () => {
    const f1 = createFight({ a: 'Alice', d: 'B', winner: 'A' });
    const f2 = createFight({ a: 'Alice', d: 'C', winner: 'A' });
    const f3 = createFight({ a: 'Alice', d: 'D', winner: 'A' });
    const allFights = [f1, f2, f3];
    const weekFights = [f3];

    const ctx = computeFightAnalysis(weekFights, allFights);
    const stars = detectRisingStars(weekFights, ctx);
    expect(stars).toContain('Alice');
  });

  it('does not detect warriors with losses', () => {
    const f1 = createFight({ a: 'Alice', d: 'B', winner: 'D' });
    const f2 = createFight({ a: 'Alice', d: 'C', winner: 'A' });
    const f3 = createFight({ a: 'Alice', d: 'D', winner: 'A' });
    const allFights = [f1, f2, f3];
    const weekFights = [f3];

    const ctx = computeFightAnalysis(weekFights, allFights);
    const stars = detectRisingStars(weekFights, ctx);
    expect(stars).toHaveLength(0);
  });
});

describe('computeFightAnalysis', () => {
  it('returns empty maps/sets for empty inputs', () => {
    const ctx = computeFightAnalysis([], []);
    expect(ctx.streaks.size).toBe(0);
    expect(ctx.priorWarriorIds.size).toBe(0);
    expect(ctx.warriorStats.size).toBe(0);
    expect(ctx.pairCounts.size).toBe(0);
  });

  it('skips null/undefined entries in allFights gracefully', () => {
    const allFights = [
      createFight({ a: 'Alice', d: 'Bob', winner: 'A' }),
      null as any,
      undefined as any,
      createFight({ a: 'Alice', d: 'Charlie', winner: 'A' }),
    ];
    const ctx = computeFightAnalysis([], allFights);
    expect(ctx.streaks.get('w-alice' as WarriorId)).toBe(2);
    expect(ctx.streaks.get('w-bob' as WarriorId)).toBe(-1);
    expect(ctx.streaks.get('w-charlie' as WarriorId)).toBe(-1);
  });

  it('streaks output matches computeStreaks exactly (behavioral equivalence)', () => {
    const fights = [
      createFight({ a: 'Alice', d: 'Bob', winner: 'A' }),
      createFight({ a: 'Alice', d: 'Charlie', winner: 'A' }),
      createFight({ a: 'Dave', d: 'Alice', winner: 'D' }),
      createFight({ a: 'Alice', d: 'Eve', winner: null }),
      createFight({ a: 'Bob', d: 'Charlie', winner: 'D' }),
    ];
    const ctx = computeFightAnalysis([], fights);
    const standalone = computeStreaks(fights);
    expect(ctx.streaks.size).toBe(standalone.size);
    for (const [key, val] of standalone) {
      expect(ctx.streaks.get(key)).toBe(val);
    }
  });

  it('priorWarriorIds contains warriors from [0..priorCount-1] only', () => {
    const allFights = [
      createFight({ a: 'Alice', d: 'Bob' }),
      createFight({ a: 'Charlie', d: 'Dave' }),
      createFight({ a: 'Eve', d: 'Frank' }),
    ];
    const weekFights = [allFights[2]!]; // Only the 3rd fight is this week
    const ctx = computeFightAnalysis(weekFights, allFights);
    // priorCount = 3 - 1 = 2, so prior fights are index 0 and 1
    expect(ctx.priorWarriorIds.has('w-alice' as WarriorId)).toBe(true);
    expect(ctx.priorWarriorIds.has('w-bob' as WarriorId)).toBe(true);
    expect(ctx.priorWarriorIds.has('w-charlie' as WarriorId)).toBe(true);
    expect(ctx.priorWarriorIds.has('w-dave' as WarriorId)).toBe(true);
    // Eve and Frank are in the week fight, not prior
    expect(ctx.priorWarriorIds.has('w-eve' as WarriorId)).toBe(false);
    expect(ctx.priorWarriorIds.has('w-frank' as WarriorId)).toBe(false);
  });

  it('priorWarriorIds is empty when allFights === weekFights (first week)', () => {
    const weekFights = [
      createFight({ a: 'Alice', d: 'Bob' }),
      createFight({ a: 'Charlie', d: 'Dave' }),
    ];
    const ctx = computeFightAnalysis(weekFights, weekFights);
    expect(ctx.priorWarriorIds.size).toBe(0);
  });

  it('warriorStats counts total fights and wins per warrior across all allFights', () => {
    const allFights = [
      createFight({ a: 'Alice', d: 'Bob', winner: 'A' }), // Alice: 1W, Bob: 1L
      createFight({ a: 'Charlie', d: 'Alice', winner: 'D' }), // Alice: 2T (wins as D), Charlie: 1L
      createFight({ a: 'Alice', d: 'Bob', winner: null }), // Alice: 3T, Bob: 2T
    ];
    const ctx = computeFightAnalysis([], allFights);
    const aliceStats = ctx.warriorStats.get('w-alice' as WarriorId)!;
    expect(aliceStats.total).toBe(3);
    expect(aliceStats.wins).toBe(2); // Won as A in f1, won as D in f2
    const bobStats = ctx.warriorStats.get('w-bob' as WarriorId)!;
    expect(bobStats.total).toBe(2);
    expect(bobStats.wins).toBe(0);
    const charlieStats = ctx.warriorStats.get('w-charlie' as WarriorId)!;
    expect(charlieStats.total).toBe(1);
    expect(charlieStats.wins).toBe(0);
  });

  it('pairCounts uses normalized min||max keys, counts all pair occurrences', () => {
    const allFights = [
      createFight({ a: 'Alice', d: 'Bob' }),
      createFight({ a: 'Bob', d: 'Alice' }), // Same pair, reversed order
      createFight({ a: 'Alice', d: 'Charlie' }),
    ];
    const ctx = computeFightAnalysis([], allFights);
    const aliceBobKey = 'w-alice||w-bob'; // alice < bob alphabetically
    const aliceCharlieKey = 'w-alice||w-charlie';
    expect(ctx.pairCounts.get(aliceBobKey)).toBe(2);
    expect(ctx.pairCounts.get(aliceCharlieKey)).toBe(1);
  });

  it('tracks a single warrior appearing as both A and D across fights', () => {
    const allFights = [
      createFight({ a: 'Alice', d: 'Bob', winner: 'A' }),
      createFight({ a: 'Charlie', d: 'Alice', winner: 'D' }), // Alice wins as D
    ];
    const ctx = computeFightAnalysis([], allFights);
    const aliceStats = ctx.warriorStats.get('w-alice' as WarriorId)!;
    expect(aliceStats.total).toBe(2);
    expect(aliceStats.wins).toBe(2);
    expect(ctx.streaks.get('w-alice' as WarriorId)).toBe(2);
  });
});

describe('detectGazetteTags', () => {
  it('assigns Bloodbath for 2+ kills', () => {
    const fights = [createFight({ by: 'Kill' }), createFight({ by: 'Kill' })];
    const detections = {
      tags: [],
      hotStreakers: [],
      rivalryPair: null,
      risingStars: [],
      upsets: [],
    };
    const tags = detectGazetteTags(fights, detections);
    expect(tags).toContain('Bloodbath');
  });

  it('assigns KO Fest for 3+ KOs', () => {
    const fights = [
      createFight({ by: 'KO' }),
      createFight({ by: 'KO' }),
      createFight({ by: 'KO' }),
    ];
    const detections = {
      tags: [],
      hotStreakers: [],
      rivalryPair: null,
      risingStars: [],
      upsets: [],
    };
    const tags = detectGazetteTags(fights, detections);
    expect(tags).toContain('KO Fest');
  });

  it('assigns Upset when upsets are detected', () => {
    const detections = {
      tags: [],
      hotStreakers: [],
      rivalryPair: null,
      risingStars: [],
      upsets: [{ winner: 'W', loser: 'L', winnerFame: 1, loserFame: 20 }],
    };
    const tags = detectGazetteTags([], detections);
    expect(tags).toContain('Upset');
  });
});
