import { describe, it, expect } from 'vitest';
import { buildMatchCard } from '@/components/run-round/buildMatchCard';
import { makeGameState, makeWarrior, makeRival, makeOwner, makeBoutOffer } from '@/test/_fixtures/factories';
import type { BoutOfferId, StableId, WarriorId } from '@/types/shared.types';

/**
 * Characterization pins for the rivals.find → indexBy refactor.
 * The map MUST key on rival.owner.id — pairings carry the stable id, which
 * equals owner.id in production but is looked up against owner.id here.
 */
describe('buildMatchCard', () => {
  const wA = makeWarrior({ id: 'wa1' as WarriorId });
  const wD = makeWarrior({ id: 'wd1' as WarriorId });

  function makeSignedState(rivalOverrides?: Parameters<typeof makeRival>[0]) {
    const rival = makeRival({
      id: 'rival-1' as StableId,
      owner: makeOwner({ id: 'rival-1' as StableId, stableName: 'Dark Legion' }),
      roster: [wD],
      ...rivalOverrides,
    });
    const offer = makeBoutOffer({
      id: 'o1' as BoutOfferId,
      status: 'Signed',
      warriorIds: [wA.id as WarriorId, wD.id as WarriorId],
      boutWeek: 3,
      hype: 200, // > 150 → rivalry bout
    });
    return {
      rival,
      state: makeGameState({
        absoluteWeek: 3,
        week: 3,
        roster: [wA],
        rivals: [rival],
        boutOffers: { o1: offer },
      }),
    };
  }

  it('resolves the rival stable object for each pairing', () => {
    const { rival, state } = makeSignedState();
    const cards = buildMatchCard(state);
    expect(cards).toHaveLength(1);
    const card = cards[0]!;
    expect(card.playerWarrior?.id).toBe('wa1');
    expect(card.rivalWarrior?.id).toBe('wd1');
    expect(card.rivalStable).toBe(rival);
    expect(card.isRivalryBout).toBe(true);
  });

  it('falls back to a stub when no rival owner matches the pairing stable id', () => {
    // owner.id differs from rival.id — buildMatchCard matches on owner.id,
    // so the pairing's stable id finds no owner and must stub.
    const { state } = makeSignedState({
      owner: makeOwner({ id: 'different-owner' as StableId, stableName: 'Dark Legion' }),
    });
    const cards = buildMatchCard(state);
    expect(cards).toHaveLength(1);
    const stub = cards[0]!.rivalStable;
    expect(stub.owner.id).toBe('rival-1');
    expect(stub.owner.stableName).toBe('Dark Legion');
  });

  it('marks non-rivalry bouts when hype is at or below the threshold', () => {
    const { rival } = makeSignedState();
    const lowHype = makeBoutOffer({
      id: 'o2' as BoutOfferId,
      status: 'Signed',
      warriorIds: [wA.id as WarriorId, wD.id as WarriorId],
      boutWeek: 3,
      hype: 100,
    });
    const s2 = makeGameState({
      absoluteWeek: 3,
      week: 3,
      roster: [wA],
      rivals: [rival],
      boutOffers: { o2: lowHype },
    });
    expect(buildMatchCard(s2)[0]!.isRivalryBout).toBe(false);
  });
});
