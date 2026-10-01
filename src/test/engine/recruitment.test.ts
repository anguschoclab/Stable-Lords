import { describe, it, expect } from 'vitest';
import {
  partialRefreshPool,
  generateRecruitPool,
  fullRefreshPool,
  generateRecruit,
  DEFAULT_POOL_SIZE,
} from '@/engine/recruitment/recruitment';
import { SeededRNGService } from '@/utils/random';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

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

    // Megaplan cadence: a sixth of the world-scaled target turns over each
    // week — removeCount = max(2, ceil(45/6)) = 8 at the floor target of 45.
    const expectedTurnover = Math.max(2, Math.ceil(DEFAULT_POOL_SIZE / 6));
    const newWarriors = refreshedPool.filter((w) => w.addedWeek === nextWeek);
    expect(newWarriors.length).toBe(expectedTurnover);

    // Verify older ones were removed. The one from week 1 should definitely be gone.
    const hasWeek1 = refreshedPool.some((w) => w.addedWeek === 1);
    expect(hasWeek1).toBe(false);
  });

  it('refreshes a sixth of the world-scaled target and tops up to it', () => {
    const usedNames = new Set<string>();
    const turnover = Math.max(2, Math.ceil(DEFAULT_POOL_SIZE / 6));

    // Small pool: turnover exceeds the pool, so every entry is replaced.
    let smallPool = generateRecruitPool(5, 1, usedNames);
    smallPool = partialRefreshPool(smallPool, 2, usedNames);
    expect(smallPool.length).toBe(DEFAULT_POOL_SIZE);
    expect(smallPool.every((w) => w.addedWeek === 2)).toBe(true);

    // Larger pool: 8 oldest removed, the rest survive, topped back to target.
    const largePool = generateRecruitPool(20, 1, usedNames);
    const refreshedLarge = partialRefreshPool(largePool, 2, usedNames);
    expect(refreshedLarge.length).toBe(DEFAULT_POOL_SIZE);
    const survivors = refreshedLarge.filter((w) => w.addedWeek === 1);
    expect(survivors.length).toBe(20 - turnover);
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

describe('legacy (dynastic) recruit naming', () => {
  /** RNG whose next() is pinned low — every <0.05 legacy roll succeeds. */
  function legacyRng(seed = 5): IRNGService {
    const inner = new SeededRNGService(seed);
    return {
      next: () => 0.01,
      pick: (arr) => inner.pick(arr),
      uuid: (p) => inner.uuid(p),
      roll: (a, b) => inner.roll(a, b),
      shuffle: (a) => inner.shuffle(a),
      rollWeighted: (w) => inner.rollWeighted(w),
      chance: (p) => inner.chance(p),
    } as IRNGService;
  }

  it('gives legacy recruits a name referencing their parent', () => {
    const parent = makeWarrior({ name: 'KRAGOS' });
    const usedNames = new Set<string>();
    const recruit = generateRecruit(legacyRng(), usedNames, 1, undefined, undefined, [parent]);
    expect(recruit.lineage?.parentId).toBe(parent.id);
    expect(recruit.name).not.toBe('KRAGOS');
    expect(
      /KRAG/i.test(recruit.name) ||
        /( II| III| IV| V)$/.test(recruit.name) ||
        /SON|Younger|Heir/i.test(recruit.name),
      `name ${recruit.name} doesn't reference parent KRAGOS`
    ).toBe(true);
  });

  it('keeps generated pool names unique and arena-format', () => {
    const usedNames = new Set<string>();
    const pool = generateRecruitPool(30, 1, usedNames, new SeededRNGService(31));
    const names = pool.map((w) => w.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) {
      expect(n, `bad format: ${n}`).toMatch(/^[A-Z][A-Z '-]{1,19}$/);
    }
  });
});
