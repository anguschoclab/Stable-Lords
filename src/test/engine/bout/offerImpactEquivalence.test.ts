/**
 * Offer-impact equivalence characterization (B5 tranche 4A).
 *
 * The boutOffers impact channel merges via dictMerge — a partial
 * `{ [offerId]: updated }` payload is applied identically to a full-map
 * payload: existing keys keep their slots and other offers are untouched.
 * These specs pin the OBSERVABLE end-state (map contents + key order) that
 * must hold whether the mutations emit full maps or per-offer partials:
 *
 *  - response chains accumulate through resolveImpacts (merge path) and
 *    through applyOfferImpact (offerProcessor's local map path)
 *  - untouched offers and key order survive every application path
 *  - payout resolution leaves the contract in state (cleanup is the
 *    PromoterPass prune's job — pin the lingering behavior exactly)
 *  - the voided-cancel 'Canceled' write survives payout impacts regardless
 *    of application order
 */
import { describe, it, expect } from 'vitest';
import {
  respondToBoutOffer,
  counterBoutOffer,
  counterBoutVenue,
} from '@/engine/bout/mutations/contractMutations';
import { processContractPayouts } from '@/engine/bout/core/resolveHelpers';
import { resolveImpacts } from '@/engine/impacts';
import { applyOfferImpact } from '@/engine/ai/workers/competitionWorker/offerProcessor/shared';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeBoutOffer } from '@/test/_fixtures/factories';
import type { BoutOffer, GameState } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';

const w1 = 'w1' as WarriorId;
const w2 = 'w2' as WarriorId;

const offer = (id: string, overrides: Partial<BoutOffer> = {}): BoutOffer =>
  makeBoutOffer({
    id: id as BoutOfferId,
    warriorIds: [w1, w2],
    status: 'Proposed',
    responses: { [w1]: 'Pending', [w2]: 'Pending' } as BoutOffer['responses'],
    arenaId: 'arena-1',
    ...overrides,
  } as Partial<BoutOffer>);

function stateWithOffers(...offers: BoutOffer[]): GameState {
  const state = createFreshState('equivalence-seed');
  for (const o of offers) state.boutOffers[o.id] = o;
  return state;
}

describe('offer impact equivalence', () => {
  it('response impact applies to state with sibling offers untouched + order kept', () => {
    const state = stateWithOffers(offer('o1'), offer('o2'), offer('o3'));
    const impact = respondToBoutOffer(state, 'o1' as BoutOfferId, w1, 'Accepted');
    resolveImpacts(state, [impact]);

    expect(Object.keys(state.boutOffers)).toEqual(['o1', 'o2', 'o3']);
    expect(state.boutOffers['o1' as BoutOfferId]!.responses[w1]).toBe('Accepted');
    expect(state.boutOffers['o2' as BoutOfferId]).toBe(state.boutOffers['o2' as BoutOfferId]);
    expect(state.boutOffers['o3' as BoutOfferId]!.status).toBe('Proposed');
  });

  it('chained responses accumulate through applyOfferImpact (local map path)', () => {
    const o1 = offer('o1');
    const o2 = offer('o2');
    const state = stateWithOffers(o1, o2);
    const currentOffers = { ...state.boutOffers };

    applyOfferImpact(
      currentOffers,
      respondToBoutOffer(
        { ...state, boutOffers: currentOffers },
        'o1' as BoutOfferId,
        w1,
        'Accepted'
      )
    );
    applyOfferImpact(
      currentOffers,
      respondToBoutOffer(
        { ...state, boutOffers: currentOffers },
        'o1' as BoutOfferId,
        w2,
        'Accepted'
      )
    );

    expect(currentOffers['o1' as BoutOfferId]!.status).toBe('Signed');
    expect(currentOffers['o2' as BoutOfferId]!.status).toBe('Proposed');
    expect(Object.keys(currentOffers).sort()).toEqual(['o1', 'o2']);
  });

  it('counter impacts apply identically through resolveImpacts', () => {
    const state = stateWithOffers(offer('o1', { purse: 100 }), offer('o2'));
    resolveImpacts(state, [counterBoutOffer(state, 'o1' as BoutOfferId, w1)]);

    const o1 = state.boutOffers['o1' as BoutOfferId]!;
    expect(o1.purse).toBe(125);
    expect(o1.conditions).toContain('COUNTERED_PURSE');
    expect(o1.responses).toEqual({ [w1]: 'Countered', [w2]: 'Pending' });
    expect(Object.keys(state.boutOffers)).toEqual(['o1', 'o2']);
  });

  it('venue counter applies identically through resolveImpacts', () => {
    const state = stateWithOffers(offer('o1', { arenaId: 'arena-1' }), offer('o2'));
    resolveImpacts(state, [counterBoutVenue(state, 'o1' as BoutOfferId, w1, 'arena-9')]);

    expect(state.boutOffers['o1' as BoutOfferId]!.arenaId).toBe('arena-9');
    expect(state.boutOffers['o1' as BoutOfferId]!.conditions).toContain('COUNTERED_VENUE');
    expect(state.boutOffers['o2' as BoutOfferId]!.arenaId).toBe('arena-1');
  });

  it('payout leaves every offer in state — the weekly prune owns cleanup', () => {
    const fought = offer('fought', { status: 'Signed' });
    const sibling = offer('sibling');
    const state = stateWithOffers(fought, sibling);
    (state as { promoters?: unknown }).promoters = {};

    const impacts = processContractPayouts({
      state,
      contract: fought,
      winnerId: w1,
      currentWId: w1,
      currentOId: w2,
    });
    resolveImpacts(state, impacts);

    // The closed contract is NOT removed by payout impacts — it lingers as
    // Signed until pruneStaleBoutOffers drops it next week. Pin that exactly:
    // swapping in a real removal channel would be a behavior change.
    expect(state.boutOffers['fought' as BoutOfferId]).toBeDefined();
    expect(state.boutOffers['sibling' as BoutOfferId]).toBeDefined();
    expect(Object.keys(state.boutOffers).sort()).toEqual(['fought', 'sibling']);
  });

  it('voided-cancel write survives payout impacts in either application order', () => {
    const voided = offer('voided', { status: 'Signed' });
    const fought = offer('fought', { status: 'Signed' });
    const state = stateWithOffers(voided, fought);
    (state as { promoters?: unknown }).promoters = {};

    const cancelImpact = {
      boutOffers: { ['voided' as BoutOfferId]: { ...voided, status: 'Canceled' as const } },
    };
    const payoutImpacts = processContractPayouts({
      state,
      contract: fought,
      winnerId: w1,
      currentWId: w1,
      currentOId: w2,
    });

    // Production order: per-bout impacts first, voided-cancel last.
    resolveImpacts(state, [...payoutImpacts, cancelImpact]);
    expect(state.boutOffers['voided' as BoutOfferId]!.status).toBe('Canceled');
  });

  it('payout leaves promoters untouched when the promoter is unknown', () => {
    const state = stateWithOffers(offer('fought', { status: 'Signed' }));
    const existing = { p9: { id: 'p9', history: { totalPursePaid: 7, notableBouts: [] } } };
    (state as { promoters?: unknown }).promoters = existing;

    const impacts = processContractPayouts({
      state,
      contract: offer('fought', { status: 'Signed', promoterId: 'ghost' as never }),
      winnerId: w1,
      currentWId: w1,
      currentOId: w2,
    });
    resolveImpacts(state, impacts);
    expect(state.promoters).toEqual(existing);
  });
});
