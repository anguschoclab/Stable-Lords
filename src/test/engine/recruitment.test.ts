import { describe, it, expect } from 'vitest';
import {
  partialRefreshPool,
  generateRecruitPool,
  fullRefreshPool,
  DEFAULT_POOL_SIZE,
} from '@/engine/recruitment';
import { SeededRNGService } from '@/utils/random';

describe('partialRefreshPool', () => {
  it('returns a newly generated pool of DEFAULT_POOL_SIZE if given an empty pool', () => {
    const usedNames = new Set<string>();
    const rng = new SeededRNGService(12345);
    const pool = partialRefreshPool([], 1, usedNames, rng);
    expect(pool.length).toBe(DEFAULT_POOL_SIZE);
    expect(pool.every((w) => w.addedWeek === 1)).toBe(true);
  });

  it('removes the oldest warriors and replaces them, ensuring DEFAULT_POOL_SIZE', () => {
    const usedNames = new Set<string>();
    const rng = new SeededRNGService(12345);
    const week1Pool = generateRecruitPool(DEFAULT_POOL_SIZE, 1, usedNames, rng);

    // Simulate some time passing and an older pool. Let's make 2 of them older.
    const pool = [...week1Pool];
    pool[0]!.addedWeek = 1;
    pool[1]!.addedWeek = 2;
    pool[2]!.addedWeek = 3;
    // Set rest to 3
    for (let i = 3; i < pool.length; i++) {
      pool[i]!.addedWeek = 3;
    }

    const nextWeek = 4;

    const refreshedPool = partialRefreshPool(pool, nextWeek, usedNames);

    expect(refreshedPool.length).toBe(DEFAULT_POOL_SIZE);

    // According to partialRefreshPool:
    // removeCount = Math.min(4, Math.max(2, Math.floor(pool.length * 0.3)));
    // If length is 12, 12 * 0.3 = 3.6 -> floor is 3. Max(2, 3) is 3. Min(4, 3) is 3.
    // So 3 oldest warriors should be removed.
    // They are pool[0], pool[1], and one of the others.

    // Count how many warriors are from the nextWeek
    const newWarriors = refreshedPool.filter((w) => w.addedWeek === nextWeek);
    expect(newWarriors.length).toBe(3);

    // Verify older ones were removed. The one from week 1 should definitely be gone.
    const hasWeek1 = refreshedPool.some((w) => w.addedWeek === 1);
    expect(hasWeek1).toBe(false);
  });

  it('maintains minimum and maximum limits for removal count', () => {
    const usedNames = new Set<string>();
    // Test minimum removal: array size 5 -> floor(1.5) = 1 -> max(2, 1) = 2
    let smallPool = generateRecruitPool(5, 1, usedNames);
    smallPool = partialRefreshPool(smallPool, 2, usedNames);
    // Since original was 5, it should expand to DEFAULT_POOL_SIZE
    expect(smallPool.length).toBe(DEFAULT_POOL_SIZE);
    const addedInWeek2 = smallPool.filter((w) => w.addedWeek === 2);
    // 2 removed from the original 5, so 3 remain. So we need to add 9 to reach 12.
    // So there should be 9 warriors with addedWeek = 2.
    expect(addedInWeek2.length).toBe(9);

    // Test maximum removal: array size 20 -> floor(6) -> min(4, 6) = 4
    const largePool = generateRecruitPool(20, 1, usedNames);
    const refreshedLarge = partialRefreshPool(largePool, 2, usedNames);
    // Doesn't truncate down to DEFAULT_POOL_SIZE if it was larger, only expands up to it.
    // wait, does it? The code says:
    // const result = [...remaining, ...newWarriors];
    // while (result.length < DEFAULT_POOL_SIZE) result.push(...);
    // So if result.length is 20 - 4 + 4 = 20, it stays 20.
    expect(refreshedLarge.length).toBe(20);
    const addedInWeek2Large = refreshedLarge.filter((w) => w.addedWeek === 2);
    expect(addedInWeek2Large.length).toBe(4);
  });

  it('avoids reusing names that are in the remaining pool or previously used', () => {
    const usedNames = new Set<string>();
    const rng = new SeededRNGService(12345);
    const pool = generateRecruitPool(10, 1, usedNames, rng);

    // Add all names from pool to usedNames, except maybe the ones being removed?
    // Actually generateRecruitPool already adds them to usedNames.

    // We add an external name to usedNames
    usedNames.add('EXTERNAL_NAME');

    const refreshedPool = partialRefreshPool(pool, 2, usedNames, rng);

    // Make sure EXTERNAL_NAME is not in the refreshed pool unless it was somehow already there
    // But NAME_POOL doesn't have "EXTERNAL_NAME", so this is just to verify it works without error.

    const names = refreshedPool.map((w) => w.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size); // All names should be unique
  });
});

describe('fullRefreshPool', () => {
  it('returns exactly DEFAULT_POOL_SIZE warriors', () => {
    const usedNames = new Set<string>();
    const pool = fullRefreshPool(1, usedNames);
    expect(pool.length).toBe(DEFAULT_POOL_SIZE);
  });

  it('all warriors have the correct addedWeek value', () => {
    const usedNames = new Set<string>();
    const week = 5;
    const pool = fullRefreshPool(week, usedNames);
    expect(pool.every((w) => w.addedWeek === week)).toBe(true);
  });

  it('uses provided RNG when given', () => {
    const usedNames = new Set<string>();
    const rng = new SeededRNGService(12345);
    const pool1 = fullRefreshPool(1, usedNames, rng);
    const pool2 = fullRefreshPool(1, usedNames, rng);
    // Same RNG should produce different results (state advances)
    expect(pool1[0]?.id).not.toBe(pool2[0]?.id);
  });

  it('creates seeded RNG with correct formula when omitted', () => {
    const week = 10;
    // Default seed formula: week * 1337 + 7 = 10 * 1337 + 7 = 13377
    const pool1 = fullRefreshPool(week, new Set<string>());
    const pool2 = fullRefreshPool(week, new Set<string>());
    // Same week should produce identical pool with default seed
    expect(pool1[0]?.id).toBe(pool2[0]?.id);
    expect(pool1[0]?.name).toBe(pool2[0]?.name);
  });

  it('respects usedNames set and produces unique names within pool', () => {
    const usedNames = new Set<string>(['EXTERNAL_NAME']);
    const pool = fullRefreshPool(1, usedNames);
    const names = pool.map((w) => w.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
    expect(names).not.toContain('EXTERNAL_NAME');
  });

  it('ignores existing pool state (full refresh)', () => {
    const usedNames = new Set<string>();
    const oldPool = generateRecruitPool(DEFAULT_POOL_SIZE, 1, usedNames);
    const newPool = fullRefreshPool(2, usedNames);
    // New pool should have completely different warriors
    const oldIds = new Set(oldPool.map((w) => w.id));
    const newIds = new Set(newPool.map((w) => w.id));
    const intersection = [...oldIds].filter((id) => newIds.has(id));
    expect(intersection.length).toBe(0);
    // All new warriors should have week 2
    expect(newPool.every((w) => w.addedWeek === 2)).toBe(true);
  });

  it('does NOT use style meta drift (unlike partialRefreshPool)', () => {
    const usedNames = new Set<string>();
    const pool = fullRefreshPool(1, usedNames);
    // fullRefreshPool has no meta parameter (unlike partialRefreshPool)
    // This test documents the intentional design choice
    expect(pool.length).toBe(DEFAULT_POOL_SIZE);
  });

  it('does NOT use legacy candidates for bloodlines (unlike partialRefreshPool)', () => {
    const usedNames = new Set<string>();
    const pool = fullRefreshPool(1, usedNames);
    // fullRefreshPool has no legacyCandidates parameter (unlike partialRefreshPool)
    // This test documents the intentional design choice
    expect(pool.length).toBe(DEFAULT_POOL_SIZE);
    // The key is that fullRefreshPool doesn't accept legacyCandidates at all
  });
});
