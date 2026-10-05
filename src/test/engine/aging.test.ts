// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeAgingImpact } from '@/engine/aging';
import { resolveImpacts } from '@/engine/impacts';
import type { GameState, Warrior, Attributes, WarriorId } from '@/types/game';
import { FightingStyle } from '@/types/game';
import { SeededRNG } from '@/utils/random';
import {
  makeGameState as fixtureGameState,
  makeComputedWarrior as fixtureComputedWarrior,
  makeRival as fixtureRival,
} from '@/test/_fixtures/factories';

// ─── Test Helpers ─────────────────────────────────────────────────────────

const makeWarrior = (id: string, age: number, attrs: Partial<Attributes> = {}): Warrior =>
  fixtureComputedWarrior(attrs, FightingStyle.StrikingAttack, {
    id: id as WarriorId,
    name: `Warrior ${id}`,
    fame: 0,
    age,
  });

const makeGameState = (week: number, roster: Warrior[]): GameState =>
  fixtureGameState({
    meta: { gameName: 'Test', version: '1.0', createdAt: '' },
    ftueComplete: true,
    player: { id: 'p1', name: 'Player', stableName: 'Stable', fame: 0, renown: 0, titles: 0 },
    treasury: 0,
    week,
    roster,
    rivals: [],
    recruitPool: [],
    phase: 'Planning',
    activeTournamentId: undefined,
    isFTUE: false,
  } as any);

// ─── Tests ────────────────────────────────────────────────────────────────

describe('computeAgingImpact — basic aging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('increments age by 1 on multiples of 52 weeks', () => {
    const w = makeWarrior('w1', 20);
    const state = makeGameState(52, [w]);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster[0]!.age).toBe(21);
  });

  it('does not increment age on non-multiples of 52 weeks', () => {
    const w = makeWarrior('w1', 20);
    const state = makeGameState(51, [w]);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster[0]!.age).toBe(20);
  });
});

describe('computeAgingImpact — aging penalties', () => {
  beforeEach(() => {
    // Default mock to avoid retirement unless requested
    vi.spyOn(SeededRNG.prototype, 'next').mockReturnValue(0.99);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Age constants tuned 2026-04: AGING_PENALTY_START=25, FORCED_RETIRE_MIN=26,
  // FORCED_RETIRE_MAX=32. Test ages updated to match the new windows.
  it('does not apply penalties to a warrior under the age penalty start limit', () => {
    const w = makeWarrior('w1', 23, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster[0]!.age).toBe(24);
    expect(newState.roster[0]!.attributes.SP).toBe(15);
    expect(newState.roster[0]!.attributes.DF).toBe(15);
  });

  it('applies penalty to SP and DF when age exceeds AGING_PENALTY_START', () => {
    // Age 27 → 28 ticks: > AGING_PENALTY_START (25), penalty=floor((28-25)/3)=1.
    // Stays under FORCED_RETIRE_MAX (32) so no retirement; retire chance gated
    // out by mock returning 0.99 in the parent describe's beforeEach.
    const w = makeWarrior('w1', 27, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster[0]!.age).toBe(28);
    expect(newState.roster[0]!.attributes.SP).toBe(14);
    expect(newState.roster[0]!.attributes.DF).toBe(14);
  });

  it('adds a newsletter event when aging penalties are applied', () => {
    const w = makeWarrior('w1', 27, { SP: 15, DF: 15 });
    const state = makeGameState(52, [w]);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.newsletter.length).toBe(1);
    expect(newState.newsletter[0]!.title).toBe('Aging Report');
  });
});

describe('computeAgingImpact — forced retirement', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('never retires a dead warrior — a corpse cannot age out', () => {
    // Dead warriors must leave the roster at death, but any that linger
    // (legacy state, a missed removal) must not be posthumously "retired" —
    // that would push their id into state.retired while it sits in the
    // graveyard, corrupting the retired pool and founder succession.
    const w = { ...makeWarrior('ghost', 33), status: 'Dead' as const, isDead: true };
    const state = makeGameState(10, [w]);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.retired.filter((r) => r.id === 'ghost')).toHaveLength(0);
    // Not swept, not patched — just left alone pending whatever moved it off.
    expect(impact.rosterRemovals ?? []).not.toContain('ghost');
  });

  // Retirement window 2026-04: FORCED_RETIRE_MIN=26, FORCED_RETIRE_MAX=32.
  it('guarantees retirement for a warrior at FORCED_RETIRE_MAX (32+)', () => {
    const w = makeWarrior('w1', 32);
    const state = makeGameState(10, [w]);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster.length).toBe(0);
    expect(newState.retired.length).toBe(1);
  });

  it('can force retirement with a low random roll', () => {
    const w = makeWarrior('w1', 29);
    const state = makeGameState(12, [w]);

    // Retire chance at age 29 = ((29-26)/(32-26)) * 0.15 = 0.075. Mock 0.01 triggers.
    vi.spyOn(SeededRNG.prototype, 'next').mockReturnValue(0.01);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster.length).toBe(0);
    expect(newState.retired.length).toBe(1);
  });

  it('does not force retirement with a high random roll', () => {
    const w = makeWarrior('w1', 29);
    const state = makeGameState(12, [w]);

    vi.spyOn(SeededRNG.prototype, 'next').mockReturnValue(0.99);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.roster.length).toBe(1);
  });
});

describe('computeAgingImpact — champion deferral', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const reigningState = (w: Warrior, onRivalRoster: boolean): GameState =>
    fixtureGameState({
      meta: { gameName: 'Test', version: '1.0', createdAt: '' },
      ftueComplete: true,
      player: { id: 'p1', name: 'Player', stableName: 'Stable', fame: 0, renown: 0, titles: 0 },
      treasury: 0,
      week: 12,
      roster: onRivalRoster ? [] : [w],
      rivals: onRivalRoster ? [fixtureRival({ id: 'r1' as any, roster: [w] })] : [],
      arenaChampions: {
        arena_1: {
          champion: {
            warriorId: w.id,
            startedAbsoluteWeek: 1,
            defenses: 0,
            lastActivityWeek: 1,
          },
          status: 'active',
          history: [],
          refusals: 0,
          deferrals: 0,
          noContenderStreak: 0,
          declinedContenders: {},
        },
      },
      recruitPool: [],
      phase: 'Planning',
      isFTUE: false,
    } as any);

  it('defers a reigning player champion through the probabilistic window', () => {
    // Age 29, roll 0.01 → a non-champion retires; a reigning champion does not.
    const w = makeWarrior('champ', 29);
    const state = reigningState(w, false);
    vi.spyOn(SeededRNG.prototype, 'next').mockReturnValue(0.01);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.retired.length).toBe(0);
    expect(newState.roster.length).toBe(1);
  });

  it('defers a reigning rival champion through the probabilistic window', () => {
    const w = makeWarrior('rchamp', 29);
    const state = reigningState(w, true);
    vi.spyOn(SeededRNG.prototype, 'next').mockReturnValue(0.01);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.retired.length).toBe(0);
    expect(newState.rivals[0]!.roster.length).toBe(1);
  });

  it('still forces a reigning champion at FORCED_RETIRE_MAX', () => {
    const w = makeWarrior('oldchamp', 32);
    const state = reigningState(w, true);
    const rng = new SeededRNG(state.week * 997 + 3);
    const impact = computeAgingImpact(state, rng);
    const newState = resolveImpacts(state, [impact]);

    expect(newState.retired.length).toBe(1);
    expect(newState.rivals[0]!.roster.length).toBe(0);
  });
});
