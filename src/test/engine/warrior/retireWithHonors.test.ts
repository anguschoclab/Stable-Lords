/**
 * retireWithHonors — shared retirement helper. Retires the warrior and, for
 * distinguished careers, earns the permanent 'legend' epithet without ever
 * downgrading a higher-ranked one.
 */
import { describe, it, expect } from 'vitest';
import { retireWithHonors } from '@/engine/warrior/retirement';
import { EPITHET_TABLES } from '@/data/names/epithets';
import { makeWarrior } from '@/test/_fixtures/factories';

describe('retireWithHonors', () => {
  it('retires the warrior and stamps retiredWeek', () => {
    const w = retireWithHonors(makeWarrior({ name: 'PLAIN JOE' }), 52);
    expect(w.status).toBe('Retired');
    expect(w.retiredWeek).toBe(52);
    expect(w.name).toBe('PLAIN JOE');
  });

  it('earns a legend epithet for distinguished careers', () => {
    const w = retireWithHonors(makeWarrior({ career: { wins: 60, losses: 5, kills: 0 } }), 52);
    expect(w.epithet).toBeDefined();
    expect(EPITHET_TABLES.legend).toContain(w.epithet);
  });

  it('leaves journeymen unepithetted', () => {
    const w = retireWithHonors(
      makeWarrior({ career: { wins: 10, losses: 10, kills: 0 }, fame: 100 }),
      52
    );
    expect(w.epithet).toBeUndefined();
  });

  it('never downgrades a champion epithet', () => {
    const champ = makeWarrior({
      career: { wins: 60, losses: 5, kills: 0 },
      epithet: 'the Invincible',
    });
    const w = retireWithHonors(champ, 52);
    expect(w.epithet).toBe('the Invincible');
  });
});
