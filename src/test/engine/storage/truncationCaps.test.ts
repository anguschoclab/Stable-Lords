import { describe, it, expect } from 'vitest';
import { truncateState, TRUNCATION_CAPS } from '@/engine/storage/truncation';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { Warrior, CareerRecord } from '@/types/warrior.types';

function makeWarrior(overrides?: Partial<Warrior>): Warrior {
  return {
    id: 'w1',
    name: 'Test',
    titles: [],
    flair: [],
    awards: [],
    injuries: [],
    traits: [],
    ...overrides,
  } as unknown as Warrior;
}

describe('truncateState — configurable caps', () => {
  it('uses default caps when no overrides given', () => {
    const state = createFreshState('caps-default');
    state.ledger = Array.from({ length: 600 }, (_, i) => ({ id: i }) as any);
    expect(truncateState(state).ledger.length).toBe(TRUNCATION_CAPS.ledger);
  });

  it('honors per-call cap overrides', () => {
    const state = createFreshState('caps-override');
    state.ledger = Array.from({ length: 600 }, (_, i) => ({ id: i }) as any);
    state.graveyard = Array.from({ length: 300 }, () => makeWarrior());

    const truncated = truncateState(state, { ledger: 100, graveyard: 50 });
    expect(truncated.ledger.length).toBe(100);
    expect(truncated.graveyard.length).toBe(50);
    // Untouched caps stay at defaults
    expect(truncated.matchHistory.length).toBeLessThanOrEqual(TRUNCATION_CAPS.matchHistory);
  });

  it('caps newsletter items while preserving the outer newsletter cap', () => {
    const state = createFreshState('caps-newsletter-items');
    state.newsletter = Array.from({ length: 150 }, (_, i) => ({
      week: i + 1,
      items: Array.from({ length: 250 }, (_, j) => ({ id: `n${i}_${j}` }) as any),
    })) as any;

    const truncated = truncateState(state);

    expect(truncated.newsletter.length).toBe(TRUNCATION_CAPS.newsletter);
    for (const n of truncated.newsletter) {
      expect(n.items.length).toBeLessThanOrEqual(TRUNCATION_CAPS.newsletterItems);
    }
    expect(truncated.newsletter[0]!.items.length).toBe(TRUNCATION_CAPS.newsletterItems);
  });
});

describe('truncateState — per-warrior historical caps', () => {
  it('caps titles, flair, awards and yearlySnapshots on roster warriors', () => {
    const state = createFreshState('caps-warrior');
    const yearlySnapshots: Record<number, CareerRecord> = {};
    for (let y = 1; y <= 15; y++) yearlySnapshots[y] = { wins: 1, losses: 0, kills: 0 };
    state.roster = [
      makeWarrior({
        titles: Array.from({ length: 60 }, (_, i) => `t${i}`),
        flair: Array.from({ length: 70 }, (_, i) => `f${i}`),
        awards: Array.from({ length: 60 }, (_, i) => ({ year: i }) as any),
        yearlySnapshots,
        injuries: [{ id: 'inj1' } as any],
        traits: ['a', 'b'],
      }),
    ];

    const w = truncateState(state).roster[0]!;
    expect(w.titles.length).toBe(TRUNCATION_CAPS.warriorTitles);
    expect(w.titles[0]).toBe('t10'); // tail kept
    expect(w.flair.length).toBe(TRUNCATION_CAPS.warriorFlair);
    expect(w.awards!.length).toBe(TRUNCATION_CAPS.warriorAwards);
    // Last 10 yearly snapshots kept
    const keptYears = Object.keys(w.yearlySnapshots!).map(Number);
    expect(keptYears).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    // Functional arrays untouched
    expect(w.injuries).toHaveLength(1);
    expect(w.traits).toEqual(['a', 'b']);
  });

  it('caps warriors inside graveyard, retired and rival rosters', () => {
    const state = createFreshState('caps-warrior-containers');
    const fat = () =>
      makeWarrior({ titles: Array.from({ length: 60 }, (_, i) => `t${i}`) });
    state.graveyard = [fat()];
    state.retired = [fat()];
    state.rivals = [{ id: 'r1', roster: [fat()], ledger: [] } as any];

    const truncated = truncateState(state);
    expect(truncated.graveyard[0]!.titles.length).toBe(TRUNCATION_CAPS.warriorTitles);
    expect(truncated.retired[0]!.titles.length).toBe(TRUNCATION_CAPS.warriorTitles);
    expect(truncated.rivals[0]!.roster[0]!.titles.length).toBe(TRUNCATION_CAPS.warriorTitles);
  });

  it('preserves warrior/array identity when nothing needs capping', () => {
    const state = createFreshState('caps-warrior-identity');
    const warrior = makeWarrior({ titles: ['t1'], flair: ['f1'] });
    state.roster = [warrior];

    const truncated = truncateState(state);
    expect(truncated.roster).toBe(state.roster); // same array reference
    expect(truncated.roster[0]).toBe(warrior); // same warrior reference
  });

  it('normalizes an absent rival roster to [] rather than passing undefined through', () => {
    // capWarriors is only invoked on required arrays; defensive normalization
    // to [] is safer than preserving undefined — consumers read r.roster.length
    // without guards (e.g. the harness's weekly rival census).
    const state = createFreshState('caps-warrior-absent');
    state.rivals = [{ id: 'r1', roster: undefined, ledger: [] } as any];

    const truncated = truncateState(state);
    expect(truncated.rivals[0]!.roster).toEqual([]);
  });
});
