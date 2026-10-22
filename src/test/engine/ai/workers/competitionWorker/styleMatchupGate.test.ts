/**
 * fightForecast → bid evaluation.
 * A cautious rival uses the same matchup forecast the player sees on an offer
 * card: a strongly unfavorable style matchup declines, a favorable one is
 * business as usual, and desperate/aggressive stables don't care.
 */
import { describe, it, expect } from 'vitest';
import {
  makeAgentMemory,
  makeGameState,
  makeOwner,
  makeRival,
  makeWarrior,
} from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import { verdict, evalBoutOffer, rivalOffer } from '@/test/_fixtures/competitionWorker';
// Subject under test (evaluated via the shared competitionWorker harness).
import { evaluateBoutOffer } from '@/engine/ai/workers/competitionWorker';

// MATCHUP_MATRIX: getMatchupBonus(WS, AB) === -3, getMatchupBonus(AB, WS) === +3
describe('style matchup gate (F4)', () => {
  it('a Methodical stable declines a strongly unfavorable style matchup', () => {
    const warrior = makeWarrior({ fame: 50, style: FightingStyle.WallOfSteel });
    const opponent = makeWarrior({ fame: 55, style: FightingStyle.AimedBlow });
    const { rival, offer } = rivalOffer({
      warrior,
      opponent,
      rivalOver: { treasury: 5000,
      owner: makeOwner({ personality: 'Methodical' }) },
      offerOver: { purse: 400,
      hype: 80 },
    });
    expect(
      evalBoutOffer({
        offer,
        rival,
        warrior,
        opponent,
      })
    ).toBe('Declined');
  });

  it('a Methodical stable accepts a favorable style matchup', () => {
    const warrior = makeWarrior({ fame: 50, style: FightingStyle.AimedBlow });
    const opponent = makeWarrior({ fame: 55, style: FightingStyle.WallOfSteel });
    const { rival, offer } = rivalOffer({
      warrior,
      opponent,
      rivalOver: { treasury: 5000,
      owner: makeOwner({ personality: 'Methodical' }) },
      offerOver: { purse: 400,
      hype: 80 },
    });
    expect(
      evalBoutOffer({
        offer,
        rival,
        warrior,
        opponent,
      })
    ).toBe('Accepted');
  });

  it('observed aggressive tells tighten the decline threshold to mildly unfavorable', () => {
    // BA vs AB is a mild -1 edge — accepted at baseline. But when the dossier
    // says the opponent's stable brawls high-OE, a calculating stable treats a
    // coin-flip-leaning-bad matchup as a pass.
    const warrior = makeWarrior({ fame: 50, style: FightingStyle.BashingAttack });
    const opponent = makeWarrior({
      id: 'opp_w' as never,
      fame: 55,
      style: FightingStyle.AimedBlow,
    });
    const oppStable = makeRival({ id: 'opp_stable' as never, roster: [opponent] });
    const { rival, offer } = rivalOffer({
      warrior,
      opponent,
      rivalOver: { treasury: 5000,
      owner: makeOwner({ personality: 'Methodical' }),
      agentMemory: makeAgentMemory({
        opponentDossiers: {
          opp_stable: {
            lastSeenWeek: 4,
            knownStyles: [],
            estimatedThreat: 0.6,
            recordVs: { w: 0, l: 0, k: 0 },
            observedTells: { oe: 0.9, al: 0.2, samples: 4, lastSeenWeek: 4 },
          },
        },
      }) },
      offerOver: { purse: 400,
      hype: 80 },
    });
    const state = makeGameState({ rivals: [rival, oppStable], absoluteWeek: 5, week: 5 });
    expect<ReturnType<typeof evaluateBoutOffer>>(verdict(offer, rival, warrior, opponent, state)).toBe('Declined');
  });

  it('an Aggressive stable ignores an unfavorable matchup', () => {
    const warrior = makeWarrior({ fame: 50, style: FightingStyle.WallOfSteel });
    const opponent = makeWarrior({ fame: 55, style: FightingStyle.AimedBlow });
    const { rival, offer } = rivalOffer({
      warrior,
      opponent,
      rivalOver: { treasury: 5000,
      owner: makeOwner({ personality: 'Aggressive' }) },
      offerOver: { purse: 400,
      hype: 80 },
    });
    expect(
      evalBoutOffer({
        offer,
        rival,
        warrior,
        opponent,
      })
    ).toBe('Accepted');
  });
});
