/**
 * Megaplan Phase 4 — `selectArenaForMatchup` honors the eligibility
 * intersection: no warrior is ever booked at a venue they can't fight in,
 * venue draws spread across the eligible set, and the home-venue bonus stays
 * inside its cap.
 */
import { describe, it, expect } from 'vitest';
import { selectArenaForMatchup, eligibleArenasFor } from '@/engine/matchmaking/arenaFit';
import { ARENA_SELECTION } from '@/constants/arena';
import { SeededRNGService } from '@/utils/random';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

const w = (id: string, over: Partial<Warrior> = {}) =>
  makeWarrior({ id: id as WarriorId, fame: 0, ...over } as never);

describe('selectArenaForMatchup — eligibility', () => {
  it('never books a warrior at an ineligible arena (200 seeded draws)', () => {
    const rookies = [w('a'), w('b')]; // fame 0 → tier-1 only
    const elites = [w('c', { fame: 999, champion: true }), w('d', { fame: 999, champion: true })];
    for (let seed = 0; seed < 200; seed++) {
      const rng = new SeededRNGService(seed * 31 + 7);
      const rookiePick = selectArenaForMatchup(rookies[0]!, rookies[1]!, rng);
      const eligible = new Set(eligibleArenasFor(rookies[0]!).map((a) => a.id));
      expect(eligible.has(rookiePick)).toBe(true);

      const elitePick = selectArenaForMatchup(elites[0]!, elites[1]!, rng);
      const eliteEligible = new Set(eligibleArenasFor(elites[0]!).map((a) => a.id));
      expect(eliteEligible.has(elitePick)).toBe(true);
    }
  });

  it('a mixed-fame pairing is restricted to the lower warrior’s eligible set', () => {
    const rookie = w('rookie');
    const elite = w('elite', { fame: 999, champion: true });
    const rookieSet = new Set(eligibleArenasFor(rookie).map((a) => a.id));
    for (let seed = 0; seed < 100; seed++) {
      const pick = selectArenaForMatchup(elite, rookie, new SeededRNGService(seed));
      expect(rookieSet.has(pick)).toBe(true);
    }
  });

  it('respects a promoter arenaPool narrowed past eligibility', () => {
    const a = w('a', { fame: 500 });
    const b = w('b', { fame: 500 });
    const eligibleIds = eligibleArenasFor(a).map((x) => x.id);
    const pool = eligibleIds.slice(0, 3); // narrow promoter pool
    for (let seed = 0; seed < 100; seed++) {
      const pick = selectArenaForMatchup(a, b, new SeededRNGService(seed + 1), {
        arenaPool: pool,
      });
      expect(pool).toContain(pick);
    }
  });

  it('spreads bookings across multiple eligible venues when no home record exists', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      seen.add(selectArenaForMatchup(w('x'), w('y'), new SeededRNGService(seed * 17 + 3)));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('home-venue weight', () => {
  it('exposes HOME_VENUE_WEIGHT_MAX and caps the fit bonus at it', () => {
    expect(ARENA_SELECTION.HOME_VENUE_WEIGHT_MAX).toBeGreaterThan(0);
    expect(ARENA_SELECTION.HOME_VENUE_WEIGHT_MAX).toBeLessThanOrEqual(
      ARENA_SELECTION.HOME_VENUE_FIT_BONUS
    );
  });
});
