/**
 * Stage F — venue counters (single round).
 * A rival counters the VENUE of a Proposed offer when the booking puts their
 * warrior on a losing stage — the counterer nominates a better arena, the
 * offer is tagged COUNTERED_VENUE, and the negotiation closes: no chained
 * venue counters and no purse bump.
 */
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateBoutOffer,
  processAllRivalsBoutOffers,
} from '@/engine/ai/workers/competitionWorker';
import {
  counterBoutVenue,
  COUNTERED_VENUE_CONDITION,
} from '@/engine/bout/mutations/contractMutations';
import {
  makeWarrior,
  makeRival,
  makeGameState,
  makeBoutOffer,
  resetFixtureIds,
} from '@/test/_fixtures/factories';

beforeEach(() => resetFixtureIds());

function traveler(opts: { arenaId: string; wins: number; losses: number }[]) {
  const byArena: Record<string, { wins: number; losses: number; kills: number }> = {};
  for (const o of opts) byArena[o.arenaId] = { wins: o.wins, losses: o.losses, kills: 0 };
  return makeWarrior({ fame: 300, career: { wins: 10, losses: 8, kills: 0, byArena } });
}

describe('venue counter', () => {
  it("counters toward the warrior's best arena when the offered venue is a losing one", () => {
    const warrior = traveler([
      { arenaId: 'the_gallows_tree', wins: 1, losses: 5 },
      { arenaId: 'standard_arena', wins: 6, losses: 1 },
    ]);
    const rival = makeRival({ roster: [warrior], treasury: 5000 });
    const opponent = makeWarrior({ fame: 200 });
    const offer = makeBoutOffer({
      warriorIds: [warrior.id, opponent.id],
      arenaId: 'the_gallows_tree',
      purse: 400,
      hype: 90,
    });
    const state = makeGameState({ rivals: [rival] });
    expect(evaluateBoutOffer({ offer: offer, rival: rival, warrior: warrior, currentWeek: 5, weather: 'Clear', opponent: opponent, state: state })).toBe(
      'CounteredVenue'
    );
  });

  it('accepts a losing-venue booking when no better arena exists', () => {
    const warrior = traveler([{ arenaId: 'the_gallows_tree', wins: 1, losses: 5 }]);
    const rival = makeRival({ roster: [warrior], treasury: 5000 });
    const opponent = makeWarrior({ fame: 200 });
    const offer = makeBoutOffer({
      warriorIds: [warrior.id, opponent.id],
      arenaId: 'the_gallows_tree',
      purse: 400,
      hype: 90,
    });
    const state = makeGameState({ rivals: [rival] });
    expect(evaluateBoutOffer({ offer: offer, rival: rival, warrior: warrior, currentWeek: 5, weather: 'Clear', opponent: opponent, state: state })).toBe('Accepted');
  });

  it('counterBoutVenue swaps the arena, tags the offer, and re-pends the other side', () => {
    const a = makeWarrior();
    const b = makeWarrior();
    const offer = makeBoutOffer({
      warriorIds: [a.id, b.id],
      arenaId: 'the_gallows_tree',
      responses: { [a.id]: 'Accepted', [b.id]: 'Pending' },
    });
    const state = makeGameState({ boutOffers: { [offer.id]: offer } });
    const impact = counterBoutVenue(state, offer.id, b.id, 'standard_arena');
    const updated = impact.boutOffers![offer.id]!;
    expect(updated.arenaId).toBe('standard_arena');
    expect(updated.responses[b.id]).toBe('Countered');
    expect(updated.responses[a.id]).toBe('Pending');
    expect(updated.conditions).toContain(COUNTERED_VENUE_CONDITION);
    expect(updated.purse).toBe(offer.purse); // venue counters never touch the purse
  });

  it('end-to-end: AI counters a bad venue and the proposer signs at the new arena', () => {
    const proposerW = makeWarrior({ fame: 50 });
    const countererW = traveler([
      { arenaId: 'the_gallows_tree', wins: 0, losses: 4 },
      { arenaId: 'brass_ring', wins: 5, losses: 0 },
    ]);
    const proposer = makeRival({ roster: [proposerW], treasury: 5000 });
    const counterer = makeRival({ roster: [countererW], treasury: 5000 });
    const offer = makeBoutOffer({
      warriorIds: [proposerW.id, countererW.id],
      arenaId: 'the_gallows_tree',
      purse: 300,
      hype: 90,
      proposerStableId: proposer.id,
      responses: { [proposerW.id]: 'Accepted', [countererW.id]: 'Pending' },
    });
    const state = makeGameState({
      rivals: [proposer, counterer],
      boutOffers: { [offer.id]: offer },
    });
    const impact = processAllRivalsBoutOffers(state, [proposer, counterer]);
    const final = impact.boutOffers![offer.id]!;
    expect(final.arenaId).toBe('brass_ring');
    expect(final.conditions).toContain(COUNTERED_VENUE_CONDITION);
    expect(final.status).toBe('Signed');
  });

  it('a CROWN_BID contender counters a non-ladder offer toward their target arena', () => {
    // Good record at the offered venue — the bad-venue rule stays quiet; the
    // ladder pull is the only counter motive. 'standard_arena' is a real
    // championship arena where the warrior is ranked (≥3 venue bouts).
    const warrior = traveler([
      { arenaId: 'the_gallows_tree', wins: 4, losses: 0 },
      { arenaId: 'standard_arena', wins: 3, losses: 1 },
    ]);
    warrior.campaignFocus = 'CROWN_BID';
    const rival = makeRival({ roster: [warrior], treasury: 5000 });
    rival.strategy = {
      intent: 'CROWN_CAMPAIGN',
      planWeeksRemaining: 6,
      targetArenaId: 'standard_arena',
      reason: 'crown campaign',
    };
    const opponent = makeWarrior({ fame: 200 });
    const offer = makeBoutOffer({
      warriorIds: [warrior.id, opponent.id],
      arenaId: 'the_gallows_tree',
      purse: 400,
      hype: 90,
    });
    const state = makeGameState({ rivals: [rival] });
    expect(evaluateBoutOffer({ offer: offer, rival: rival, warrior: warrior, currentWeek: 5, weather: 'Clear', opponent: opponent, state: state })).toBe(
      'CounteredVenue'
    );
  });

  it('single round: an already venue-countered offer cannot be countered again', () => {
    const warrior = traveler([
      { arenaId: 'the_gallows_tree', wins: 1, losses: 5 },
      { arenaId: 'standard_arena', wins: 6, losses: 1 },
    ]);
    const rival = makeRival({ roster: [warrior], treasury: 5000 });
    const opponent = makeWarrior({ fame: 200 });
    const offer = makeBoutOffer({
      warriorIds: [warrior.id, opponent.id],
      arenaId: 'the_gallows_tree',
      purse: 400,
      hype: 90,
      conditions: [COUNTERED_VENUE_CONDITION],
    });
    const state = makeGameState({ rivals: [rival] });
    const verdict = evaluateBoutOffer({ offer: offer, rival: rival, warrior: warrior, currentWeek: 5, weather: 'Clear', opponent: opponent, state: state });
    expect(verdict).not.toBe('CounteredVenue');
    expect(verdict).not.toBe('Countered');
  });

  it('title bouts are never venue-countered — the arena is the crown', () => {
    const warrior = traveler([
      { arenaId: 'the_gallows_tree', wins: 1, losses: 5 },
      { arenaId: 'standard_arena', wins: 6, losses: 1 },
    ]);
    const rival = makeRival({ roster: [warrior], treasury: 5000 });
    const opponent = makeWarrior({ fame: 200 });
    const offer = makeBoutOffer({
      warriorIds: [warrior.id, opponent.id],
      arenaId: 'the_gallows_tree',
      titleArenaId: 'the_gallows_tree',
      purse: 400,
      hype: 90,
    });
    const state = makeGameState({ rivals: [rival] });
    expect(evaluateBoutOffer({ offer: offer, rival: rival, warrior: warrior, currentWeek: 5, weather: 'Clear', opponent: opponent, state: state })).toBe('Accepted');
  });
});
