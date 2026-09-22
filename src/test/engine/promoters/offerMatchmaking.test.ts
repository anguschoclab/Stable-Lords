import { describe, it, expect } from 'vitest';
import {
  lowerBound,
  upperBound,
  isWeatherDisadvantaged,
  pruneStaleBoutOffers,
  collectUnavailableWarriorIds,
  findBestOpponent,
  createBoutOffer,
  type OpponentSearchContext,
  type OfferBuildContext,
} from '@/engine/promoters/offerMatchmaking';
import { makeGameState, makeWarrior, makeBoutOffer } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { Promoter, Warrior } from '@/types/state.types';
import type { BoutOfferId, PromoterId, WarriorId, TournamentId } from '@/types/shared.types';
import { getPairKey } from '@/utils/keyUtils';
import { calculateHype } from '@/engine/promoters/hypeCalculator';
import { FIGHT_PURSE } from '@/constants/economy';
import { TIER_MULTIPLIERS } from '@/engine/promoters/promoterConfig';

function makePromoter(over: Partial<Promoter> = {}): Promoter {
  return {
    id: 'p1' as PromoterId,
    name: 'Test Promoter',
    age: 45,
    personality: 'Corporate',
    tier: 'Local',
    capacity: 2,
    biases: [],
    history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
    ...over,
  };
}

function makeCtx(over: Partial<OpponentSearchContext> = {}): OpponentSearchContext {
  return {
    promoter: makePromoter(),
    matchedIds: new Set<string>(),
    recentFightPairs: new Set<string>(),
    playerWarriorIds: new Set<string>(),
    avoidSet: new Set<string>(),
    challengeSet: new Set<string>(),
    gapThreshold: 0.25,
    ...over,
  };
}

function w(id: string): Warrior {
  return makeWarrior({ id: id as WarriorId, name: `Warrior ${id}` });
}

describe('lowerBound / upperBound', () => {
  const scores = [10, 20, 30, 40, 50];

  it('lowerBound returns first index with arr[i] >= target', () => {
    expect(lowerBound(scores, 25)).toBe(2);
    expect(lowerBound(scores, 20)).toBe(1);
    expect(lowerBound(scores, 0)).toBe(0);
    expect(lowerBound(scores, 60)).toBe(5);
  });

  it('upperBound returns first index with arr[i] > target', () => {
    expect(upperBound(scores, 30)).toBe(3);
    expect(upperBound(scores, 35)).toBe(3);
    expect(upperBound(scores, 0)).toBe(0);
    expect(upperBound(scores, 100)).toBe(5);
  });
});

describe('isWeatherDisadvantaged', () => {
  it('penalizes LungingAttack in Rainy and Dense Fog', () => {
    const lunger = w('l1');
    lunger.style = FightingStyle.LungingAttack;
    expect(isWeatherDisadvantaged(lunger, 'Rainy')).toBe(true);
    expect(isWeatherDisadvantaged(lunger, 'Dense Fog')).toBe(true);
    expect(isWeatherDisadvantaged(lunger, 'Clear')).toBe(false);
  });

  it('penalizes everyone in Tornado and Acid Rain', () => {
    const striker = w('s1');
    striker.style = FightingStyle.StrikingAttack;
    expect(isWeatherDisadvantaged(striker, 'Tornado')).toBe(true);
    expect(isWeatherDisadvantaged(striker, 'Acid Rain')).toBe(true);
    expect(isWeatherDisadvantaged(striker, 'Clear')).toBe(false);
  });
});

describe('pruneStaleBoutOffers', () => {
  const state = makeGameState({ absoluteWeek: 10 });

  it('drops offers whose bout week has passed', () => {
    const offers = {
      past: makeBoutOffer({ id: 'past' as BoutOfferId, boutWeek: 5, expirationWeek: 4 }),
      future: makeBoutOffer({ id: 'future' as BoutOfferId, boutWeek: 12, expirationWeek: 11 }),
    };
    const result = pruneStaleBoutOffers({ ...state, boutOffers: offers });
    expect(Object.keys(result)).toEqual(['future']);
  });

  it('drops expired unsigned offers but keeps signed ones', () => {
    const offers = {
      expired: makeBoutOffer({
        id: 'expired' as BoutOfferId,
        boutWeek: 12,
        expirationWeek: 9,
        status: 'Proposed',
      }),
      signed: makeBoutOffer({
        id: 'signed' as BoutOfferId,
        boutWeek: 12,
        expirationWeek: 9,
        status: 'Signed',
      }),
    };
    const result = pruneStaleBoutOffers({ ...state, boutOffers: offers });
    expect(Object.keys(result)).toEqual(['signed']);
  });
});

describe('collectUnavailableWarriorIds', () => {
  const state = makeGameState({ absoluteWeek: 10 });
  const targetWeek = 12;

  it('marks warriors on Signed or Proposed offers for target week and the week after', () => {
    const offers = {
      signed: makeBoutOffer({
        id: 's' as BoutOfferId,
        warriorIds: ['a' as WarriorId, 'b' as WarriorId],
        boutWeek: 12,
        status: 'Signed',
      }),
      proposed: makeBoutOffer({
        id: 'p' as BoutOfferId,
        warriorIds: ['c' as WarriorId, 'd' as WarriorId],
        boutWeek: 13,
        status: 'Proposed',
      }),
      rejected: makeBoutOffer({
        id: 'r' as BoutOfferId,
        warriorIds: ['e' as WarriorId, 'f' as WarriorId],
        boutWeek: 12,
        status: 'Rejected',
      }),
      distant: makeBoutOffer({
        id: 'd' as BoutOfferId,
        warriorIds: ['g' as WarriorId, 'h' as WarriorId],
        boutWeek: 20,
        status: 'Signed',
      }),
    };
    const ids = collectUnavailableWarriorIds(state, offers, targetWeek);
    expect([...ids].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('adds tournament participants when isTournamentWeek, skipping completed ones', () => {
    const locked = w('tw1');
    const done = w('tw2');
    const tournamentState = makeGameState({
      absoluteWeek: 10,
      isTournamentWeek: true,
      tournaments: [
        {
          id: 't1' as TournamentId,
          name: 'T',
          tierId: 'Gold',
          season: 'Spring',
          week: 10,
          participants: [locked],
          bracket: [],
          completed: false,
        },
        {
          id: 't2' as TournamentId,
          name: 'T2',
          tierId: 'Gold',
          season: 'Spring',
          week: 10,
          participants: [done],
          bracket: [],
          completed: true,
        },
      ],
    });
    const ids = collectUnavailableWarriorIds(tournamentState, {}, targetWeek);
    expect(ids.has('tw1')).toBe(true);
    expect(ids.has('tw2')).toBe(false);
  });
});

describe('findBestOpponent', () => {
  it('returns null when no candidates are eligible', () => {
    const wa = w('wa');
    const result = findBestOpponent(wa, 100, [wa], [100], makeCtx());
    expect(result).toBeNull();
  });

  it('restricts candidates to the gap-threshold score window', () => {
    const wa = w('wa');
    const wBelow = w('w70'); // score 70 < 75 floor
    const wIn = w('w90'); // score 90 inside [75, 125]
    const wAbove = w('w130'); // score 130 > 125 ceiling
    const sorted = [wBelow, wIn, wa, wAbove];
    const scores = [70, 90, 100, 130];
    const result = findBestOpponent(wa, 100, sorted, scores, makeCtx());
    expect(result?.id).toBe('w90');
  });

  it('includes boundary scores exactly on the window edges', () => {
    const wa = w('wa');
    const wLo = w('w75');
    const wHi = w('w125');
    const sorted = [wLo, wa, wHi];
    const scores = [75, 100, 125];
    // Corporate: 500 - gap; w75 gap=.25 → 499.75, w125 gap=.25 → 499.75; first in order wins
    const result = findBestOpponent(wa, 100, sorted, scores, makeCtx());
    expect(result?.id).toBe('w75');
  });

  it('picks the tightest gap for Corporate promoters', () => {
    const wa = w('wa');
    const w80 = w('w80');
    const w90 = w('w90');
    const result = findBestOpponent(wa, 100, [w80, w90, wa], [80, 90, 100], makeCtx());
    expect(result?.id).toBe('w90');
  });

  it('picks the widest gap for Greedy promoters', () => {
    const wa = w('wa');
    const w80 = w('w80');
    const w110 = w('w110');
    const ctx = makeCtx({ promoter: makePromoter({ personality: 'Greedy' }), gapThreshold: 0.35 });
    const result = findBestOpponent(wa, 100, [w80, wa, w110], [80, 100, 110], ctx);
    expect(result?.id).toBe('w80');
  });

  it('skips already-matched warriors and recent opponents', () => {
    const wa = w('wa');
    const w90 = w('w90');
    const w80 = w('w80');
    const sorted = [w80, w90, wa];
    const scores = [80, 90, 100];

    const matched = findBestOpponent(
      wa,
      100,
      sorted,
      scores,
      makeCtx({ matchedIds: new Set(['w90']) })
    );
    expect(matched?.id).toBe('w80');

    const recent = findBestOpponent(
      wa,
      100,
      sorted,
      scores,
      makeCtx({ recentFightPairs: new Set([getPairKey('wa', 'w90')]) })
    );
    expect(recent?.id).toBe('w80');
  });

  it('skips avoided warriors when a player warrior is in the matchup', () => {
    const wa = w('wa');
    const w90 = w('w90');
    const w80 = w('w80');
    const ctx = makeCtx({
      playerWarriorIds: new Set(['wa']),
      avoidSet: new Set(['w90']),
    });
    const result = findBestOpponent(wa, 100, [w80, w90, wa], [80, 90, 100], ctx);
    expect(result?.id).toBe('w80');
  });

  it('boosts challenged warriors when a player warrior is in the matchup', () => {
    const wa = w('wa');
    const w90 = w('w90');
    const w80 = w('w80');
    // Without the challenge bonus Corporate prefers w90 (tighter gap);
    // the bonus should flip it to w80.
    const ctx = makeCtx({
      playerWarriorIds: new Set(['wa']),
      challengeSet: new Set(['w80']),
    });
    const result = findBestOpponent(wa, 100, [w80, w90, wa], [80, 90, 100], ctx);
    expect(result?.id).toBe('w80');
  });
});

describe('createBoutOffer', () => {
  const state = makeGameState({ absoluteWeek: 10 });
  const ctx: OfferBuildContext = {
    playerWarriorIds: new Set<string>(),
    weather: 'Clear',
  };

  it('builds a Proposed offer with pending responses and display-week fields', () => {
    const wa = w('wa');
    const wb = w('wb');
    const promoter = makePromoter({ personality: 'Corporate', tier: 'Local' });
    const offer = createBoutOffer(wa, wb, promoter, state, new SeededRNG(42), ctx);

    expect(offer.status).toBe('Proposed');
    expect(offer.promoterId).toBe('p1');
    expect(offer.warriorIds).toEqual(['wa', 'wb']);
    expect(offer.responses).toEqual({ wa: 'Pending', wb: 'Pending' });
    expect(offer.boutWeek).toBe(12);
    expect(offer.expirationWeek).toBe(11);
    expect(offer.createdAbsoluteWeek).toBe(10);
    expect(typeof offer.arenaId).toBe('string');
    expect(offer.id).toBeTruthy();
  });

  it('computes purse as FIGHT_PURSE * tierMult * hype% * personalityMod, floored', () => {
    const wa = w('wa');
    const wb = w('wb');
    const promoter = makePromoter({ personality: 'Corporate', tier: 'Local' });
    const offer = createBoutOffer(wa, wb, promoter, state, new SeededRNG(42), ctx);

    const hype = calculateHype(wa, wb, promoter);
    expect(offer.hype).toBe(hype);
    const expected = Math.floor(FIGHT_PURSE * TIER_MULTIPLIERS.Local * (hype / 100) * 1.05);
    expect(offer.purse).toBe(expected);
  });

  it('is deterministic for the same rng seed', () => {
    const wa = w('wa');
    const wb = w('wb');
    const promoter = makePromoter();
    const o1 = createBoutOffer(wa, wb, promoter, state, new SeededRNG(7), ctx);
    const o2 = createBoutOffer(wa, wb, promoter, state, new SeededRNG(7), ctx);
    expect(o1).toEqual(o2);
  });
});
