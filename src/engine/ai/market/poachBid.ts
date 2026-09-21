import type { GameState, RivalStableData } from '@/types/state.types';
import type { StableId, WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { computeWarriorLiability } from '@/engine/warriorValue';
import { policyFor } from '@/engine/ai/traitPolicy';
import { checkBudget } from '@/engine/ai/workers/budgetWorker';
import { logAgentAction } from '@/engine/ai/agentCore';
import { aiRosterMax, AI_GENERATED_RECRUIT_COST } from '@/constants/ai';
import { WEEKS_PER_SEASON } from '@/constants/core';
import { isAIDebugEnabled } from '@/engine/ai/debug';

/** A tabled poach bid: the buyer pays `price` to `sellerStableId` for `warriorId`. */
export interface PoachBid {
  buyerStableId: StableId;
  sellerStableId: StableId;
  warriorId: WarriorId;
  price: number;
  playerBound: boolean;
}

/** Outcome of one poaching sweep: updated rival stables plus gazette lines. */
export interface PoachMarketResult {
  updatedRivals: RivalStableData[];
  gazetteItems: string[];
}

/**
 * Poaching is on by default; set `globalThis.AI_POACHING = false` to suppress
 * the market for a staged rollout.
 */
export function isPoachingEnabled(): boolean {
  return (globalThis as { AI_POACHING?: boolean }).AI_POACHING !== false;
}

/** Season index (0-based) for an absolute week — gates the once-per-season poach cadence. */
export function seasonIndexFor(absoluteWeek: number): number {
  return Math.floor(Math.max(0, absoluteWeek - 1) / WEEKS_PER_SEASON);
}

/** Positive-trait value carried by the warrior — the developable upside the buyer covets. */
function positiveTraitValue(liability: ReturnType<typeof computeWarriorLiability>): number {
  const f = liability.factors.find((x) => x.name === 'positive traits');
  return f ? Math.max(0, -f.weight) : 0;
}

function clampPrice(v: number): number {
  return Math.max(30, Math.min(300, Math.round(v)));
}

interface PoachTarget {
  warrior: Warrior;
  sellerStableId: StableId;
  sellerPersonality: RivalStableData['owner']['personality'] | undefined;
  playerBound: boolean;
  liabilityScore: number;
  traitValue: number;
}

/**
 * Pick the rival warrior most worth poaching: highest liability that still
 * clears the SELLER's own cut threshold (the seller would drop them anyway)
 * and carries at least one positive trait (the buyer sees recoverable upside).
 * The player's roster is scanned under the Pragmatic default threshold — the
 * buyer can't see the player's internal policy, so it guesses conservatively.
 */
function pickPoachTarget(
  buyer: RivalStableData,
  rivals: RivalStableData[],
  state: GameState
): PoachTarget | null {
  let best: PoachTarget | null = null;
  const consider = (
    warrior: Warrior,
    sellerStableId: StableId,
    sellerPersonality: PoachTarget['sellerPersonality'],
    playerBound: boolean
  ) => {
    const liability = computeWarriorLiability(warrior);
    const cutThreshold = policyFor(sellerPersonality).cutLiabilityThreshold;
    if (liability.score < cutThreshold) return;
    const traitValue = positiveTraitValue(liability);
    if (traitValue <= 0) return;
    if (
      best === null ||
      liability.score > best.liabilityScore ||
      (liability.score === best.liabilityScore && warrior.id < best.warrior.id)
    ) {
      best = { warrior, sellerStableId, sellerPersonality, playerBound, liabilityScore: liability.score, traitValue };
    }
  };

  for (const rival of rivals) {
    if (rival.id === buyer.id) continue;
    for (const w of rival.roster) consider(w, rival.id, rival.owner?.personality, false);
  }
  for (const w of state.roster) consider(w, state.player.id, undefined, true);
  return best;
}

/**
 * Pure valuation + gating: returns the bid the buyer would table this season,
 * or null if any constraint fails. Does not mutate.
 */
export function computePoachBid(
  buyer: RivalStableData,
  rivals: RivalStableData[],
  state: GameState,
  seasonIndex: number
): PoachBid | null {
  if (!isPoachingEnabled()) return null;
  if (buyer.strategy?.intent !== 'WEALTH_ACCUMULATION') return null;
  if (buyer.lastPoachSeason === seasonIndex) return null;
  if (buyer.roster.length >= aiRosterMax(buyer.owner?.personality)) return null;

  const target = pickPoachTarget(buyer, rivals, state);
  if (!target) return null;

  // Price: base recruit cost plus the recoverable trait upside, discounted by
  // how badly the seller wants rid of the warrior.
  const price = clampPrice(
    AI_GENERATED_RECRUIT_COST + target.traitValue - Math.round(target.liabilityScore / 2)
  );

  const budget = checkBudget(buyer, price, 'ROSTER');
  if (!budget.isAffordable) return null;

  return {
    buyerStableId: buyer.id,
    sellerStableId: target.sellerStableId,
    warriorId: target.warrior.id,
    price,
    playerBound: target.playerBound,
  };
}

/**
 * Execute one poaching sweep. AI-AI bids transfer the warrior and settle
 * treasuries. Player-bound bids surface a gazette decision item only — the
 * player's roster is never mutated.
 */
export function processPoachMarket(
  state: GameState,
  rivals: RivalStableData[]
): PoachMarketResult {
  const gazetteItems: string[] = [];
  if (!isPoachingEnabled()) return { updatedRivals: rivals, gazetteItems };

  const seasonIndex = seasonIndexFor(state.absoluteWeek);
  const byId = new Map(rivals.map((r) => [r.id, r] as const));

  for (const rival of rivals) {
    const bid = computePoachBid(rival, rivals, state, seasonIndex);
    if (!bid) continue;

    const stamped = { ...rival, lastPoachSeason: seasonIndex };
    byId.set(rival.id, stamped);

    if (bid.playerBound) {
      const target = state.roster.find((w) => w.id === bid.warriorId);
      const desc =
        `Poach bid on your warrior ${target?.name ?? String(bid.warriorId)} — ` +
        `${rival.owner.name} offers ${bid.price}g (publicized, awaits your decision)`;
      gazetteItems.push(`[POACH] ${desc}`);
      byId.set(
        rival.id,
        logAgentAction(stamped, 'ROSTER', desc, 'Medium', state.absoluteWeek)
      );
      if (isAIDebugEnabled())
        console.debug(`[poach] ${rival.id} -> player ${bid.warriorId} @ ${bid.price}g`);
      continue;
    }

    const seller = byId.get(bid.sellerStableId);
    const target = seller?.roster.find((w) => w.id === bid.warriorId);
    if (!seller || !target) continue;

    const moved: Warrior = { ...target, stableId: rival.id };
    const buyerAfter = {
      ...stamped,
      treasury: stamped.treasury - bid.price,
      roster: [...stamped.roster, moved],
    };
    byId.set(rival.id, buyerAfter);
    byId.set(seller.id, {
      ...seller,
      treasury: seller.treasury + bid.price,
      roster: seller.roster.filter((w) => w.id !== bid.warriorId),
    });

    const desc = `Poached ${target.name} from ${seller.owner.name} for ${bid.price}g`;
    gazetteItems.push(`[POACH] ${desc}`);
    byId.set(
      rival.id,
      logAgentAction(buyerAfter, 'ROSTER', desc, 'Medium', state.absoluteWeek)
    );
    if (isAIDebugEnabled())
      console.debug(`[poach] ${rival.id} -> ${seller.id} ${bid.warriorId} @ ${bid.price}g`);
  }

  return { updatedRivals: rivals.map((r) => byId.get(r.id) ?? r), gazetteItems };
}
