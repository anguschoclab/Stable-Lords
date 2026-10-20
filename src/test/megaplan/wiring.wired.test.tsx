// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@/test/_setup/setup';

/**
 * MEGAPLAN-G2/G3 spec (authored test-first, live since Phase 5):
 *
 * G2 — Feature Matrix #5 "Favorite Weapon Charting Toolkit": landed as
 * `src/components/warrior/favorites/FavoritesCharting.tsx`, rendered by
 * `StableHall` — a charting surface visualizing discovered favorite-weapon/
 * rhythm data across the roster, all values derived from real
 * warrior.favorites, never placeholders.
 *
 * G3 — Feature Matrix #23 "Tournament Prep Mode": landed as
 * `src/pages/TournamentPrep.tsx`, routed at `/world/tournament-prep` — a
 * prep surface listing tournament entrants per pending tournament class
 * with eligibility checks (blocking vs advisory).
 */
// import.meta.glob: asserts the surface files exist — a deleted module
// fails as a clean assertion red, not a module-resolution crash.
const chartingModule = import.meta.glob('/src/components/warrior/favorites/FavoritesCharting.*');
const prepModule = import.meta.glob('/src/pages/TournamentPrep.*');

describe('wiring: favorites charting toolkit (MEGAPLAN-G2)', () => {
  it('exposes a roster-wide favorite-weapon charting surface', () => {
    // Expected surface: a section/page component aggregating favorites across
    // the roster (implementation name pinned here so Phase-5 lands it).
    expect(
      Object.keys(chartingModule).length,
      'favorites charting surface missing'
    ).toBeGreaterThan(0);
  });
});

describe('wiring: tournament prep mode (MEGAPLAN-G3)', () => {
  it('exposes a tournament prep surface listing entrants + eligibility', () => {
    expect(Object.keys(prepModule).length, 'tournament prep surface missing').toBeGreaterThan(0);
  });
});
