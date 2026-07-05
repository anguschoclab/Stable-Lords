import { describe, it, expect } from 'vitest';
import { getEligibleArenasForTournament } from '@/engine/matchmaking/tournament/tournamentArenaSelection';
import { GUTTER_PIT } from '@/data/arenas';
import { TOURNAMENT_ARENA_DEFAULTS } from '@/constants/arena';

describe('getEligibleArenasForTournament', () => {
  it('excludes cramped arenas like gutter_pit for large brackets', () => {
    const eligible = getEligibleArenasForTournament({
      bracketSize: TOURNAMENT_ARENA_DEFAULTS.LARGE_BRACKET_THRESHOLD,
      minTier: 1 // gutter_pit is tier 1
    });
    const hasGutterPit = eligible.some(a => a.id === GUTTER_PIT.id);
    expect(hasGutterPit).toBe(false);
  });
});
