/**
 * D.0 — Player-directed bout bids (G4).
 * Vendetta stables must be able to bid on the player's warriors; player
 * avoids/challenges steer contact; player-bound offers are capped
 * (≤1 per rival, ≤3 globally); isBookable is honored on both sides.
 */
import { describe, it, expect } from 'vitest';
import {
  generateBoutBids,
  convertBidsToOffers,
} from '@/engine/ai/workers/competitionWorker/boutBidding';
import {
  makeGameState,
  makeRival,
  makeWarrior,
} from '@/test/_fixtures/factories';
import { SeededRNGService } from '@/utils/random';
import type { StableId } from '@/types/shared.types';

function vendettaRivalTargeting(targetId: StableId) {
  return makeRival({
    roster: [makeWarrior({ fame: 80 }), makeWarrior({ fame: 90 })],
    strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: targetId },
  });
}

function playerRoster() {
  return [
    makeWarrior({ fame: 60 }),
    makeWarrior({ fame: 100 }),
    makeWarrior({ fame: 140 }),
  ];
}

describe('player-directed bids', () => {
  it('VENDETTA target=player emits a bid on the player stable', () => {
    const state = makeGameState({ roster: playerRoster() });
    const rival = vendettaRivalTargeting(state.player.id);
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [rival], state);
    expect(bids.length).toBeGreaterThan(0);
    expect(bids.every((b) => b.targetStableId === state.player.id)).toBe(true);
  });

  it('player-bound bids convert into offers pairing rival + player warriors', () => {
    const state = makeGameState({ roster: playerRoster() });
    const rival = vendettaRivalTargeting(state.player.id);
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [rival], state);
    const offers = convertBidsToOffers(
      bids.map((bid) => ({ bid, rivalId: rival.id as string })),
      [rival],
      state,
      new SeededRNGService(1),
      new Set()
    );
    expect(offers.length).toBeGreaterThan(0);
    const offer = offers[0]!;
    expect(offer.proposerStableId).toBe(rival.id);
    const playerWarriorIds = new Set(state.roster.map((w) => w.id as string));
    expect(
      offer.warriorIds.some((id) => playerWarriorIds.has(id as string))
    ).toBe(true);
  });

  it('playerAvoids hard-skips the marked rival warrior for player-bound bids', () => {
    const stateWithAvoids = makeGameState({ roster: playerRoster() });
    const rival = vendettaRivalTargeting(stateWithAvoids.player.id);
    // Player avoids BOTH rival warriors → no player-bound bid possible
    stateWithAvoids.playerAvoids = rival.roster.map((w) => w.id);
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [rival], stateWithAvoids);
    expect(bids.filter((b) => b.targetStableId === stateWithAvoids.player.id)).toHaveLength(0);
  });

  it('playerChallenges marked rival warrior produces a player-targeted bid without VENDETTA', () => {
    const marked = makeWarrior({ fame: 100 });
    const rival = makeRival({
      roster: [marked],
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    });
    const state = makeGameState({ playerChallenges: [marked.id] });
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [rival], state);
    const playerBid = bids.find((b) => b.targetStableId === state.player.id);
    expect(playerBid).toBeDefined();
    expect(playerBid!.proposingWarriorId).toBe(marked.id);
  });

  it('caps player-bound offers at 1 per rival and 3 globally', () => {
    const state = makeGameState({ roster: playerRoster() });
    const rivals = Array.from({ length: 5 }, () => vendettaRivalTargeting(state.player.id));
    const allBids: { bid: ReturnType<typeof generateBoutBids>['bids'][number]; rivalId: string }[] =
      [];
    for (const rival of rivals) {
      const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', rivals, state);
      for (const bid of bids) allBids.push({ bid, rivalId: rival.id as string });
    }
    const offers = convertBidsToOffers(
      allBids,
      rivals,
      state,
      new SeededRNGService(7),
      new Set()
    );
    const playerIds = new Set(state.roster.map((w) => w.id as string));
    const playerBound = offers.filter((o) =>
      o.warriorIds.some((id) => playerIds.has(id as string))
    );
    expect(playerBound.length).toBeLessThanOrEqual(3);
    const byProposer = new Map<string, number>();
    for (const o of playerBound) {
      const key = o.proposerStableId as string;
      byProposer.set(key, (byProposer.get(key) ?? 0) + 1);
    }
    for (const count of byProposer.values()) expect(count).toBeLessThanOrEqual(1);
  });

  it('isBookable honored: warriors in trainingAssignments are never offered', () => {
    const roster = playerRoster();
    const playerTarget = roster[0]!;
    const rival = vendettaRivalTargeting('placeholder' as StableId);
    const stateWithTraining = makeGameState({
      roster,
      rivals: [rival],
      trainingAssignments: [
        { warriorId: playerTarget.id, type: 'attribute', attribute: 'ST' },
      ],
    });
    rival.strategy!.targetStableId = stateWithTraining.player.id;
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [rival], stateWithTraining);
    const offers = convertBidsToOffers(
      bids.map((bid) => ({ bid, rivalId: rival.id as string })),
      [rival],
      stateWithTraining,
      new SeededRNGService(3),
      new Set()
    );
    for (const o of offers) {
      expect(o.warriorIds).not.toContain(playerTarget.id);
    }
  });

  it('isBookable honored: rival proposer with a training assignment does not bid', () => {
    const resting = makeWarrior({ fame: 90 });
    const available = makeWarrior({ fame: 80 });
    const rival = makeRival({
      roster: [resting, available],
      trainingAssignments: [{ warriorId: resting.id, type: 'recovery' }],
      strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    });
    const state = makeGameState({ rivals: [rival] });
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [rival], state);
    expect(bids.every((b) => b.proposingWarriorId !== resting.id)).toBe(true);
    expect(bids.some((b) => b.proposingWarriorId === available.id)).toBe(true);
  });
});
