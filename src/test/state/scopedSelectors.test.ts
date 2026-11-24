// @vitest-environment jsdom
/**
 * Scoped world-state selectors (B5 tranche 4B).
 *
 * The narrow consumers of the former blanket `useWorldState()` subscription
 * must (a) expose exactly the fields those consumers read — entity-index
 * fields included when a name resolver is in play — and (b) hold a stable
 * identity across unrelated store writes, which is what stops a boutOffers
 * tick from re-rendering a gazette reader.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import '@/test/_setup/setup';
import {
  useGameStore,
  useRivalryAlertState,
  useHallOfFightsState,
  useTrainingAssignmentState,
  useNextBoutState,
  useGazetteState,
  useBloodfeudState,
  useBookingOfficeState,
} from '@/state/useGameStore';
import { deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';

const seed = {
  year: 2,
  week: 7,
  season: 'Summer',
  roster: [{ id: 'w1', name: 'A' }],
  rivals: [{ id: 'r1', owner: { stableName: 'Rival Co' }, roster: [] }],
  graveyard: [{ id: 'g1' }],
  retired: [{ id: 'rt1' }],
  boutOffers: { o1: { id: 'o1' } },
  tournaments: [{ id: 't1' }],
  activeTournamentId: 't1',
  arenaHistory: [{ id: 'f1' }],
  gazettes: [{ id: 'gz1' }],
  bloodfeudMarks: [{ id: 'm1' }],
  killEvents: [{ id: 'k1', killerId: 'x', victimId: 'g1' }],
  lifetimeStats: { bouts: 3 },
  player: { id: 'p1', stableName: 'Mine', name: 'Owner' },
  promoters: { p1: { id: 'p1' } },
  trainingAssignments: [{ warriorId: 'w1' }],
  seasonalGrowth: [{ warriorId: 'w1', season: 'Summer', gains: {} }],
};

const applyStore = (override: object = {}) =>
  useGameStore.setState({ ...seed, ...override } as never);

describe('scoped world-state selectors', () => {
  it('useGazetteState exposes only week/season/gazettes', () => {
    applyStore();
    const { result } = renderHook(() => useGazetteState());
    expect(Object.keys(result.current).sort()).toEqual(['gazettes', 'season', 'week']);
    expect(result.current.gazettes).toBe(seed.gazettes);
  });

  it('useRivalryAlertState exposes the rivalry snapshot inputs', () => {
    applyStore();
    const { result } = renderHook(() => useRivalryAlertState());
    expect(result.current.arenaHistory).toBe(seed.arenaHistory);
    expect(result.current.graveyard).toBe(seed.graveyard);
    expect(result.current.rivals).toBe(seed.rivals);
  });

  it('useNextBoutState carries the entity-index fields for name resolvers', () => {
    applyStore();
    const { result } = renderHook(() => useNextBoutState());
    for (const k of ['player', 'roster', 'graveyard', 'retired', 'rivals'] as const) {
      expect(result.current[k], `missing entity-index field ${k}`).toBeDefined();
    }
    expect(result.current.tournaments).toBe(seed.tournaments);
    expect(result.current.activeTournamentId).toBe(seed.activeTournamentId);
  });

  it('useBloodfeudState derives absoluteWeek like reconstructGameState', () => {
    applyStore();
    const { result } = renderHook(() => useBloodfeudState());
    expect(result.current.absoluteWeek).toBe(deriveAbsoluteWeek(seed.year, seed.week));
    expect(result.current.bloodfeudMarks).toBe(seed.bloodfeudMarks);
    expect(result.current.killEvents).toBe(seed.killEvents);
  });

  it('useBookingOfficeState covers the offer-bucket inputs', () => {
    applyStore();
    const { result } = renderHook(() => useBookingOfficeState());
    expect(result.current.boutOffers).toBe(seed.boutOffers);
    expect(result.current.promoters).toBe(seed.promoters);
    expect(result.current.absoluteWeek).toBe(deriveAbsoluteWeek(seed.year, seed.week));
  });

  it('useTrainingAssignmentState + useHallOfFightsState return their subsets', () => {
    applyStore();
    const training = renderHook(() => useTrainingAssignmentState());
    expect(Object.keys(training.result.current).sort()).toEqual([
      'roster',
      'season',
      'seasonalGrowth',
      'trainingAssignments',
    ]);
    const hall = renderHook(() => useHallOfFightsState());
    expect(hall.result.current.lifetimeStats).toBe(seed.lifetimeStats);
    expect(hall.result.current.arenaHistory).toBe(seed.arenaHistory);
  });

  it('holds identity across unrelated store writes (the re-render contract)', () => {
    applyStore();
    const { result, rerender } = renderHook(() => useGazetteState());
    const first = result.current;
    // An unrelated tracked field changes — the selector output must not.
    applyStore({ boutOffers: { o2: { id: 'o2' } } });
    rerender();
    expect(result.current).toBe(first);
    // A selected field changes — new identity surfaces it.
    applyStore({ gazettes: [{ id: 'gz2' }] });
    rerender();
    expect(result.current).not.toBe(first);
    expect(result.current.gazettes).toEqual([{ id: 'gz2' }]);
  });
});
