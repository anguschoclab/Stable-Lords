/**
 * Stage F — promoter-aware rival evaluation.
 * Rivals read the promoter's reputation the way the advisor does:
 * a Sadistic promoter + a killer opponent is a death-show booking cautious
 * stables decline; a Greedy promoter's lowball pricing earns a counter.
 */
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateBoutOffer } from '@/engine/ai/workers/competitionWorker';
import {
  makeWarrior,
  makeRival,
  makeGameState,
  makeBoutOffer,
  makePromoter,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import type { PromoterId } from '@/types/shared.types';

beforeEach(() => resetFixtureIds());

function setup(opts: { personality: 'Sadistic' | 'Honorable' | 'Greedy' }) {
  const warrior = makeWarrior({
    fame: 100,
    career: { wins: 10, losses: 4, kills: 0 },
  });
  const killer = makeWarrior({
    fame: 120,
    career: { wins: 15, losses: 2, kills: 3 },
  });
  const promoter = makePromoter({
    id: 'promo-1' as PromoterId,
    personality: opts.personality,
  });
  const offer = makeBoutOffer({
    promoterId: 'promo-1' as PromoterId,
    warriorIds: [warrior.id, killer.id],
    purse: 400,
    hype: 90,
  });
  const state = makeGameState({
    promoters: { ['promo-1' as PromoterId]: promoter },
  });
  const rival = makeRival({ roster: [warrior], treasury: 5000 });
  return { warrior, killer, offer, state, rival };
}

describe('promoter-aware rival evaluation', () => {
  it('a Methodical stable declines a Sadistic promoter booking against a killer', () => {
    const { warrior, killer, offer, state, rival } = setup({ personality: 'Sadistic' });
    rival.owner.personality = 'Methodical';
    expect(evaluateBoutOffer(offer, rival, warrior, 5, 'Clear', killer, state)).toBe('Declined');
  });

  it('the same booking from an Honorable promoter is accepted', () => {
    const { warrior, killer, offer, state, rival } = setup({ personality: 'Honorable' });
    rival.owner.personality = 'Methodical';
    expect(evaluateBoutOffer(offer, rival, warrior, 5, 'Clear', killer, state)).toBe('Accepted');
  });

  it('Aggressive stables still take the Sadistic booking — blood sells', () => {
    const { warrior, killer, offer, state, rival } = setup({ personality: 'Sadistic' });
    rival.owner.personality = 'Aggressive';
    expect(evaluateBoutOffer(offer, rival, warrior, 5, 'Clear', killer, state)).toBe('Accepted');
  });

  it('a Greedy promoter gets countered where an Honorable one clears the fame floor', () => {
    const warrior = makeWarrior({ fame: 400 });
    const opponent = makeWarrior({ fame: 380 });
    const honest = makePromoter({ id: 'promo-h' as PromoterId, personality: 'Honorable' });
    const greedy = makePromoter({ id: 'promo-g' as PromoterId, personality: 'Greedy' });
    const rival = makeRival({ roster: [warrior], treasury: 5000 });
    rival.owner.personality = 'Pragmatic';
    const state = makeGameState({
      promoters: { ['promo-h' as PromoterId]: honest, ['promo-g' as PromoterId]: greedy },
    });
    // Purse 360: clears the normal fame floor (400-50=350) but not the
    // lowball floor a Greedy promoter earns (400-20=380).
    const honestOffer = makeBoutOffer({
      promoterId: 'promo-h' as PromoterId,
      warriorIds: [warrior.id, opponent.id],
      purse: 360,
      hype: 90,
    });
    const greedyOffer = makeBoutOffer({
      promoterId: 'promo-g' as PromoterId,
      warriorIds: [warrior.id, opponent.id],
      purse: 360,
      hype: 90,
    });
    expect(evaluateBoutOffer(honestOffer, rival, warrior, 5, 'Clear', opponent, state)).toBe(
      'Accepted'
    );
    expect(evaluateBoutOffer(greedyOffer, rival, warrior, 5, 'Clear', opponent, state)).toBe(
      'Countered'
    );
  });
});
