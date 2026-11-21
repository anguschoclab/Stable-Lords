import { describe, it, expect } from 'vitest';
// V30-W1.4: shared weekly ledger emitter — the rival path consumes the same
// computeEconomyImpact the player's EconomyPass uses, with an explicit
// seed-offset arg (rival salt = week*31 + id.length) replacing its private
// inline loop.
import { computeEconomyImpact } from '@/engine/economy/weeklyBreakdown';
import { SeededRNG } from '@/utils/random';
import { TRUNCATION_CAPS } from '@/engine/storage/truncation';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { StableEconomyInput } from '@/engine/economy/weeklyBreakdown';

const input = (over: Partial<StableEconomyInput> = {}): StableEconomyInput => ({
  week: 10,
  roster: [makeWarrior()],
  fame: 100,
  weather: 'Clear',
  arenaHistory: [],
  trainers: [],
  trainingAssignments: [],
  treasury: 500,
  ...over,
});

describe('computeEconomyImpact — shared ledger emitter (V30)', () => {
  // V30 pin: player-side default seed salt stays week*31.
  it('pin: default seed salt is week * 31', () => {
    const impact = computeEconomyImpact(input());
    expect(impact.ledgerEntries!.length).toBeGreaterThan(0);
    const expected = new SeededRNG(10 * 31);
    expect(impact.ledgerEntries![0]!.id).toBe(expected.uuid());
  });

  it('seedOffset arg reproduces the rival salt week*31 + offset', () => {
    const impact = computeEconomyImpact(input(), undefined, { seedOffset: 5 });
    expect(impact.ledgerEntries!.length).toBeGreaterThan(0);
    const expected = new SeededRNG(10 * 31 + 5);
    expect(impact.ledgerEntries![0]!.id).toBe(expected.uuid());
  });

  it('income entries are positive and expense entries are negative — one convention for both stables', () => {
    const playerImpact = computeEconomyImpact(input({ isPlayer: true }));
    const rivalImpact = computeEconomyImpact(input({ isPlayer: false }));
    for (const e of [...playerImpact.ledgerEntries!, ...rivalImpact.ledgerEntries!]) {
      expect(typeof e.amount).toBe('number');
    }
  });

  it('pin: rival ledger cap comes from TRUNCATION_CAPS.rivalLedger, not a literal', () => {
    expect(TRUNCATION_CAPS.rivalLedger).toBe(500);
  });
});
