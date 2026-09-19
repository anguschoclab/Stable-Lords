import { describe, it, expect } from 'vitest';
import { createCumulativeTracker } from '@/engine/stats/cumulativeTracker';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { FightSummary } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';

let boutSeq = 0;

function makeBout(overrides?: Partial<FightSummary>): FightSummary {
  return {
    id: `bout_${++boutSeq}`,
    week: 1,
    title: 'test bout',
    warriorIdA: 'wA',
    warriorIdD: 'wD',
    winner: 'A',
    by: 'KO',
    styleA: 'X',
    styleD: 'Y',
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  } as FightSummary;
}

function makeWarrior(id: string): Warrior {
  return { id, name: id } as unknown as Warrior;
}

function sumValues(record: Record<string, number>): number {
  return Object.values(record).reduce((a, b) => a + b, 0);
}

describe('createCumulativeTracker', () => {
  it('seeds counters from the initial state', () => {
    const state = createFreshState('tracker-baseline');
    state.arenaHistory = [makeBout({ winner: 'A', styleA: 'X', styleD: 'Y' })];
    state.graveyard = [makeWarrior('g1')];
    state.retired = [makeWarrior('r1')];

    const s = createCumulativeTracker(state).snapshot();

    expect(s.totalBouts).toBe(1);
    expect(s.deaths).toBe(1);
    expect(s.retired).toBe(1);
    expect(s.styleWins.X).toBe(1);
    expect(s.styleLosses.Y).toBe(1);
  });

  it('is idempotent — re-recording the same state counts nothing twice', () => {
    const state = createFreshState('tracker-idempotent');
    state.arenaHistory = [makeBout(), makeBout()];
    state.graveyard = [makeWarrior('g1')];

    const tracker = createCumulativeTracker(state);
    tracker.recordWeek(state);
    tracker.recordWeek(state);
    tracker.recordWeek(state);

    const s = tracker.snapshot();
    expect(s.totalBouts).toBe(2);
    expect(s.deaths).toBe(1);
  });

  it('counts new bouts even when history drops head entries mid-tick', () => {
    // matchmaking/tournamentSelection/resolution.ts appends arenaHistory with
    // an inline slice(-500) — history can shrink inside a single tick, so a
    // length-delta would miss the new entry (length 3 -> 2 reads as "0 new").
    const state = createFreshState('tracker-append-drop');
    const a = makeBout();
    const b = makeBout();
    const c = makeBout();
    state.arenaHistory = [a, b, c];
    const tracker = createCumulativeTracker(state);

    // Next week: a and b dropped by an inline cap, d appended — shorter array.
    const d = makeBout();
    state.arenaHistory = [c, d];
    tracker.recordWeek(state);

    // Then e appended with no drops.
    const e = makeBout();
    state.arenaHistory = [c, d, e];
    tracker.recordWeek(state);

    // Every bout ever fought is counted — a,b,c,d,e — not just survivors.
    const s = tracker.snapshot();
    expect(s.totalBouts).toBe(5);
    expect(sumValues(s.styleWins)).toBe(5);
    expect(sumValues(s.styleLosses)).toBe(5);
  });

  it('counts null-winner bouts in totalBouts but records no W/L', () => {
    const state = createFreshState('tracker-draw');
    state.arenaHistory = [makeBout({ winner: null, styleA: 'X', styleD: 'Y' })];

    const s = createCumulativeTracker(state).snapshot();

    expect(s.totalBouts).toBe(1);
    expect(s.styleWins.X).toBe(0);
    expect(s.styleWins.Y).toBe(0);
    expect(s.styleLosses.X).toBe(0);
    expect(s.styleLosses.Y).toBe(0);
  });

  it('seeds winless-style keys so reports can render 0% rows', () => {
    const state = createFreshState('tracker-winless');
    state.arenaHistory = [makeBout({ winner: 'A', styleA: 'X', styleD: 'Y' })];

    const s = createCumulativeTracker(state).snapshot();

    // Y only ever loses — it must still appear in styleWins (0%) and vice versa.
    expect(s.styleWins.Y).toBe(0);
    expect(s.styleLosses.X).toBe(0);
  });

  it('keeps win/loss totals symmetric — every decided bout is 1W + 1L', () => {
    const state = createFreshState('tracker-symmetry');
    state.arenaHistory = [
      makeBout({ winner: 'A' }),
      makeBout({ winner: 'D' }),
      makeBout({ winner: null }),
    ];

    const s = createCumulativeTracker(state).snapshot();
    expect(sumValues(s.styleWins)).toBe(sumValues(s.styleLosses));
    expect(sumValues(s.styleWins)).toBe(2); // only the decided bouts
  });

  it('tracks deaths and retirements by warrior id across drops', () => {
    const state = createFreshState('tracker-warriors');
    state.graveyard = [makeWarrior('g1'), makeWarrior('g2')];
    state.retired = [makeWarrior('r1')];
    const tracker = createCumulativeTracker(state);

    // g1 aged out of the retained window; g3 died this week.
    state.graveyard = [makeWarrior('g2'), makeWarrior('g3')];
    state.retired = [makeWarrior('r1'), makeWarrior('r2')];
    tracker.recordWeek(state);

    const s = tracker.snapshot();
    expect(s.deaths).toBe(3); // g1, g2, g3
    expect(s.retired).toBe(2); // r1, r2
  });

  it('snapshot returns copies — mutating it does not corrupt the tracker', () => {
    const state = createFreshState('tracker-snapshot-copy');
    state.arenaHistory = [makeBout({ styleA: 'X', styleD: 'Y' })];
    const tracker = createCumulativeTracker(state);

    const s1 = tracker.snapshot();
    s1.styleWins.X = 999;
    s1.totalBouts = 999;

    const s2 = tracker.snapshot();
    expect(s2.styleWins.X).toBe(1);
    expect(s2.totalBouts).toBe(1);
  });
});
