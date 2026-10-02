/**
 * Megaplan Phase 4 — weekly title-bout cap scales with the arena roster so
 * 47 venues can't sit dormant behind a fixed cap of 3 defenses.
 */
import { describe, it, expect } from 'vitest';
import { titleBoutsPerWeekCap } from '@/engine/championship/arenaChampionship/phases/scheduling';
import { getAllArenas } from '@/data/arenas';
import { ARENA_TITLE } from '@/constants/arena';

describe('titleBoutsPerWeekCap', () => {
  it('equals max(MIN_TITLE_BOUTS_PER_WEEK, ceil(arenaCount / DEFENSE_INTERVAL_WEEKS))', () => {
    const arenaCount = getAllArenas().length;
    const expected = Math.max(
      ARENA_TITLE.MIN_TITLE_BOUTS_PER_WEEK,
      Math.ceil(arenaCount / ARENA_TITLE.DEFENSE_INTERVAL_WEEKS)
    );
    expect(titleBoutsPerWeekCap()).toBe(expected);
  });

  it('keeps pace with a 40+ arena world (a defense can cycle every interval)', () => {
    // Each arena should be able to defend once per DEFENSE_INTERVAL_WEEKS.
    const arenaCount = getAllArenas().length;
    expect(titleBoutsPerWeekCap() * ARENA_TITLE.DEFENSE_INTERVAL_WEEKS).toBeGreaterThanOrEqual(
      arenaCount
    );
  });

  it('never drops below the floor even with a tiny arena roster', () => {
    expect(titleBoutsPerWeekCap(4)).toBe(ARENA_TITLE.MIN_TITLE_BOUTS_PER_WEEK);
  });
});
