// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateBoutBids,
  convertBidsToOffers,
} from '@/engine/ai/workers/competitionWorker/boutBidding';
import {
  makeRival,
  makeWarrior,
  makeGameState,
  makeBoutOffer,
  makeAgentMemory,
  makeStrategy,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { WarriorId } from '@/types/shared.types';

beforeEach(() => resetFixtureIds());

const rng = {
  uuid: (p = 'id') => `${p}-t`,
  next: () => 0.5,
  pick: <T>(arr: T[]) => arr[0],
} as unknown as IRNGService;

function crownRival(warriorId = 'w1', arenaId = 'arena_a') {
  const contender = makeWarrior({ id: warriorId as WarriorId });
  return makeRival({
    roster: [contender],
    strategy: makeStrategy({
      intent: 'CROWN_CAMPAIGN',
      targetArenaId: arenaId,
    }),
    agentMemory: makeAgentMemory({
      crownAssessment: {
        arenaId,
        warriorId: warriorId as WarriorId,
        score: 4,
        reason: 'test',
      },
    }),
  });
}

describe('generateBoutBids — CROWN_CAMPAIGN', () => {
  it('pins the campaign warrior\u2019s bid to the target arena', () => {
    const rival = crownRival();
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', []);
    const bid = bids.find((b) => b.proposingWarriorId === 'w1');
    expect(bid?.arenaId).toBe('arena_a');
  });

  it('converts a crown bid into an offer at the pinned arena', () => {
    const rival = crownRival();
    const opponent = makeWarrior({ id: 'opp' as WarriorId });
    const otherStable = makeRival({ id: 'r2' as never, roster: [opponent] });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      rivals: [rival, otherStable],
    });
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [otherStable], state);
    const offers = convertBidsToOffers(
      bids.map((bid) => ({ bid, rivalId: rival.id as string })),
      [rival, otherStable],
      state,
      rng,
      new Set()
    );
    const crownOffer = offers.find((o) => o.warriorIds.includes('w1' as WarriorId));
    expect(crownOffer?.arenaId).toBe('arena_a');
  });
});

describe('generateBoutBids — signed-offer exclusion', () => {
  it('does not bid warriors already signed for an upcoming bout', () => {
    const signed = makeWarrior({ id: 'w1' as WarriorId });
    const rival = makeRival({ roster: [signed] });
    const existing = makeBoutOffer({
      warriorIds: ['w1' as WarriorId, 'x' as WarriorId],
      status: 'Signed',
      boutWeek: 7,
      createdAbsoluteWeek: 5,
      responses: { w1: 'Accepted', x: 'Accepted' } as never,
    });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      rivals: [rival],
      boutOffers: { [existing.id]: existing },
    });
    const { bids } = generateBoutBids(rival, 5, 'Clear', 'Calm', [], state);
    expect(bids.find((b) => b.proposingWarriorId === 'w1')).toBeUndefined();
  });
});
