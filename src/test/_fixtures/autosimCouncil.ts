import type { GameState, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import { makeAutosimWarrior } from '@/test/_setup/testHelpers';
import { makeBoutOffer, makeGameState } from '@/test/_fixtures/factories';

/** Offer scheduled for the upcoming week (absoluteWeek 1 → boutWeek 2). */
export const makeAutosimOffer = (id: string, warriorIds: string[], opts?: Partial<BoutOffer>): BoutOffer =>
  makeBoutOffer({
    id: id as BoutOfferId,
    promoterId: 'promoter-1' as any,
    warriorIds: warriorIds as WarriorId[],
    boutWeek: 2,
    expirationWeek: 3,
    purse: 50,
    hype: 50,
    status: 'Proposed',
    responses: Object.fromEntries(warriorIds.map((w) => [w, 'Pending'])) as any,
    conditions: [],
    ...opts,
  } as any);

export const makeSimmableState = (overrides?: Partial<GameState>): GameState =>
  makeGameState({
    treasury: 5000,
    roster: [makeAutosimWarrior('w1', 'Alice'), makeAutosimWarrior('w2', 'Bob')],
    ...overrides,
  });
