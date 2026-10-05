import { describe, it, expect } from 'vitest';
import {
  verifyBoutAcceptance,
  evaluateBoutOffer,
  venueCounterTarget,
} from '@/engine/ai/workers/competitionWorker/boutAcceptance';
import {
  makeWarrior,
  makeRival,
  makeStrategy,
  makeBoutOffer,
} from '@/test/_fixtures/factories';

/**
 * V11 characterization spec — pins the public surface of boutAcceptance.ts
 * before the Phase-4 split into boutAcceptance/ submodules. These assert
 * current behavior so the extraction must preserve every gate.
 */

const rivalWith = (intent: string, personality = 'Pragmatic', treasury = 5000) =>
  makeRival({
    strategy: makeStrategy({ intent }),
    treasury,
    owner: { personality } as never,
  });

describe('verifyBoutAcceptance (characterization)', () => {
  const w = () => makeWarrior({ fame: 100 });
  const killer = () => makeWarrior({ fame: 100, career: { kills: 2 } as never });

  it('RECOVERY intent refuses opponents with kills', () => {
    const r = verifyBoutAcceptance(rivalWith('RECOVERY'), w(), killer());
    expect(r.accepted).toBe(false);
    expect(r.reason).toMatch(/risk/i);
  });

  it('title bouts bypass the RECOVERY risk gate', () => {
    const r = verifyBoutAcceptance(rivalWith('RECOVERY'), w(), killer(), 'Clear', {
      isTitleBout: true,
    });
    expect(r.accepted).toBe(true);
  });

  it('SURVIVAL intent refuses a higher-fame opponent', () => {
    const r = verifyBoutAcceptance(rivalWith('SURVIVAL'), w(), makeWarrior({ fame: 500 }));
    expect(r.accepted).toBe(false);
  });

  it('Aggressive personality accepts a normal bout', () => {
    const r = verifyBoutAcceptance(rivalWith('CONSOLIDATION', 'Aggressive'), w(), w());
    expect(r.accepted).toBe(true);
  });

  it('Aggressive personality still refuses lethal heat for low-CN warriors', () => {
    const frail = makeWarrior({ fame: 100, attributes: { CN: 5 } as never });
    const r = verifyBoutAcceptance(rivalWith('CONSOLIDATION', 'Aggressive'), frail, w(), 'Sweltering');
    expect(r.accepted).toBe(false);
  });

  it('declines when the opponent outclasses by >300 fame', () => {
    const r = verifyBoutAcceptance(rivalWith('CONSOLIDATION'), w(), makeWarrior({ fame: 500 }));
    expect(r.accepted).toBe(false);
  });
});

describe('venueCounterTarget (characterization)', () => {
  it('returns undefined when the offer has no arenaId or is already countered', () => {
    const w = makeWarrior();
    const r = rivalWith('CONSOLIDATION');
    expect(venueCounterTarget(makeBoutOffer({ arenaId: undefined }), w, r)).toBeUndefined();
    expect(
      venueCounterTarget(
        makeBoutOffer({ arenaId: 'a1', conditions: ['COUNTERED_VENUE'] }),
        w,
        r
      )
    ).toBeUndefined();
  });

  it('returns undefined without venue history (below sample floor)', () => {
    const w = makeWarrior();
    const r = rivalWith('CONSOLIDATION');
    expect(venueCounterTarget(makeBoutOffer({ arenaId: 'a1' }), w, r)).toBeUndefined();
  });
});

describe('evaluateBoutOffer (characterization)', () => {
  it('declines on a blocking injury with the explain reason', () => {
    const explain: { reason?: string } = {};
    const w = makeWarrior({ injuries: [{ severity: 'Severe' }] as never });
    const v = evaluateBoutOffer({
      offer: makeBoutOffer(),
      rival: rivalWith('CONSOLIDATION'),
      warrior: w,
      currentWeek: 5,
      explain,
    });
    expect(v).toBe('Declined');
    expect(explain.reason).toBe('blocking-injury');
  });

  it('accepts when treasury is below the desperation floor', () => {
    const explain: { reason?: string } = {};
    const v = evaluateBoutOffer({
      offer: makeBoutOffer(),
      rival: rivalWith('CONSOLIDATION', 'Pragmatic', 100),
      warrior: makeWarrior(),
      currentWeek: 5,
      opponent: makeWarrior({ fame: 0 }),
      explain,
    });
    expect(v).toBe('Accepted');
    expect(explain.reason).toBe('desperate-for-purse');
  });
});
