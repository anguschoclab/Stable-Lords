import { describe, it, expect, beforeEach } from 'vitest';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import type { GameState } from '@/types/state.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';

describe('contractMutations', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
  });

  describe('respondToBoutOffer', () => {
    it('returns empty impact when offer does not exist', () => {
      const impact = respondToBoutOffer(state, 'nonexistent', 'w1', 'Accepted');
      expect(impact).toEqual({});
    });

    it('updates response correctly for single warrior', () => {
      (state.boutOffers as any)['offer1'] = {
        id: 'offer1',
        promoterId: 'p1',
        warriorIds: ['w1', 'w2'],
        boutWeek: 10,
        expirationWeek: 11,
        purse: 100,
        hype: 10,
        status: 'Proposed',
        responses: { w1: 'Pending', w2: 'Pending' },
      };

      const impact = respondToBoutOffer(state, 'offer1' as import('@/types/shared.types').BoutOfferId, 'w1' as import('@/types/shared.types').WarriorId, 'Accepted');
      expect(impact.boutOffers!['offer1' as import('@/types/shared.types').BoutOfferId]!.responses).toEqual({
        w1: 'Accepted',
        w2: 'Pending',
      });
      expect(impact.boutOffers!['offer1' as import('@/types/shared.types').BoutOfferId]!.status).toBe('Proposed');
    });

    it('updates status to Signed when all warriors accept', () => {
      (state.boutOffers as any)['offer1'] = {
        id: 'offer1',
        promoterId: 'p1',
        warriorIds: ['w1', 'w2'],
        boutWeek: 10,
        expirationWeek: 11,
        purse: 100,
        hype: 10,
        status: 'Proposed',
        responses: { w1: 'Accepted', w2: 'Pending' },
      };

      const impact = respondToBoutOffer(state, 'offer1' as import('@/types/shared.types').BoutOfferId, 'w2' as import('@/types/shared.types').WarriorId, 'Accepted');
      expect(impact.boutOffers!['offer1' as import('@/types/shared.types').BoutOfferId]!.responses).toEqual({
        w1: 'Accepted',
        w2: 'Accepted',
      });
      expect(impact.boutOffers!['offer1' as import('@/types/shared.types').BoutOfferId]!.status).toBe('Signed');
    });

    it('updates status to Rejected when any warrior declines (all responded)', () => {
      (state.boutOffers as any)['offer1'] = {
        id: 'offer1',
        promoterId: 'p1',
        warriorIds: ['w1', 'w2'],
        boutWeek: 10,
        expirationWeek: 11,
        purse: 100,
        hype: 10,
        status: 'Proposed',
        responses: { w1: 'Accepted', w2: 'Pending' },
      };

      const impact = respondToBoutOffer(state, 'offer1' as import('@/types/shared.types').BoutOfferId, 'w2' as import('@/types/shared.types').WarriorId, 'Declined');
      expect(impact.boutOffers!['offer1' as import('@/types/shared.types').BoutOfferId]!.responses).toEqual({
        w1: 'Accepted',
        w2: 'Declined',
      });
      expect(impact.boutOffers!['offer1' as import('@/types/shared.types').BoutOfferId]!.status).toBe('Rejected');
    });
  });
});
