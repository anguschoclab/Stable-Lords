import { describe, it, expect } from 'vitest';
import { clearReconstructionCache, reconstructGameState } from '@/state/serialization';

describe('#8c clearReconstructionCache invalidates cached result', () => {
  it('returns a fresh result after cache is cleared', () => {
    const mockStore: any = {
      treasury: 1000,
      ledger: [],
      roster: [],
      graveyard: [],
      retired: [],
      recruitPool: [],
      insightTokens: [],
      arenaHistory: [],
      player: { id: 'p1', name: 'Test', stableName: 'Test', crest: {}, generation: 0 },
      week: 1,
      day: 0,
      season: 'Spring',
      weather: 'Clear',
      promoters: {},
      boutOffers: {},
      rivals: [],
      gazettes: [],
      scoutReports: [],
      unacknowledgedDeaths: [],
      rosterBonus: 0,
      tournaments: [],
      isTournamentWeek: false,
      activeTournamentId: null,
      year: 1,
      popularity: 0,
      fame: 0,
      realmRankings: {},
      awards: [],
      trainers: [],
      hiringPool: [],
      trainingAssignments: [],
      seasonalGrowth: [],
      restStates: [],
      crowdMood: 'Neutral',
      moodHistory: [],
      newsletter: [],
      hallOfFame: [],
      isFTUE: false,
      ftueStep: 0,
      ftueComplete: false,
      coachDismissed: [],
      rivalries: [],
      matchHistory: [],
      ownerGrudges: [],
      phase: 'planning',
      playerChallenges: [],
      playerAvoids: [],
      bookmarks: [],
      lastSavedAt: null,
    };

    const result1 = reconstructGameState(mockStore);
    clearReconstructionCache();
    mockStore.treasury = 2000;
    const result2 = reconstructGameState(mockStore);

    expect(result2.treasury).toBe(2000);
    expect(result1).not.toBe(result2);
  });
});
