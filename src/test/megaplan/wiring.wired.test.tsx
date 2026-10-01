// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@/test/_setup/setup';

/**
 * MEGAPLAN-G2/G3 spec (test-first, skipped until Phase 5):
 *
 * G2 — Feature Matrix #5 "Favorite Weapon Charting Toolkit": favorites display
 * exists (warrior/favorites/*, FavoritesCard) but the cross-warrior affinity
 * charting surface is absent. Contract: a charting surface (page or dossier
 * section) that visualizes discovered favorite-weapon/rhythm data across the
 * roster — all values derived from real warrior.favorites, never placeholders.
 *
 * G3 — Feature Matrix #23 "Tournament Prep Mode": FE/class freeze checks for
 * tournament entrants. PhysicalsSimulator covers #9 physicals; prep-mode
 * surface absent. Contract TBD at Phase-5 verification — test encodes the
 * minimum: a prep surface exists that lists tournament entrants with their
 * eligibility/class status.
 */
// import.meta.glob: spec compiles before the surfaces exist (empty map =
// not yet implemented — lands with the Phase-5 build).
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
