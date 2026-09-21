import { describe, it, expect, afterEach } from 'vitest';
import {
  computePoachBid,
  processPoachMarket,
  seasonIndexFor,
  isPoachingEnabled,
} from '@/engine/ai/market/poachBid';
import { makeRival, makeWarrior, makeGameState } from '@/test/_fixtures/factories';
import { aiRosterMax } from '@/constants/ai';
import { policyFor } from '@/engine/ai/traitPolicy';
import { computeWarriorLiability } from '@/engine/warriorValue';
import type { StableId, WarriorId } from '@/types/shared.types';
import { WEEKS_PER_SEASON } from '@/constants/core';

function wealthyBuyer(over: Parameters<typeof makeRival>[0] = {}) {
  return makeRival({
    id: 'buyer-1' as StableId,
    treasury: 2000,
    roster: Array.from({ length: 4 }, (_, i) =>
      makeWarrior({ id: `bw-${i}` as WarriorId, stableId: 'buyer-1' as StableId })
    ),
    strategy: { intent: 'WEALTH_ACCUMULATION', planWeeksRemaining: 4 },
    ...over,
  });
}

/** Warrior whose liability clears the seller's cut threshold but who carries
 *  a positive trait — a developable asset, not dead weight. */
function poachableWarrior(id: string, stableId: string) {
  return makeWarrior({
    id: id as WarriorId,
    stableId: stableId as StableId,
    traits: ['glass_jaw', 'brittle', 'steady_hand'],
    fame: 40,
    career: { wins: 1, losses: 7, kills: 0 },
  });
}

describe('computePoachBid (G.2)', () => {
  afterEach(() => {
    (globalThis as { AI_POACHING?: boolean }).AI_POACHING = undefined;
  });

  it('WEALTH_ACCUMULATION buyer bids on a high-liability warrior a seller would cut', () => {
    const buyer = wealthyBuyer();
    const seller = makeRival({
      id: 'seller-1' as StableId,
      roster: [poachableWarrior('sw-1', 'seller-1')],
    });
    const state = makeGameState({ rivals: [buyer, seller] });

    const bid = computePoachBid(buyer, [buyer, seller], state, 0);
    expect(bid).not.toBeNull();
    expect(bid!.warriorId).toBe('sw-1' as WarriorId);
    expect(bid!.sellerStableId).toBe('seller-1' as StableId);
    expect(bid!.playerBound).toBe(false);
    expect(bid!.price).toBeGreaterThan(0);
    // Liability really is above the seller's cut threshold — the bid is honest
    expect(
      computeWarriorLiability(seller.roster[0]!).score
    ).toBeGreaterThanOrEqual(policyFor(seller.owner.personality).cutLiabilityThreshold);
  });

  it('returns null for non-WEALTH_ACCUMULATION buyers', () => {
    const buyer = wealthyBuyer({ strategy: { intent: 'EXPANSION', planWeeksRemaining: 3 } });
    const seller = makeRival({ id: 'seller-1' as StableId, roster: [poachableWarrior('sw-1', 'seller-1')] });
    const state = makeGameState({ rivals: [buyer, seller] });
    expect(computePoachBid(buyer, [buyer, seller], state, 0)).toBeNull();
  });

  it('respects the roster cap — a full stable does not bid', () => {
    const buyer = wealthyBuyer({
      roster: Array.from({ length: aiRosterMax('Pragmatic') }, (_, i) =>
        makeWarrior({ id: `bw-${i}` as WarriorId, stableId: 'buyer-1' as StableId })
      ),
    });
    const seller = makeRival({ id: 'seller-1' as StableId, roster: [poachableWarrior('sw-1', 'seller-1')] });
    const state = makeGameState({ rivals: [buyer, seller] });
    expect(computePoachBid(buyer, [buyer, seller], state, 0)).toBeNull();
  });

  it('respects the shared budget check — cannot bid beyond reserve', () => {
    const buyer = wealthyBuyer({ treasury: 100 }); // below BASE_RESERVE + upkeep
    const seller = makeRival({ id: 'seller-1' as StableId, roster: [poachableWarrior('sw-1', 'seller-1')] });
    const state = makeGameState({ rivals: [buyer, seller] });
    expect(computePoachBid(buyer, [buyer, seller], state, 0)).toBeNull();
  });

  it('once per season — a stamped lastPoachSeason suppresses further bids', () => {
    const buyer = wealthyBuyer({ lastPoachSeason: 2 });
    const seller = makeRival({ id: 'seller-1' as StableId, roster: [poachableWarrior('sw-1', 'seller-1')] });
    const state = makeGameState({ rivals: [buyer, seller] });
    expect(computePoachBid(buyer, [buyer, seller], state, 2)).toBeNull();
    // ...but a new season re-arms the stable
    expect(computePoachBid(buyer, [buyer, seller], state, 3)).not.toBeNull();
  });

  it('skips warriors below the seller cut threshold — no cherry-picking healthy assets', () => {
    const buyer = wealthyBuyer();
    const seller = makeRival({
      id: 'seller-1' as StableId,
      roster: [makeWarrior({ id: 'sw-1' as WarriorId, stableId: 'seller-1' as StableId, traits: ['steady_hand'], career: { wins: 8, losses: 1, kills: 0 } })],
    });
    const state = makeGameState({ rivals: [buyer, seller] });
    expect(computePoachBid(buyer, [buyer, seller], state, 0)).toBeNull();
  });

  it('flags the bid player-bound when the best target is a player warrior', () => {
    const buyer = wealthyBuyer();
    const playerWarrior = poachableWarrior('pw-1', 'player-stable');
    const state = makeGameState({ roster: [playerWarrior], rivals: [buyer] });
    const bid = computePoachBid(buyer, [buyer], state, 0);
    expect(bid).not.toBeNull();
    expect(bid!.playerBound).toBe(true);
    expect(bid!.sellerStableId).toBe(state.player.id);
    expect(bid!.warriorId).toBe('pw-1' as WarriorId);
  });

  it('AI_POACHING=false disables bidding (staged rollout flag)', () => {
    (globalThis as { AI_POACHING?: boolean }).AI_POACHING = false;
    expect(isPoachingEnabled()).toBe(false);
    const buyer = wealthyBuyer();
    const seller = makeRival({ id: 'seller-1' as StableId, roster: [poachableWarrior('sw-1', 'seller-1')] });
    const state = makeGameState({ rivals: [buyer, seller] });
    expect(computePoachBid(buyer, [buyer, seller], state, 0)).toBeNull();
  });
});

describe('processPoachMarket (G.2)', () => {
  afterEach(() => {
    (globalThis as { AI_POACHING?: boolean }).AI_POACHING = undefined;
  });

  it('AI-AI bids transfer the warrior and settle treasuries', () => {
    const buyer = wealthyBuyer();
    const seller = makeRival({
      id: 'seller-1' as StableId,
      treasury: 500,
      roster: [poachableWarrior('sw-1', 'seller-1'), makeWarrior({ id: 'sw-2' as WarriorId, stableId: 'seller-1' as StableId })],
    });
    const state = makeGameState({ rivals: [buyer, seller], absoluteWeek: 5 });

    const { updatedRivals, gazetteItems } = processPoachMarket(state, [buyer, seller]);
    const newBuyer = updatedRivals.find((r) => r.id === 'buyer-1')!;
    const newSeller = updatedRivals.find((r) => r.id === 'seller-1')!;

    expect(newBuyer.roster.some((w) => w.id === 'sw-1')).toBe(true);
    expect(newSeller.roster.some((w) => w.id === 'sw-1')).toBe(false);
    expect(newBuyer.treasury).toBeLessThan(buyer.treasury);
    expect(newSeller.treasury).toBeGreaterThan(seller.treasury);
    expect(newBuyer.lastPoachSeason).toBe(seasonIndexFor(5));
    expect(gazetteItems.some((g) => g.includes('sw-1') || g.includes('POACH'))).toBe(true);
  });

  it('player-bound bids surface a decision item and NEVER auto-transfer', () => {
    const buyer = wealthyBuyer();
    const playerWarrior = poachableWarrior('pw-1', 'player-stable');
    const state = makeGameState({ roster: [playerWarrior], rivals: [buyer], absoluteWeek: 5 });

    const { updatedRivals, gazetteItems } = processPoachMarket(state, [buyer]);
    const newBuyer = updatedRivals[0]!;

    expect(newBuyer.roster.some((w) => w.id === 'pw-1')).toBe(false);
    expect(state.roster.some((w) => w.id === 'pw-1')).toBe(true);
    expect(gazetteItems.some((g) => g.toLowerCase().includes('poach') || g.includes('pw-1'))).toBe(true);
    expect(newBuyer.lastPoachSeason).toBe(seasonIndexFor(5));
  });

  it('does nothing when AI_POACHING is disabled', () => {
    (globalThis as { AI_POACHING?: boolean }).AI_POACHING = false;
    const buyer = wealthyBuyer();
    const seller = makeRival({ id: 'seller-1' as StableId, roster: [poachableWarrior('sw-1', 'seller-1')] });
    const state = makeGameState({ rivals: [buyer, seller], absoluteWeek: 5 });
    const { updatedRivals, gazetteItems } = processPoachMarket(state, [buyer, seller]);
    expect(updatedRivals).toEqual([buyer, seller]);
    expect(gazetteItems).toHaveLength(0);
  });
});

describe('seasonIndexFor', () => {
  it('maps weeks onto 13-week season buckets', () => {
    expect(seasonIndexFor(1)).toBe(0);
    expect(seasonIndexFor(13)).toBe(0);
    expect(seasonIndexFor(14)).toBe(1);
    expect(seasonIndexFor(WEEKS_PER_SEASON * 3)).toBe(2);
  });
});
