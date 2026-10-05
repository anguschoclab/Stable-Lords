import type { GameState, RivalStableData, Warrior } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { generateRivalStables, uniqueOwnerName, uniqueStableName } from '../rivals';
import { collectUsedWarriorIds, collectUsedWarriorNames } from '@/engine/core/warriorCollection';
import { inheritCrest } from '../crest/crestGenerator';
import {
  WORLD_RIVAL_FLOOR,
  WORLD_RIVAL_SOFT_CAP,
  WORLD_RIVAL_HARD_CAP,
  EXPANSION_MAX_PER_CHURN,
  EXPANSION_MINT_ATTEMPTS,
  ORGANIC_LICENSE_CHANCE,
  ORGANIC_LICENSE_BATCH_MIN,
  ORGANIC_LICENSE_BATCH_MAX,
  RECRUIT_POOL_MIN,
} from '@/constants/world';
import { AI_TREASURY_THRESHOLDS } from '@/constants/economy';
import { deriveFounderTrainer, founderStableName, personalityFromCareer } from './legacyFounder';

/**
 * ExpansionService — world population control for the seasonal churn.
 *
 * Three additive sources, bounded by a per-churn budget:
 *   1. Legacy founders — queued Hall-of-Fame retirees mint stables regardless
 *      of floor/soft cap (never past the hard cap; they wait in the queue).
 *   2. Floor refill — the world never stays below WORLD_RIVAL_FLOOR.
 *   3. Organic licensing — small conditional growth while the economy is
 *      healthy and the count sits between floor and soft cap.
 */
type MintedStableOrigin = 'legacy' | 'floor-refill' | 'organic';

/** A freshly minted rival stable tagged with the source that produced it. */
export interface MintedStable {
  stable: RivalStableData;
  origin: MintedStableOrigin;
}

/** Living stable and owner names a mint must not collide with. */
interface LiveNames {
  stableNames: Set<string>;
  ownerNames: Set<string>;
}

/**
 * Overlay a retired-warrior legacy founder onto a freshly generated stable:
 * owner identity, career-derived personality, favored styles from the
 * founder's own record, crest inheritance from the parent stable, and the
 * founder installed as head trainer.
 */
function applyLegacyFounder(
  newStable: RivalStableData,
  founder: Warrior,
  rivalsById: Map<string, RivalStableData>,
  rng: IRNGService,
  liveNames: LiveNames
): void {
  newStable.owner.name = uniqueOwnerName(founder.name, liveNames.ownerNames);
  newStable.owner.stableName = uniqueStableName(
    founderStableName(founder),
    liveNames.stableNames
  );
  newStable.owner.backstoryId = 'gladiator';
  newStable.owner.foundedByWarriorId = founder.id;
  newStable.owner.foundedByWarriorName = founder.name;
  newStable.owner.parentStableId = founder.stableId as RivalStableData['id'] | undefined;
  newStable.owner.personality = personalityFromCareer(founder);
  // The stable teaches what the founder knew — their style first.
  newStable.owner.favoredStyles = [founder.style];
  newStable.philosophy = 'Specialist';

  // Crest inheritance from the parent stable, when it still exists.
  const parentStable = founder.stableId ? rivalsById.get(founder.stableId as string) : undefined;
  const crestSeed = Math.floor(rng.next() * 100000);
  if (parentStable?.crest) {
    newStable.crest = inheritCrest(parentStable.crest, crestSeed);
    newStable.owner.generation = (parentStable.owner?.generation ?? 0) + 1;
  } else {
    const baseCrest = newStable.crest;
    if (baseCrest) newStable.crest = inheritCrest(baseCrest, crestSeed);
    newStable.owner.generation = 1;
  }

  // The founder takes over the training room — drop the weakest hire if the
  // minted stable already carries a full staff.
  const founderTrainer = deriveFounderTrainer(founder);
  const trainers = [...(newStable.trainers ?? [])];
  const TIER_RANK = { Novice: 0, Seasoned: 1, Master: 2 } as const;
  if (trainers.length >= 5) {
    let weakestIdx = 0;
    for (let i = 1; i < trainers.length; i++) {
      const cur = trainers[i];
      const weak = trainers[weakestIdx];
      if (cur && weak && TIER_RANK[cur.tier] < TIER_RANK[weak.tier]) weakestIdx = i;
    }
    trainers.splice(weakestIdx, 1);
  }
  newStable.trainers = [founderTrainer, ...trainers];
}

/** Bookkeeping every mint path shares — live stables plus the global
 * uniqueness domains (ids, warrior names, stable/owner names). */
interface MintCtx {
  rivalsById: Map<string, RivalStableData>;
  usedWarriorIds: Set<string>;
  usedNames: Set<string>;
  liveNames: LiveNames;
  minted: MintedStable[];
}

/** Mint one stable whose ids/names collide with nothing already live. */
function mintStable(
  state: GameState,
  rng: IRNGService,
  ctx: MintCtx
): RivalStableData | undefined {
  for (let attempt = 0; attempt < EXPANSION_MINT_ATTEMPTS; attempt++) {
    const candidate = generateRivalStables(
      1,
      Math.floor(rng.next() * 10001),
      state.week,
      ctx.usedNames
    )[0];
    if (!candidate) break;
    if (
      ctx.rivalsById.has(candidate.id) ||
      candidate.roster.some((w) => ctx.usedWarriorIds.has(w.id))
    ) {
      continue;
    }
    // Template stables number ~21 — far fewer than the world floor — so
    // mid-game mints must suffix colliding stable/owner names dynasty-style.
    candidate.owner = {
      ...candidate.owner,
      stableName: uniqueStableName(candidate.owner.stableName, ctx.liveNames.stableNames),
      name: uniqueOwnerName(candidate.owner.name, ctx.liveNames.ownerNames),
    };
    return candidate;
  }
  return undefined;
}

/** Register a freshly minted stable into the bookkeeping sets. */
function registerMinted(
  stable: RivalStableData,
  origin: MintedStableOrigin,
  state: GameState,
  ctx: MintCtx
): void {
  const stamped: RivalStableData = {
    ...stable,
    establishedAbsoluteWeek: state.absoluteWeek ?? state.week,
  };
  ctx.rivalsById.set(stamped.id, stamped);
  ctx.liveNames.stableNames.add(stamped.owner.stableName);
  ctx.liveNames.ownerNames.add(stamped.owner.name);
  for (const w of stamped.roster) {
    ctx.usedWarriorIds.add(w.id);
    ctx.usedNames.add(w.name);
  }
  ctx.minted.push({ stable: stamped, origin });
}

/** Drain the founder queue up to budget — leftover founders wait for the
 * next churn. Returns the remaining budget. */
function mintFromFounderQueue(
  state: GameState,
  rng: IRNGService,
  ctx: MintCtx,
  queue: Warrior[],
  budget: number
): number {
  while (budget > 0 && queue.length > 0 && ctx.rivalsById.size < WORLD_RIVAL_HARD_CAP) {
    const founder = queue.shift();
    if (!founder) break;
    const newStable = mintStable(state, rng, ctx);
    if (!newStable) continue; // rare: mint collisions — the founder retires quietly
    applyLegacyFounder(newStable, founder, ctx.rivalsById, rng, ctx.liveNames);
    registerMinted(newStable, 'legacy', state, ctx);
    budget--;
  }
  return budget;
}

/** Refill to the world floor — the world never stays below it. */
function refillToFloor(state: GameState, rng: IRNGService, ctx: MintCtx, budget: number): number {
  const refill = Math.min(WORLD_RIVAL_FLOOR - ctx.rivalsById.size, budget);
  for (let i = 0; i < refill; i++) {
    const newStable = mintStable(state, rng, ctx);
    if (!newStable) break;
    registerMinted(newStable, 'floor-refill', state, ctx);
    budget--;
  }
  return budget;
}

/** Roll organic licensing — a healthy economy between floor and soft cap
 * occasionally grants new arena licenses. */
function rollOrganicLicensing(
  state: GameState,
  rng: IRNGService,
  ctx: MintCtx,
  budget: number
): number {
  if (
    budget <= 0 ||
    ctx.rivalsById.size < WORLD_RIVAL_FLOOR ||
    ctx.rivalsById.size >= WORLD_RIVAL_SOFT_CAP ||
    !economyIsHealthy(state, ctx.rivalsById) ||
    (state.recruitPool?.length ?? 0) < RECRUIT_POOL_MIN ||
    rng.next() >= ORGANIC_LICENSE_CHANCE
  ) {
    return budget;
  }
  const batch = Math.min(
    budget,
    WORLD_RIVAL_SOFT_CAP - ctx.rivalsById.size,
    ORGANIC_LICENSE_BATCH_MIN +
      Math.floor(rng.next() * (ORGANIC_LICENSE_BATCH_MAX - ORGANIC_LICENSE_BATCH_MIN + 1))
  );
  for (let i = 0; i < batch; i++) {
    const newStable = mintStable(state, rng, ctx);
    if (!newStable) break;
    registerMinted(newStable, 'organic', state, ctx);
    budget--;
  }
  return budget;
}

export const ExpansionService = {
  /**
   * Process the seasonal expansion: consume the legacy-founder queue, refill
   * below the floor, and roll organic licensing while the economy is healthy.
   * Returns the updated state (rivals + remaining queue) and the minted
   * stables with their origin tag.
   */
  processExpansion(
    state: GameState,
    rng: IRNGService
  ): { updatedState: GameState; minted: MintedStable[] } {
    const ctx: MintCtx = {
      rivalsById: new Map((state.rivals || []).map((r) => [r.id, r])),
      usedWarriorIds: collectUsedWarriorIds(state),
      usedNames: collectUsedWarriorNames(state),
      liveNames: { stableNames: new Set(), ownerNames: new Set() },
      minted: [],
    };
    for (const r of state.rivals || []) {
      ctx.liveNames.stableNames.add(r.owner.stableName);
      ctx.liveNames.ownerNames.add(r.owner.name);
    }
    if (state.player) {
      ctx.liveNames.stableNames.add(state.player.stableName);
      ctx.liveNames.ownerNames.add(state.player.name);
    }

    const queue = [...(state.legacyFounderQueue ?? [])];
    let budget = EXPANSION_MAX_PER_CHURN;

    // 1. Legacy founders — additive up to the hard cap.
    budget = mintFromFounderQueue(state, rng, ctx, queue, budget);
    // 2. Floor refill — the world never stays below WORLD_RIVAL_FLOOR.
    budget = refillToFloor(state, rng, ctx, budget);
    // 3. Organic licensing — healthy economy between floor and soft cap.
    rollOrganicLicensing(state, rng, ctx, budget);

    const updatedState: GameState = {
      ...state,
      rivals: [...(state.rivals ?? []), ...ctx.minted.map((m) => m.stable)],
      legacyFounderQueue: queue,
    };

    return { updatedState, minted: ctx.minted };
  },
} as const;

/** Median-treasury health gate for organic licensing. */
function economyIsHealthy(_state: GameState, rivalsById: Map<string, RivalStableData>): boolean {
  const treasuries = [...rivalsById.values()].map((r) => r.treasury).sort((a, b) => a - b);
  if (treasuries.length === 0) return false;
  const median = treasuries[Math.floor(treasuries.length / 2)] ?? 0;
  return median >= AI_TREASURY_THRESHOLDS.HEALTHY;
}
