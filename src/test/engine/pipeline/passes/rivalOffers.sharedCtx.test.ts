/**
 * SharedBidCtx equivalence — pins generateBoutBids output on a populated
 * fixture so the shared once-per-tick context (locked champions, signed-bout
 * sets, style-bucketed opponent pools) provably produces the same bids as
 * today's per-rival rebuild. Exclusion semantics are pinned independently
 * so a wrong Set can't silently change who gets booked.
 */
import { describe, it, expect } from 'vitest';
import { generateBoutBids } from '@/engine/ai/workers/competitionWorker/boutBidding';
import { makeGameState } from '@/test/_fixtures/factories';
import { makeBidWarrior, makeBidRival, bidContext } from '@/test/_fixtures/bidRoster';
import { makeArenaTitle } from '@/test/_fixtures/arenaTitle';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId, BoutOfferId } from '@/types/shared.types';
import type { RivalStableData, GameState } from '@/types/state.types';

const w = (name: string, style = FightingStyle.StrikingAttack, fame = 100) =>
  makeBidWarrior(name, style, { fame });

/** Two proposer stables + one opponent pool + a signed upcoming bout. */
function fixture() {
  const proposer = makeBidRival({
    id: 'rA' as never,
    roster: [w('proposer1'), w('proposer2')],
  });
  const other = makeBidRival({
    id: 'rB' as never,
    owner: { id: 'owner-b' } as never,
    roster: [w('foe1'), w('foe2', FightingStyle.BashingAttack), w('lockedChamp')],
  });
  const third = makeBidRival({
    id: 'rC' as never,
    owner: { id: 'owner-c' } as never,
    roster: [w('bookedFoe'), w('freeFoe')],
  });
  const rivals = [proposer, other, third];
  const state = makeGameState({
    absoluteWeek: 10,
    week: 10,
    rivals,
    // w_bookedFoe is signed for an upcoming bout — must not re-enter the pool.
    boutOffers: {
      o1: {
        id: 'o1' as BoutOfferId,
        warriorIds: ['w_bookedFoe' as WarriorId, 'w_x' as WarriorId],
        status: 'Signed',
        boutWeek: 12,
        createdAbsoluteWeek: 10,
        expirationWeek: 12,
      },
    } as never,
    // w_lockedChamp holds a non-dormant crown — booking-locked everywhere.
    arenaChampions: {
      arena_1: makeArenaTitle('w_lockedChamp'),
    } as never,
  });
  return { proposer, other, third, rivals, state };
}

function bidsFor(rival: RivalStableData, state: GameState, rivals: RivalStableData[]) {
  return generateBoutBids({
    rival,
    ...bidContext(state.absoluteWeek + 1),
    rivals,
    state,
  }).bids;
}

describe('generateBoutBids — characterization (pins for SharedBidCtx)', () => {
  it('is deterministic — identical inputs produce identical bids', () => {
    const { proposer, rivals, state } = fixture();
    expect(bidsFor(proposer, state, rivals)).toEqual(bidsFor(proposer, state, rivals));
  });

  it('emits one bid per bookable warrior on the proposer roster', () => {
    const { proposer, rivals, state } = fixture();
    const bids = bidsFor(proposer, state, rivals);
    const ids = bids.map((b) => b.proposingWarriorId);
    expect(ids).toEqual(['w_proposer1', 'w_proposer2']);
  });

  it('a warrior signed for an upcoming bout does not propose', () => {
    const { third, rivals, state } = fixture();
    const bids = bidsFor(third, state, rivals);
    expect(bids.map((b) => b.proposingWarriorId)).toEqual(['w_freeFoe']);
  });

  it('a booking-locked (non-dormant) champion does not propose', () => {
    const { other, rivals, state } = fixture();
    const bids = bidsFor(other, state, rivals);
    expect(bids.map((b) => b.proposingWarriorId)).not.toContain('w_lockedChamp');
    expect(bids.map((b) => b.proposingWarriorId)).toEqual(['w_foe1', 'w_foe2']);
  });

  it('VENDETTA bids carry the vendetta targetStableId', () => {
    const { rivals, state } = fixture();
    const vendetta = makeBidRival({
      id: 'rV' as never,
      roster: [w('avenger')],
      strategy: { intent: 'VENDETTA', planWeeksRemaining: 4, targetStableId: 'rB' as never },
    });
    const bids = bidsFor(vendetta, state, [...rivals, vendetta]);
    expect(bids).toHaveLength(1);
    expect(bids[0]!.targetStableId).toBe('rB');
  });

  it('non-vendetta bids carry no targetStableId (open pool)', () => {
    const { proposer, rivals, state } = fixture();
    for (const bid of bidsFor(proposer, state, rivals)) {
      expect(bid.targetStableId).toBeUndefined();
    }
  });

  it('rival without `state` still bids (test-lite path)', () => {
    const { proposer, other } = fixture();
    const { bids } = generateBoutBids({
      rival: proposer,
      ...bidContext(11),
      rivals: [other],
    });
    expect(bids.length).toBeGreaterThan(0);
  });
});
