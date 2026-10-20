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
  type RecruitTier,
} from './types';
import { generateApprentice, generateRecruit } from './generate';

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
  /** Override the 5% base legacy-bloodline roll. */
  legacyChance?: number;
  /** When set, each generated slot rolls this chance to mint an apprentice. */
  apprenticeChance?: number;
}

interface RecruitSlotBase {
  usedNames: Set<string>;
  week: number;
  meta?: StyleMeta;
  legacyCandidates?: Warrior[];
  legacyChance?: number;
  forceTier?: RecruitTier;
}

/** Pick the generator for one pool slot — an extra draw only when the
 *  apprentice roll is actually in play, so unset callers keep the original
 *  RNG sequence. */
function recruitForSlot(
  rng: IRNGService,
  base: RecruitSlotBase,
  apprenticeChance: number | undefined
): PoolWarrior {
  const genArgs = {
    rng,
    usedNames: base.usedNames,
    week: base.week,
    meta: base.meta,
    legacyCandidates: base.legacyCandidates,
    legacyChance: base.legacyChance,
  };
  if (apprenticeChance && rng.next() < apprenticeChance) {
    return generateApprentice(genArgs);
  }
  return generateRecruit({ ...genArgs, forceTier: base.forceTier });
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
  const { count = DEFAULT_POOL_SIZE, week, usedNames, rng, meta, legacyChance } = args;
  const { legacyCandidates = [], apprenticeChance } = args;
  const rngService = resolveRng(rng, week * 9973 + 42);
  const pool: PoolWarrior[] = [];

  // Guarantee at least two Promising+ warriors in a larger pool — these two
  // flagship slots are always open-market recruits, never apprentices.
  pool.push(
    generateRecruit({
      rng: rngService,
      usedNames: usedNames,
      week: week,
      forceTier: rngService.next() < 0.3 ? 'Exceptional' : 'Promising',
      meta: meta,
      legacyCandidates: legacyCandidates,
      legacyChance,
    })
  );
  pool.push(
    generateRecruit({
      rng: rngService,
      usedNames: usedNames,
      week: week,
      forceTier: rngService.next() < 0.1 ? 'Prodigy' : 'Promising',
      meta: meta,
      legacyCandidates: legacyCandidates,
      legacyChance,
    })
  );

  while (pool.length < count) {
    pool.push(
      recruitForSlot(
        rngService,
        { usedNames, week, meta, legacyCandidates, legacyChance },
        apprenticeChance
      )
    );
  }

  return pool;
}

/**
 * Entries that survive every refresh flavour: academy first-look claims,
 * apprentices mid-education, and veteran free agents sitting on the shelf.
 */
function isProtectedPoolEntry(w: PoolWarrior, week: number): boolean {
  return (
    w.source === 'apprentice' ||
    w.source === 'freeAgent' ||
    w.source === 'released' ||
    !!w.veteran ||
    (!!w.academyStableId && (w.academyClaimExpiryWeek ?? 0) >= week)
  );
}

/**
 *
 */
interface PoolRefreshArgs {
  currentPool: PoolWarrior[];
  week: number;
  usedNames: Set<string>;
  rng?: IRNGService;
  meta?: StyleMeta;
  legacyCandidates?: Warrior[];
  stableCount?: number;
  /** Override the 5% base legacy-bloodline roll. */
  legacyChance?: number;
  /** When set, each generated slot rolls this chance to mint an apprentice. */
  apprenticeChance?: number;
}

/** Partial weekly refresh — replace the oldest UNPROTECTED slice, then top
 *  up to the world-scaled target size. Claimed recruits, apprentices, and
 *  veteran/free-agent entries are never culled by the turnover cadence. */
export function partialRefreshPool(args: PoolRefreshArgs): PoolWarrior[] {
  const { currentPool, week, usedNames, rng, meta, legacyChance } = args;
  const { legacyCandidates = [], stableCount = WORLD_RIVAL_FLOOR, apprenticeChance } = args;
  const targetSize = computeRecruitPoolSize(stableCount);
  if (currentPool.length === 0)
    return generateRecruitPool({
      count: targetSize,
      week: week,
      usedNames: usedNames,
      rng: rng,
      meta: meta,
      legacyCandidates: legacyCandidates,
      legacyChance,
      apprenticeChance,
    });

  const protectedEntries = currentPool.filter((w) => isProtectedPoolEntry(w, week));
  const unprotected = currentPool
    .filter((w) => !isProtectedPoolEntry(w, week))
    .sort((a, b) => a.addedWeek - b.addedWeek);
  // Spec §3.4 cadence: a sixth of the pool turns over each week.
  const removeCount = Math.max(2, Math.ceil(targetSize / 6));
  const remaining = [...protectedEntries, ...unprotected.slice(removeCount)];

  // Rebuild used names from remaining
  const remainingNames = new Set(remaining.map((w) => w.name));
  const allUsed = new Set([...usedNames, ...remainingNames]);

  const rngService = resolveRng(rng, week * 7919 + 31);
  const slotBase = { usedNames: allUsed, week, meta, legacyCandidates, legacyChance };
  const culled = Math.min(removeCount, unprotected.length);
  const newWarriors: PoolWarrior[] = [];
  for (let i = 0; i < culled; i++) {
    newWarriors.push(recruitForSlot(rngService, slotBase, apprenticeChance));
  }

  // Top up to the world-scaled target, then cap so the pool can't grow
  // unbounded when AI drafts are slower than the natural turnover rate.
  const newPool = [...remaining, ...newWarriors];
  while (newPool.length < targetSize) {
    newPool.push(recruitForSlot(rngService, slotBase, apprenticeChance));
  }
  const poolHardCap = computeRecruitPoolHardCap(stableCount);
  if (newPool.length > poolHardCap) {
    // Drop oldest unprotected first — protected entries are never trimmed.
    const protectedNow = newPool.filter((w) => isProtectedPoolEntry(w, week));
    const openSlots = Math.max(0, poolHardCap - protectedNow.length);
    const unprotectedNow = newPool
      .filter((w) => !isProtectedPoolEntry(w, week))
      .sort((a, b) => a.addedWeek - b.addedWeek)
      .slice(-openSlots);
    return [...protectedNow, ...unprotectedNow];
  }
  return newPool;
}

/**
 * Full manual refresh of the recruitment pool — non-destructive: protected
 * entries (active claims, apprentices, veteran/free-agent listings) carry
 * over and only the shortfall is regenerated.
 */
export function fullRefreshPool(args: {
  week: number;
  usedNames: Set<string>;
  rng?: IRNGService;
  currentPool?: PoolWarrior[];
  stableCount?: number;
  meta?: StyleMeta;
  legacyCandidates?: Warrior[];
  apprenticeChance?: number;
}): PoolWarrior[] {
  const { week, usedNames, rng } = args;
  const { currentPool = [], stableCount, meta, legacyCandidates = [] } = args;
  const rngService = resolveRng(rng, week * 1337 + 7);
  const targetSize =
    stableCount === undefined ? DEFAULT_POOL_SIZE : computeRecruitPoolSize(stableCount);

  const kept = currentPool.filter((w) => isProtectedPoolEntry(w, week));
  const keptNames = new Set(kept.map((w) => w.name));
  const allUsed = new Set([...usedNames, ...keptNames]);

  const out = [...kept];
  const slotBase = { usedNames: allUsed, week, meta, legacyCandidates };
  while (out.length < targetSize) {
    out.push(recruitForSlot(rngService, slotBase, args.apprenticeChance));
  }
  return out;
}
