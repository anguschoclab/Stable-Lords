import { describe, it, expect } from 'vitest';
import '@/test/_setup/setup';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import type { GameState } from '@/types/state.types';
import { FightingStyle, type StableId, type WarriorId } from '@/types/shared.types';

function makeWarrior(id: string, style: FightingStyle, fame: number, wins: number, losses: number, kills: number) {
  return {
    id: id as WarriorId,
    name: `Warrior ${id}`,
    style,
    fame,
    career: { wins, losses, kills },
    stableId: 'stable-player' as StableId,
    status: 'Active',
    age: 25,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    isAlive: true,
    isRetired: false,
  } as any;
}

function makeState(warriors: any[]): GameState {
  return {
    treasury: 1000,
    fame: 50,
    week: 1,
    year: 1,
    absoluteWeek: 1,
    season: 'Spring',
    weather: 'Clear',
    day: 0,
    roster: warriors.filter((w) => w.stableId === 'stable-player'),
    rivals: [
      {
        id: 'rival-1' as StableId,
        fame: 100,
        treasury: 1000,
        owner: { id: 'owner-1' as StableId, name: 'Rival', stableName: 'Rival Stable', personality: 'Aggressive', backstoryId: 'bs1', fame: 100, renown: 10, titles: 0, age: 40, generation: 0 },
        roster: warriors.filter((w) => w.stableId === 'rival-1'),
        ledger: [],
        trainingAssignments: [],
      },
    ],
    newsletter: [],
    ledger: [],
    arenaHistory: [],
    graveyard: [],
    retired: [],
    hallOfFame: [],
    matchHistory: [],
    moodHistory: [],
    scoutReports: [],
    insightTokens: [],
    playerChallenges: [],
    playerAvoids: [],
    coachDismissed: [],
    restStates: [],
    unacknowledgedDeaths: [],
    awards: [],
    seasonalGrowth: [],
    recruitPool: [],
    tournaments: [],
    realmRankings: {},
    boutOffers: {},
    promoters: {},
    trainers: [],
    hiringPool: [],
    gazettes: [],
    ownerGrudges: [],
    rivalries: [],
    trainingAssignments: [],
    isTournamentWeek: false,
    activeTournamentId: undefined,
    crowdMood: 'Calm',
    player: {
      id: 'stable-player' as StableId,
      name: 'You',
      stableName: "Dragon's Hearth",
      fame: 0,
      renown: 0,
      titles: 0,
    },
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
  } as any;
}

describe('RankingsPass sort behavior', () => {
  it('produces correct overall ranks sorted by score descending', () => {
    const warriors = [
      makeWarrior('w1', FightingStyle.StrikingAttack, 100, 10, 0, 5),  // score = 100 + 100 + 250 = 450
      makeWarrior('w2', FightingStyle.StrikingAttack, 50, 5, 5, 2),   // score = 50 + 50 + 100 = 200
      makeWarrior('w3', FightingStyle.BashingAttack, 200, 20, 0, 10), // score = 200 + 100 + 500 = 800
    ];

    const state = makeState(warriors);
    const impact = runRankingsPass(state);
    const rankings = impact.realmRankings as any;

    expect(rankings['w1'].overallRank).toBe(2);
    expect(rankings['w2'].overallRank).toBe(3);
    expect(rankings['w3'].overallRank).toBe(1);
  });

  it('produces correct class ranks within each style', () => {
    const warriors = [
      makeWarrior('w1', FightingStyle.StrikingAttack, 100, 10, 0, 5),  // score = 450
      makeWarrior('w2', FightingStyle.StrikingAttack, 50, 5, 5, 2),   // score = 200
      makeWarrior('w3', FightingStyle.BashingAttack, 200, 20, 0, 10), // score = 800
      makeWarrior('w4', FightingStyle.BashingAttack, 10, 0, 10, 0),   // score = 10
    ];

    const state = makeState(warriors);
    const impact = runRankingsPass(state);
    const rankings = impact.realmRankings as any;

    // Striking: w1 (rank 1), w2 (rank 2)
    expect(rankings['w1'].classRank).toBe(1);
    expect(rankings['w2'].classRank).toBe(2);
    // Bashing: w3 (rank 1), w4 (rank 2)
    expect(rankings['w3'].classRank).toBe(1);
    expect(rankings['w4'].classRank).toBe(2);
  });

  it('handles empty roster gracefully', () => {
    const state = makeState([]);
    const impact = runRankingsPass(state);
    expect(impact.realmRankings).toBeDefined();
    expect(Object.keys(impact.realmRankings || {})).toHaveLength(0);
  });
});
