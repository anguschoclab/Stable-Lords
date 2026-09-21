/**
 * D.0 — Desperation gate fix (G14).
 * A critically low treasury must not override hard safety refusals:
 * blocking injuries always decline; a RECOVERY stable still declines killers.
 */
import { describe, it, expect } from 'vitest';
import { evaluateBoutOffer } from '@/engine/ai/workers/competitionWorker';
import {
  makeBoutOffer,
  makeRival,
  makeWarrior,
} from '@/test/_fixtures/factories';
import type { InjuryId } from '@/types/shared.types';
import type { InjuryData } from '@/types/warrior.types';

const severeInjury: InjuryData = {
  id: 'inj-1' as InjuryId,
  name: 'Crushed Rib',
  severity: 'Severe',
  description: 'Crushed rib',
  weeksRemaining: 6,
  penalties: {},
};

describe('desperation gate', () => {
  it('low treasury still accepts a safe offer', () => {
    const warrior = makeWarrior({ fame: 50 });
    const rival = makeRival({ roster: [warrior], treasury: 300 });
    const offer = makeBoutOffer({ warriorIds: [warrior.id], purse: 150, hype: 80 });
    expect(evaluateBoutOffer(offer, rival, warrior, 5, 'Clear')).toBe('Accepted');
  });

  it('RECOVERY stable with low treasury still declines a killer opponent', () => {
    const warrior = makeWarrior({ fame: 50 });
    const killer = makeWarrior({ fame: 60, career: { wins: 10, losses: 0, kills: 4 } });
    const rival = makeRival({
      roster: [warrior],
      treasury: 300,
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 2 },
    });
    const offer = makeBoutOffer({
      warriorIds: [warrior.id, killer.id],
      purse: 400,
      hype: 120,
    });
    expect(
      evaluateBoutOffer(offer, rival, warrior, 5, 'Clear', killer)
    ).toBe('Declined');
  });

  it('RECOVERY stable with low treasury still declines a huge fame mismatch', () => {
    const warrior = makeWarrior({ fame: 50 });
    const superstar = makeWarrior({ fame: 500, career: { wins: 0, losses: 0, kills: 0 } });
    const rival = makeRival({
      roster: [warrior],
      treasury: 300,
      strategy: { intent: 'RECOVERY', planWeeksRemaining: 2 },
    });
    const offer = makeBoutOffer({
      warriorIds: [warrior.id, superstar.id],
      purse: 400,
      hype: 120,
    });
    expect(
      evaluateBoutOffer(offer, rival, warrior, 5, 'Clear', superstar)
    ).toBe('Declined');
  });

  it('blocking injuries decline regardless of treasury', () => {
    const warrior = makeWarrior({ fame: 50, injuries: [severeInjury] });
    const rival = makeRival({ roster: [warrior], treasury: 100 });
    const offer = makeBoutOffer({ warriorIds: [warrior.id], purse: 400, hype: 120 });
    expect(evaluateBoutOffer(offer, rival, warrior, 5, 'Clear')).toBe('Declined');
  });

  it('blocking injuries decline even for Aggressive stables', () => {
    const warrior = makeWarrior({ fame: 50, injuries: [severeInjury] });
    const rival = makeRival({
      roster: [warrior],
      treasury: 100,
      owner: { id: 'agg-owner' as never, name: 'A', stableName: 'A', fame: 100, renown: 0, titles: 0, personality: 'Aggressive' },
    });
    const offer = makeBoutOffer({ warriorIds: [warrior.id], purse: 400, hype: 120 });
    expect(evaluateBoutOffer(offer, rival, warrior, 5, 'Clear')).toBe('Declined');
  });
});
