import { describe, it, expect, beforeEach } from 'vitest';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import type { GameState, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';

const offerId = 'offer1' as BoutOfferId;
const w1 = 'w1' as WarriorId;
const w2 = 'w2' as WarriorId;
const w3 = 'w3' as WarriorId;

function makeOffer(
  warriorIds: WarriorId[],
  responses: Record<string, string> = {}
): BoutOffer {
  return {
    id: offerId,
    promoterId: 'p1' as any,
    warriorIds,
    boutWeek: 10,
    expirationWeek: 11,
    purse: 100,
    hype: 10,
    status: 'Proposed',
    responses: Object.fromEntries(
      warriorIds.map((w) => [w, responses[w] ?? 'Pending'])
    ) as any,
  };
}

describe('contractMutations', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
  });

  describe('respondToBoutOffer', () => {
    it('returns empty impact when offer does not exist', () => {
      const impact = respondToBoutOffer(state, 'nonexistent' as BoutOfferId, w1, 'Accepted');
      expect(impact).toEqual({});
    });

    it('updates response correctly for single warrior', () => {
      (state.boutOffers as any)[offerId] = makeOffer([w1, w2]);

      const impact = respondToBoutOffer(state, offerId, w1, 'Accepted');
      expect(impact.boutOffers![offerId]!.responses).toEqual({
        w1: 'Accepted',
        w2: 'Pending',
      });
      expect(impact.boutOffers![offerId]!.status).toBe('Proposed');
    });

    it('updates status to Signed when all warriors accept', () => {
      (state.boutOffers as any)[offerId] = makeOffer([w1, w2], { w1: 'Accepted' });

      const impact = respondToBoutOffer(state, offerId, w2, 'Accepted');
      expect(impact.boutOffers![offerId]!.responses).toEqual({
        w1: 'Accepted',
        w2: 'Accepted',
      });
      expect(impact.boutOffers![offerId]!.status).toBe('Signed');
    });

    it('updates status to Rejected when any warrior declines (all responded)', () => {
      (state.boutOffers as any)[offerId] = makeOffer([w1, w2], { w1: 'Accepted' });

      const impact = respondToBoutOffer(state, offerId, w2, 'Declined');
      expect(impact.boutOffers![offerId]!.responses).toEqual({
        w1: 'Accepted',
        w2: 'Declined',
      });
      expect(impact.boutOffers![offerId]!.status).toBe('Rejected');
    });

    it('keeps status Proposed when 2 of 3 warriors accept (partial response)', () => {
      (state.boutOffers as any)[offerId] = makeOffer([w1, w2, w3]);

      let impact = respondToBoutOffer(state, offerId, w1, 'Accepted');
      if (impact.boutOffers) state.boutOffers = impact.boutOffers as any;

      impact = respondToBoutOffer(state, offerId, w2, 'Accepted');
      expect(impact.boutOffers![offerId]!.status).toBe('Proposed');
      expect(impact.boutOffers![offerId]!.responses).toEqual({
        w1: 'Accepted',
        w2: 'Accepted',
        w3: 'Pending',
      });
    });

    it('updates status to Signed when all 3 warriors accept', () => {
      (state.boutOffers as any)[offerId] = makeOffer([w1, w2, w3], {
        w1: 'Accepted',
        w2: 'Accepted',
      });

      const impact = respondToBoutOffer(state, offerId, w3, 'Accepted');
      expect(impact.boutOffers![offerId]!.status).toBe('Signed');
    });

    it('updates status to Rejected when 1 of 3 declines (all responded)', () => {
      (state.boutOffers as any)[offerId] = makeOffer([w1, w2, w3], {
        w1: 'Accepted',
        w2: 'Accepted',
      });

      const impact = respondToBoutOffer(state, offerId, w3, 'Declined');
      expect(impact.boutOffers![offerId]!.status).toBe('Rejected');
    });

    it('overwrites previous response when warrior responds again', () => {
      (state.boutOffers as any)[offerId] = makeOffer([w1, w2], { w1: 'Declined' });

      const impact = respondToBoutOffer(state, offerId, w1, 'Accepted');
      expect(impact.boutOffers![offerId]!.responses).toEqual({
        w1: 'Accepted',
        w2: 'Pending',
      });
      expect(impact.boutOffers![offerId]!.status).toBe('Proposed');
    });

    it('records response even for warriorId not in warriorIds', () => {
      (state.boutOffers as any)[offerId] = makeOffer([w1, w2]);

      const impact = respondToBoutOffer(state, offerId, w3, 'Accepted');
      expect(impact.boutOffers![offerId]!.responses).toEqual({
        w1: 'Pending',
        w2: 'Pending',
        w3: 'Accepted',
      });
      expect(impact.boutOffers![offerId]!.status).toBe('Proposed');
    });

    it('returns boutOffers as a complete Record, not just the modified entry', () => {
      (state.boutOffers as any)['other'] = makeOffer([w1, w2]);
      (state.boutOffers as any)[offerId] = makeOffer([w1, w2]);

      const impact = respondToBoutOffer(state, offerId, w1, 'Accepted');
      expect(impact.boutOffers!['other' as BoutOfferId]).toBeDefined();
      expect(impact.boutOffers![offerId]).toBeDefined();
    });

    it('does not mutate original state.boutOffers', () => {
      (state.boutOffers as any)[offerId] = makeOffer([w1, w2]);
      const originalResponses = { ...state.boutOffers[offerId]!.responses };

      respondToBoutOffer(state, offerId, w1, 'Accepted');

      expect(state.boutOffers[offerId]!.responses).toEqual(originalResponses);
    });
  });
});
