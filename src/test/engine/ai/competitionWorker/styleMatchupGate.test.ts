/**
 * F4 — fightForecast → bid evaluation.
 * A cautious rival uses the same matchup forecast the player sees on an offer
 * card: a strongly unfavorable style matchup declines, a favorable one is
 * business as usual, and desperate/aggressive stables don't care.
 */
import { describe, it, expect } from 'vitest';
import { evaluateBoutOffer } from '@/engine/ai/workers/competitionWorker';
import {
  makeBoutOffer,
  makeOwner,
  makeRival,
  makeWarrior,
} from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';

// MATCHUP_MATRIX: getMatchupBonus(WS, AB) === -3, getMatchupBonus(AB, WS) === +3
describe('style matchup gate (F4)', () => {
  it('a Methodical stable declines a strongly unfavorable style matchup', () => {
    const warrior = makeWarrior({ fame: 50, style: FightingStyle.WallOfSteel });
    const opponent = makeWarrior({ fame: 55, style: FightingStyle.AimedBlow });
    const rival = makeRival({
      roster: [warrior],
      treasury: 5000,
      owner: makeOwner({ personality: 'Methodical' }),
    });
    const offer = makeBoutOffer({
      warriorIds: [warrior.id, opponent.id],
      purse: 400,
      hype: 80,
    });
    expect(evaluateBoutOffer(offer, rival, warrior, 5, 'Clear', opponent)).toBe('Declined');
  });

  it('a Methodical stable accepts a favorable style matchup', () => {
    const warrior = makeWarrior({ fame: 50, style: FightingStyle.AimedBlow });
    const opponent = makeWarrior({ fame: 55, style: FightingStyle.WallOfSteel });
    const rival = makeRival({
      roster: [warrior],
      treasury: 5000,
      owner: makeOwner({ personality: 'Methodical' }),
    });
    const offer = makeBoutOffer({
      warriorIds: [warrior.id, opponent.id],
      purse: 400,
      hype: 80,
    });
    expect(evaluateBoutOffer(offer, rival, warrior, 5, 'Clear', opponent)).toBe('Accepted');
  });

  it('an Aggressive stable ignores an unfavorable matchup', () => {
    const warrior = makeWarrior({ fame: 50, style: FightingStyle.WallOfSteel });
    const opponent = makeWarrior({ fame: 55, style: FightingStyle.AimedBlow });
    const rival = makeRival({
      roster: [warrior],
      treasury: 5000,
      owner: makeOwner({ personality: 'Aggressive' }),
    });
    const offer = makeBoutOffer({
      warriorIds: [warrior.id, opponent.id],
      purse: 400,
      hype: 80,
    });
    expect(evaluateBoutOffer(offer, rival, warrior, 5, 'Clear', opponent)).toBe('Accepted');
  });
});
