import { type Warrior } from '@/types/warrior.types';
import { type StyleMeta } from '../../analytics/metaDrift';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { WORLD_RIVAL_FLOOR } from '@/constants/world';
import {
  computeRecruitPoolHardCap,
  computeRecruitPoolSize,
  DEFAULT_POOL_SIZE,
  type PoolWarrior,
} from './types';
import { generateRecruit } from './generate';

/**
 *
 */
interface GenerateRecruitPoolArgs {
  count?: number;
  week: number;
  usedNames: Set<string>;
  rng?: IRNGService;
  meta?: StyleMeta;
  legacyCandidates?: Warrior[];
}

/**
 * Generates a full pool of recruits.
 *
 * @param args.count - Number of recruits to generate
 * @param args.week - Current game week
 * @param args.usedNames - Set of names already in use
 * @param args.rng - Optional RNG service
 * @param args.meta - Optional style meta
 * @param args.legacyCandidates - Optional list of former warriors
 * @returns An array of generated PoolWarriors
 */
export function generateRecruitPool(args: GenerateRecruitPoolArgs): PoolWarrior[] {
  const { count = DEFAULT_POOL_SIZE, week, usedNames, rng, meta } = args;
  const { legacyCandidates = [] } = args;
  const rngService = resolveRng(rng, week * 9973 + 42);
  const pool: PoolWarrior[] = [];

  // Guarantee at least two Promising+ warriors in a larger pool
  pool.push(
    generateRecruit(
      { rng: rngService, usedNames: usedNames, week: week, forceTier: rngService.next() < 0.3 ? 'Exceptional' : 'Promising', meta: meta, legacyCandidates: legacyCandidates }
    )
  );
  pool.push(
    generateRecruit(
      { rng: rngService, usedNames: usedNames, week: week, forceTier: rngService.next() < 0.1 ? 'Prodigy' : 'Promising', meta: meta, legacyCandidates: legacyCandidates }
    )
  );

  while (pool.length < count) {
    pool.push(generateRecruit({ rng: rngService, usedNames: usedNames, week: week, forceTier: undefined, meta: meta, legacyCandidates: legacyCandidates }));
  }

  return pool;
}

/**
 *
 */
interface PartialRefreshPoolArgs {
  currentPool: PoolWarrior[];
  week: number;
  usedNames: Set<string>;
  rng?: IRNGService;
  meta?: StyleMeta;
  legacyCandidates?: Warrior[];
  stableCount?: number;
}

/** Partial weekly refresh — replace the oldest slice, then top up to the
 *  world-scaled target size. */
export function partialRefreshPool(args: PartialRefreshPoolArgs): PoolWarrior[] {
  const { currentPool, week, usedNames, rng, meta } = args;
  const { legacyCandidates = [], stableCount = WORLD_RIVAL_FLOOR } = args;
  const targetSize = computeRecruitPoolSize(stableCount);
  if (currentPool.length === 0)
    return generateRecruitPool({ count: targetSize, week: week, usedNames: usedNames, rng: rng, meta: meta, legacyCandidates: legacyCandidates });

  const sorted = [...currentPool].sort((a, b) => a.addedWeek - b.addedWeek);
  // Spec §3.4 cadence: a sixth of the pool turns over each week.
  const removeCount = Math.max(2, Math.ceil(targetSize / 6));
  const remaining = sorted.slice(removeCount);

  // Rebuild used names from remaining
  const remainingNames = new Set(remaining.map((w) => w.name));
  const allUsed = new Set([...usedNames, ...remainingNames]);

  const rngService = resolveRng(rng, week * 7919 + 31);
  const newWarriors: PoolWarrior[] = [];
  for (let i = 0; i < removeCount; i++) {
    newWarriors.push(generateRecruit({ rng: rngService, usedNames: allUsed, week: week, forceTier: undefined, meta: meta, legacyCandidates: legacyCandidates }));
  }

  // Top up to the world-scaled target, then cap so the pool can't grow
  // unbounded when AI drafts are slower than the natural turnover rate.
  const newPool = [...remaining, ...newWarriors];
  while (newPool.length < targetSize) {
    newPool.push(generateRecruit({ rng: rngService, usedNames: allUsed, week: week, forceTier: undefined, meta: meta, legacyCandidates: legacyCandidates }));
  }
  const poolHardCap = computeRecruitPoolHardCap(stableCount);
  if (newPool.length > poolHardCap) {
    // Drop oldest first so the pool stays fresh
    return newPool.sort((a, b) => a.addedWeek - b.addedWeek).slice(-poolHardCap);
  }
  return newPool;
}

/**
 * Full manual refresh of the recruitment pool.
 *
 * @param week - Current game week
 * @param usedNames - Set of names already in use
 * @param rng - Optional RNG service
 * @returns A fresh array of PoolWarriors
 */
export function fullRefreshPool(
  week: number,
  usedNames: Set<string>,
  rng?: IRNGService
): PoolWarrior[] {
  const rngService = resolveRng(rng, week * 1337 + 7);
  return generateRecruitPool({ count: DEFAULT_POOL_SIZE, week: week, usedNames: usedNames, rng: rngService });
}
