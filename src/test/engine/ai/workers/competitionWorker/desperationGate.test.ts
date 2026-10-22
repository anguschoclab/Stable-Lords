/**
 * Desperation gate: a critically low treasury must not override hard
 * safety refusals — blocking injuries always decline; a RECOVERY stable
 * still declines killers.
 */
import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/test/_fixtures/factories';
import { evalBoutOffer, rivalOffer, severeInjury } from '@/test/_fixtures/competitionWorker';

describe('desperation gate', () => {
  it('low treasury still accepts a safe offer', () => {
    const warrior = makeWarrior({ fame: 50 });
    const { rival, offer } = rivalOffer({
      warrior,
      rivalOver: { treasury: 300 },
      offerOver: { purse: 150, hype: 80 },
    });
    expect(
      evalBoutOffer({
        offer,
        rival,
        warrior,
      })
    ).toBe('Accepted');
  });

  it('RECOVERY stable with low treasury still declines a killer opponent', () => {
    const warrior = makeWarrior({ fame: 50 });
    const killer = makeWarrior({ fame: 60, career: { wins: 10, losses: 0, kills: 4 } });
    const { rival, offer } = rivalOffer({
      warrior,
      opponent: killer,
      rivalOver: { treasury: 300,
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 2 } },
      offerOver: { purse: 400,
      hype: 120 },
    });
    expect(
      evalBoutOffer({
        offer,
        rival,
        warrior,
        opponent: killer,
      })
    ).toBe('Declined');
  });

  it('RECOVERY stable with low treasury still declines a huge fame mismatch', () => {
    const warrior = makeWarrior({ fame: 50 });
    const superstar = makeWarrior({ fame: 500, career: { wins: 0, losses: 0, kills: 0 } });
    const { rival, offer } = rivalOffer({
      warrior,
      opponent: superstar,
      rivalOver: { treasury: 300,
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 2 } },
      offerOver: { purse: 400,
      hype: 120 },
    });
    expect(
      evalBoutOffer({
        offer,
        rival,
        warrior,
        opponent: superstar,
      })
    ).toBe('Declined');
  });

  it('blocking injuries decline regardless of treasury', () => {
    const warrior = makeWarrior({ fame: 50, injuries: [severeInjury] });
    const { rival, offer } = rivalOffer({
      warrior,
      rivalOver: { treasury: 100 },
      offerOver: { purse: 400, hype: 120 },
    });
    expect(
      evalBoutOffer({
        offer,
        rival,
        warrior,
      })
    ).toBe('Declined');
  });

  it('blocking injuries decline even for Aggressive stables', () => {
    const warrior = makeWarrior({ fame: 50, injuries: [severeInjury] });
    const { rival, offer } = rivalOffer({
      warrior,
      rivalOver: { treasury: 100,
      owner: {
        id: 'agg-owner' as never,
        name: 'A',
        stableName: 'A',
        fame: 100,
        renown: 0,
        titles: 0,
        personality: 'Aggressive',
      } },
      offerOver: { purse: 400, hype: 120 },
    });
    expect(
      evalBoutOffer({
        offer,
        rival,
        warrior,
      })
    ).toBe('Declined');
  });
});
