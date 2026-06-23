import { describe, it, expect } from 'vitest';
import { isPlausibleGameState } from '@/engine/storage/opfsArchive/plausibility';

/** Minimal valid GameState-shaped object with ALL required fields. */
function makeMinimalGameState(): Record<string, unknown> {
  return {
    meta: { gameName: 'Test', version: '1.0', createdAt: '2024-01-01T00:00:00.000Z' },
    ftueComplete: true,
    isFTUE: false,
    isTournamentWeek: false,
    week: 1,
    year: 1,
    fame: 0,
    popularity: 0,
    treasury: 100,
    rosterBonus: 0,
    day: 0,
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    crowdMood: 'Calm',
    player: { id: 'p1', name: 'P', stableName: 'S', fame: 0, renown: 0, titles: 0 },
    promoters: {},
    boutOffers: {},
    realmRankings: {},
    progression: { status: 'active', stableStanding: 0, totalStables: 0, objectives: [] },
    roster: [],
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    hallOfFame: [],
    tournaments: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    rivals: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    recruitPool: [],
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    unacknowledgedDeaths: [],
    awards: [],
    bookmarks: [],
    coachDismissed: [],
    ledger: [],
  };
}

describe('isPlausibleGameState', () => {
  // ── Valid inputs ──────────────────────────────────────────────────────
  it('1. Valid full state → true', () => {
    expect(isPlausibleGameState(makeMinimalGameState())).toBe(true);
  });

  it('40. Extra unknown fields present → true (plausibility is inclusive)', () => {
    const state = makeMinimalGameState();
    state['extraField'] = 'whatever';
    expect(isPlausibleGameState(state)).toBe(true);
  });

  it('41. All optional fields omitted → true', () => {
    const state = makeMinimalGameState();
    // Ensure no optional fields are present
    delete (state as Record<string, unknown>).pendingResolutionData;
    delete (state as Record<string, unknown>).lastWeekBoutDisplay;
    delete (state as Record<string, unknown>).ftueStep;
    delete (state as Record<string, unknown>).activeTournamentId;
    expect(isPlausibleGameState(state)).toBe(true);
  });

  // ── Non-object inputs ─────────────────────────────────────────────────
  it('2. null → false', () => {
    expect(isPlausibleGameState(null)).toBe(false);
  });

  it('3. undefined → false', () => {
    expect(isPlausibleGameState(undefined)).toBe(false);
  });

  it('4. String → false', () => {
    expect(isPlausibleGameState('hello')).toBe(false);
  });

  it('5. Number → false', () => {
    expect(isPlausibleGameState(42)).toBe(false);
  });

  it('6. Array → false', () => {
    expect(isPlausibleGameState([1, 2, 3])).toBe(false);
  });

  it('7. Empty object {} → false', () => {
    expect(isPlausibleGameState({})).toBe(false);
  });

  // ── meta checks ───────────────────────────────────────────────────────
  it('8. Missing meta → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).meta;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('9. meta without version → false', () => {
    const state = makeMinimalGameState();
    (state.meta as Record<string, unknown>).version = undefined;
    delete (state.meta as Record<string, unknown>).version;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('10. meta.version not a string → false', () => {
    const state = makeMinimalGameState();
    (state.meta as Record<string, unknown>).version = 123;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('11. meta without gameName → false', () => {
    const state = makeMinimalGameState();
    delete (state.meta as Record<string, unknown>).gameName;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('12. meta without createdAt → false', () => {
    const state = makeMinimalGameState();
    delete (state.meta as Record<string, unknown>).createdAt;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  // ── player checks ─────────────────────────────────────────────────────
  it('13. Missing player → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).player;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('14. player is null → false', () => {
    const state = makeMinimalGameState();
    state.player = null;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  // ── Boolean scalar checks ─────────────────────────────────────────────
  it('15. Missing ftueComplete → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).ftueComplete;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('16. ftueComplete not a boolean → false', () => {
    const state = makeMinimalGameState();
    state.ftueComplete = 'yes';
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('33. Missing isFTUE → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).isFTUE;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('34. isFTUE not a boolean → false', () => {
    const state = makeMinimalGameState();
    state.isFTUE = 1;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('35. Missing isTournamentWeek → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).isTournamentWeek;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  // ── Number scalar checks ──────────────────────────────────────────────
  it('17. Missing week → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).week;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('18. week not a number → false', () => {
    const state = makeMinimalGameState();
    state.week = '1';
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('19. Missing year → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).year;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('20. year not a number → false', () => {
    const state = makeMinimalGameState();
    state.year = true;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  // ── Array field checks ────────────────────────────────────────────────
  it('21. Missing roster → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).roster;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('22. roster not an array → false', () => {
    const state = makeMinimalGameState();
    state.roster = {};
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('23. Missing arenaHistory → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).arenaHistory;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('24. arenaHistory not an array → false', () => {
    const state = makeMinimalGameState();
    state.arenaHistory = '[]';
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('36. Missing ledger → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).ledger;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('37. ledger not an array → false', () => {
    const state = makeMinimalGameState();
    state.ledger = {};
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('38. Missing bookmarks → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).bookmarks;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('39. Missing coachDismissed → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).coachDismissed;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  // ── Object field checks ───────────────────────────────────────────────
  it('25. Missing promoters → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).promoters;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('26. promoters is an array (wrong type) → false', () => {
    const state = makeMinimalGameState();
    state.promoters = [];
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('27. Missing progression → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).progression;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('28. progression is null → false', () => {
    const state = makeMinimalGameState();
    state.progression = null;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  // ── String scalar checks ──────────────────────────────────────────────
  it('29. Missing phase → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).phase;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('30. phase not a string → false', () => {
    const state = makeMinimalGameState();
    state.phase = 1;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('31. Missing season → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).season;
    expect(isPlausibleGameState(state)).toBe(false);
  });

  it('32. Missing crowdMood → false', () => {
    const state = makeMinimalGameState();
    delete (state as Record<string, unknown>).crowdMood;
    expect(isPlausibleGameState(state)).toBe(false);
  });
});
