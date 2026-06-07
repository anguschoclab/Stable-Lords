import { describe, it, expect } from 'vitest';
import { FightingStyle, type Warrior, type GameState, type RivalStableData, type Rivalry, type FightSummary } from '@/types/game';
import type { InjuryData } from '@/types/warrior.types';
import {
  scoreMatchup,
  getRecommendedChallenges,
  getMatchupsToAvoid,
} from '@/engine/schedulingAssistant';

describe('Scheduling Assistant Engine', () => {
  // Helper to generate minimal mock warrior
  const mockWarrior = (
    id: string,
    style: FightingStyle,
    fame = 0,
    wins = 0,
    losses = 0,
    stableId?: string,
    career?: { wins: number; losses: number; kills: number },
    injuries?: InjuryData[]
  ): Warrior => ({
    id: id as any,
    name: `Warrior ${id}`,
    style,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    titles: [],
    injuries: injuries ?? [],
    flair: [],
    career: career ?? { wins, losses, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    stableId: stableId as any,
    traits: [],
  });

  // Helper to generate minimal state
  const mockState = (rivalWarriors: Warrior[], rivalries: Rivalry[] = []): GameState => {
    const rivalData: RivalStableData[] = [
      {
        id: 'rival1' as any,
        owner: {
          id: 'rival1' as any,
          name: 'Rival Owner',
          stableName: 'Rival Stable',
          fame: 0,
          renown: 0,
          titles: 0,
        },
        fame: 0,
        roster: rivalWarriors,
        treasury: 1000,
      },
    ];

    return {
      meta: { gameName: 'test', version: '1', createdAt: 'now' },
      ftueComplete: true,
      coachDismissed: [],
      player: {
        id: 'p1' as any,
        name: 'Player',
        stableName: 'Player Stable',
        fame: 0,
        renown: 0,
        titles: 0,
      },
      fame: 0,
      popularity: 0,
      treasury: 0,
      ledger: [],
      week: 1,
      year: 1,
      phase: 'planning',
      season: 'Spring',
      weather: 'Clear',
      day: 1,
      isTournamentWeek: false,
      roster: [],
      graveyard: [],
      retired: [],
      arenaHistory: [],
      newsletter: [],
      gazettes: [],
      hallOfFame: [],
      crowdMood: 'Calm',
      tournaments: [],
      trainers: [],
      hiringPool: [],
      trainingAssignments: [],
      seasonalGrowth: [],
      rivals: rivalData,
      scoutReports: [],
      restStates: [],
      rivalries,
      matchHistory: [],
      recruitPool: [],
      rosterBonus: 0,
      ownerGrudges: [],
      insightTokens: [],
      moodHistory: [],
      playerChallenges: [],
      playerAvoids: [],
      isFTUE: false,
      unacknowledgedDeaths: [],
      promoters: {},
      boutOffers: {},
      realmRankings: {},
      awards: [],
    };
  };

  // Helper to generate mock rivalry
  const mockRivalry = (
    stableIdA: string,
    stableIdB: string,
    intensity: number,
    reason: string = 'test'
  ): Rivalry => ({
    id: 'rivalry1' as any,
    stableIdA: stableIdA as any,
    stableIdB: stableIdB as any,
    intensity,
    reason,
    startWeek: 1,
  });

  // Helper to create a mock fight between two warriors
  const mockFightBetween = (
    playerId: string,
    rivalId: string,
    winner: 'A' | 'D',
    week = 1
  ): FightSummary => ({
    id: `fight-${playerId}-${rivalId}-${week}` as any,
    week,
    warriorIdA: playerId as any,
    warriorIdD: rivalId as any,
    stableIdA: 'stable-a' as any,
    stableIdD: 'stable-d' as any,
    styleA: FightingStyle.BashingAttack,
    styleD: FightingStyle.TotalParry,
    winner,
    by: 'KO',
    title: 'Test Match',
    transcript: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  });

  // Helper to populate realmRankings on a state
  const stateWithRankings = (
    state: GameState,
    rankings: Record<string, { overallRank: number; classRank?: number; compositeScore?: number }>
  ): GameState => {
    state.realmRankings = rankings as any;
    return state;
  };

  // Helper to populate arenaHistory on a state
  const stateWithHistory = (state: GameState, fights: FightSummary[]): GameState => {
    state.arenaHistory = fights;
    return state;
  };

  it('should correctly score a favorable style matchup (e.g. TP vs AB)', () => {
    const tp = mockWarrior('tp1', FightingStyle.TotalParry);
    const ab = mockWarrior('ab1', FightingStyle.AimedBlow);

    const state = mockState([ab]);
    const score = scoreMatchup(tp, ab, state);
    // TP vs AB is -1 advantage for TP (from combat.ts matrix). -1 * 25 = -25. Base 100. Total = 75.
    expect(score).toBe(75);
  });

  it('should correctly score an unfavorable style matchup (e.g. AB vs PR)', () => {
    const ab = mockWarrior('ab1', FightingStyle.AimedBlow);
    const pr = mockWarrior('pr1', FightingStyle.ParryRiposte);

    const state = mockState([pr]);
    const score = scoreMatchup(ab, pr, state);
    // AB vs PR = +1 advantage (from combat.ts matrix). +1 * 25 = 25. Base 100. Total = 125.
    expect(score).toBe(125);
  });

  it('should return a sorted list of top challenges for a warrior', () => {
    const p1 = mockWarrior('p1', FightingStyle.TotalParry, 10);

    const r1 = mockWarrior('r1', FightingStyle.AimedBlow, 10); // TP vs AB = -1 -> 75
    const r2 = mockWarrior('r2', FightingStyle.TotalParry, 10); // Advantage 0 -> 100
    const r3 = mockWarrior('r3', FightingStyle.WallOfSteel, 10); // TP vs WS = -1 -> 75

    const state = mockState([r1, r2, r3]);

    const challenges = getRecommendedChallenges(state, p1, 3);

    expect(challenges.length).toBe(3);
    expect(challenges[0]?.rivalWarrior.id).toBe('r2');
    expect(challenges[1]?.rivalWarrior.id).toBe('r1');
    expect(challenges[2]?.rivalWarrior.id).toBe('r3');
  });

  it('should penalize matchups where fame difference is too high', () => {
    const p1 = mockWarrior('p1', FightingStyle.TotalParry, 10);

    const r1 = mockWarrior('r1', FightingStyle.TotalParry, 10); // Diff 0. Penalty 0. Base 100
    const r2 = mockWarrior('r2', FightingStyle.TotalParry, 50); // Diff -40. +10 bump. But abs(diff) = 40. 40 - 20 = 20 penalty. Total penalty = -10. Score = 90

    const state = mockState([r1, r2]);
    const score1 = scoreMatchup(p1, r1, state);
    const score2 = scoreMatchup(p1, r2, state);

    expect(score1).toBeGreaterThan(score2);
  });

  it('should return a sorted list of matchups to avoid', () => {
    const p1 = mockWarrior('p1', FightingStyle.AimedBlow, 10);

    // AB vs PR = -2
    // AB vs PS = -2
    // AB vs BA = +1
    const r1 = mockWarrior('r1', FightingStyle.ParryRiposte, 10);
    const r2 = mockWarrior('r2', FightingStyle.ParryStrike, 10);
    const r3 = mockWarrior('r3', FightingStyle.BashingAttack, 10);

    const state = mockState([r1, r2, r3]);

    const avoid = getMatchupsToAvoid(state, p1, 2);

    expect(avoid.length).toBe(2);
    expect(['r1', 'r2']).toContain(avoid[0]?.rivalWarrior.id);
    expect(['r1', 'r2']).toContain(avoid[1]?.rivalWarrior.id);
  });

  describe('scoreMatchup Edge Cases', () => {
    describe('Data Structure Edge Cases', () => {
      it('handles missing fighting style on player warrior', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry);
        const rival = mockWarrior('r1', FightingStyle.AimedBlow);
        player.style = undefined as any;

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Fallback to 0 style advantage, base score 100
        expect(score).toBe(100);
      });

      it('handles missing fighting style on rival warrior', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry);
        const rival = mockWarrior('r1', FightingStyle.AimedBlow);
        rival.style = undefined as any;

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Fallback to 0 style advantage, base score 100
        expect(score).toBe(100);
      });

      it('handles warrior with 0-0 win/loss record', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Win rate: 0/1 = 0 for both, no bonus/penalty. Base 100.
        expect(score).toBe(100);
      });

      it('handles warrior with missing career data', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0);
        delete (player as any).career;

        const state = mockState([rival]);
        // Should gracefully handle missing career with null checks
        const score = scoreMatchup(player, rival, state);
        // Win rate: 0/1 = 0 for both, no bonus/penalty. Base 100.
        expect(score).toBe(100);
      });

      it('handles missing stableId on warrior with state.player fallback', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0, undefined);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0, 'rival1');
        const rivalry = mockRivalry('p1', 'rival1', 5);

        const state = mockState([rival], [rivalry]);
        const score = scoreMatchup(player, rival, state);
        // Rivalry should be found via state.player.id fallback
        // Base 100 + rivalry bonus (5 * 50 = 250) = 350
        expect(score).toBe(350);
      });

      it('handles missing rivalries array in state', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0);

        const state = mockState([rival], []);
        const score = scoreMatchup(player, rival, state);
        // No rivalry bonus, base score 100
        expect(score).toBe(100);
      });

      it('handles missing state.player with warrior stableId', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0, 'player1');
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0, 'rival1');
        const rivalry = mockRivalry('player1', 'rival1', 5);

        const state = mockState([rival], [rivalry]);
        delete (state as any).player;
        const score = scoreMatchup(player, rival, state);
        // Rivalry should still work via player.stableId
        expect(score).toBe(350);
      });

      it('handles undefined/null state object', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0);

        // Should gracefully handle null state with null check
        const score = scoreMatchup(player, rival, null as any);
        // Returns base score of 100
        expect(score).toBe(100);
      });
    });

    describe('Numerical Boundary Cases', () => {
      it('applies no penalty at fame diff exactly +10', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 20);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 (10 is not > 10)
        expect(score).toBe(100);
      });

      it('applies no bonus at fame diff exactly -10', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 20);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 (-10 is not < -10)
        expect(score).toBe(100);
      });

      it('applies -5 penalty at fame diff exactly +20', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 30);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 - 5 = 95 (fameDiff > 10 is true)
        expect(score).toBe(95);
      });

      it('applies -1 penalty at fame diff just above +20', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 31);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 - (21 - 20) = 99
        expect(score).toBe(99);
      });

      it('applies +10 bonus at fame diff exactly -20', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 30);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + 10 = 110 (fameDiff < -10 is true)
        expect(score).toBe(110);
      });

      it('applies no penalty/bonus in middle range (0-10)', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 15);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 (diff = 5, neither condition met)
        expect(score).toBe(100);
      });

      it('applies -5 penalty in middle range (10-20)', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 25);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 - 5 = 95 (diff = 15, fameDiff > 10)
        expect(score).toBe(95);
      });

      it('handles negative fame values correctly', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, -10);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, -20);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Diff = 10, no penalty (10 is not > 10). Base 100
        expect(score).toBe(100);
      });

      it('handles extreme positive fame difference', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 1000);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 0);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Diff = 1000, penalty = 1000 - 20 = 980. Base 100 - 980 = -880
        expect(score).toBe(-880);
      });

      it('handles extreme negative fame difference', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 0);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 1000);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Diff = -1000, abs = 1000 > 20, penalty = 1000 - 20 = 980. Base 100 - 980 = -880
        expect(score).toBe(-880);
      });

      it('handles both warriors with zero fame', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 0);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 0);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100
        expect(score).toBe(100);
      });
    });

    describe('Rivalry Edge Cases', () => {
      it('applies no bonus with rivalry intensity = 0', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0, 'player1');
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0, 'rival1');
        const rivalry = mockRivalry('player1', 'rival1', 0);

        const state = mockState([rival], [rivalry]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + (0 * 50) = 100
        expect(score).toBe(100);
      });

      it('applies negative bonus with negative rivalry intensity', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0, 'player1');
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0, 'rival1');
        const rivalry = mockRivalry('player1', 'rival1', -2);

        const state = mockState([rival], [rivalry]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + (-2 * 50) = 0
        expect(score).toBe(0);
      });

      it('applies large bonus with maximum rivalry intensity', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0, 'player1');
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0, 'rival1');
        const rivalry = mockRivalry('player1', 'rival1', 10);

        const state = mockState([rival], [rivalry]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + (10 * 50) = 600
        expect(score).toBe(600);
      });

      it('applies fractional bonus with fractional rivalry intensity', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0, 'player1');
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0, 'rival1');
        const rivalry = mockRivalry('player1', 'rival1', 0.5);

        const state = mockState([rival], [rivalry]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + (0.5 * 50) = 125
        expect(score).toBe(125);
      });

      it('applies only matching rivalry when multiple exist', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0, 'player1');
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0, 'rival1');
        const rivalry1 = mockRivalry('player1', 'rival1', 5);
        const rivalry2 = mockRivalry('other1', 'other2', 10);

        const state = mockState([rival], [rivalry1, rivalry2]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + (5 * 50) = 350 (only matching rivalry applied)
        expect(score).toBe(350);
      });

      it('applies first rivalry when both match', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0, 'player1');
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0, 'rival1');
        const rivalry1 = mockRivalry('player1', 'rival1', 3);
        const rivalry2 = mockRivalry('player1', 'rival1', 7);

        const state = mockState([rival], [rivalry1, rivalry2]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + (3 * 50) = 250 (first rivalry in array)
        expect(score).toBe(250);
      });

      it('allows rivalry with same stableId on both sides', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0, 'stable1');
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0, 'stable1');
        const rivalry = mockRivalry('stable1', 'stable1', 5);

        const state = mockState([rival], [rivalry]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + (5 * 50) = 350 (self-rivalry allowed)
        expect(score).toBe(350);
      });
    });

    describe('Win Rate Edge Cases', () => {
      it('applies +20 bonus for perfect win rate', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 10, 0);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 10);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + ((1.0 - 0.0) * 20) = 120
        expect(score).toBe(120);
      });

      it('applies -20 penalty for zero win rate', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 10);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 10, 0);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + ((0.0 - 1.0) * 20) = 80
        expect(score).toBe(80);
      });

      it('applies no bonus/penalty for equal win rates', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + ((0.5 - 0.5) * 20) = 100
        expect(score).toBe(100);
      });

      it('handles large win/loss counts correctly', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 100, 50);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 50, 100);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Player win rate: 100/150 = 0.667, Rival: 50/150 = 0.333
        // Base 100 + ((0.667 - 0.333) * 20) = 100 + 6.68 = 106.68
        expect(score).toBeCloseTo(106.68, 1);
      });

      it('applies -10 penalty when player has no fights', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 0, 0);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 10, 10);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Player win rate: 0/1 = 0, Rival: 10/20 = 0.5
        // Base 100 + ((0.0 - 0.5) * 20) = 90
        expect(score).toBe(90);
      });

      it('applies +10 bonus when rival has no fights', () => {
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 10, 10);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 0, 0);

        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Player win rate: 10/20 = 0.5, Rival: 0/1 = 0
        // Base 100 + ((0.5 - 0.0) * 20) = 110
        expect(score).toBe(110);
      });
    });

    describe('Style Matrix Exhaustive Tests', () => {
      it('applies 0 style advantage for same style matchups', () => {
        const styles = Object.values(FightingStyle);
        styles.forEach((style) => {
          const player = mockWarrior('p1', style, 10, 0, 0);
          const rival = mockWarrior('r1', style, 10, 0, 0);
          const state = mockState([rival]);
          const score = scoreMatchup(player, rival, state);
          // Diagonal of matrix is always 0
          expect(score).toBe(100);
        });
      });

      it('applies +50 bonus for maximum positive style advantage', () => {
        // AimedBlow vs WallOfSteel is +2 in combat.ts matrix
        const player = mockWarrior('p1', FightingStyle.AimedBlow, 10, 0, 0);
        const rival = mockWarrior('r1', FightingStyle.WallOfSteel, 10, 0, 0);
        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + (2 * 25) = 150
        expect(score).toBe(150);
      });

      it('applies -100 penalty for maximum negative style advantage', () => {
        // WallOfSteel vs AimedBlow is -4 in combat.ts matrix
        const player = mockWarrior('p1', FightingStyle.WallOfSteel, 10, 0, 0);
        const rival = mockWarrior('r1', FightingStyle.AimedBlow, 10, 0, 0);
        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + (-4 * 25) = 0
        expect(score).toBe(0);
      });
    });

    describe('Integration Edge Cases', () => {
      it('calculates minimum possible score with worst factors', () => {
        // Worst style: WallOfSteel vs AimedBlow (-4)
        // Worst fame: player 1000, rival 0 (diff 1000, penalty 980)
        // Worst win rate: player 0-10, rival 10-0 (diff -1.0, penalty -20)
        // No rivalry
        const player = mockWarrior('p1', FightingStyle.WallOfSteel, 1000, 0, 10);
        const rival = mockWarrior('r1', FightingStyle.AimedBlow, 0, 10, 0);
        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 - 100 - 980 - 20 = -1000
        expect(score).toBe(-1000);
      });

      it('calculates maximum possible score with best factors', () => {
        // Best style: AimedBlow vs WallOfSteel (+2)
        // Best fame: player 20, rival 10 (diff +10, no penalty since not > 10)
        // Best win rate: player 10-0, rival 0-10 (diff 1.0, bonus +20)
        // Max rivalry: intensity 10
        const player = mockWarrior('p1', FightingStyle.AimedBlow, 20, 10, 0, 'player1');
        const rival = mockWarrior('r1', FightingStyle.WallOfSteel, 10, 0, 10, 'rival1');
        const rivalry = mockRivalry('player1', 'rival1', 10);
        const state = mockState([rival], [rivalry]);
        const score = scoreMatchup(player, rival, state);
        // Base 100 + 50 + 0 + 20 + 500 = 670
        expect(score).toBe(670);
      });

      it('calculates neutral baseline with equal factors', () => {
        // Same style, same fame, same win rate, no rivalry
        const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
        const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
        const state = mockState([rival]);
        const score = scoreMatchup(player, rival, state);
        // Base 100
        expect(score).toBe(100);
      });
    });
  });

  describe('Rank-Based Scoring', () => {
    it('prefers close-ranked opponent over distant-ranked', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const closeRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const farRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([closeRival, farRival]);
      state = stateWithRankings(state, {
        p1: { overallRank: 5 },
        r1: { overallRank: 6 },
        r2: { overallRank: 60 },
      });

      const scoreClose = scoreMatchup(player, closeRival, state);
      const scoreFar = scoreMatchup(player, farRival, state);

      // Close rank (diff=1) gets +15, far rank (diff=55) gets -10
      expect(scoreClose).toBeGreaterThan(scoreFar);
      expect(scoreClose - scoreFar).toBe(25);
    });

    it('penalizes rank mismatch', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const reasonableRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const mismatchRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([reasonableRival, mismatchRival]);
      state = stateWithRankings(state, {
        p1: { overallRank: 5 },
        r1: { overallRank: 14 },
        r2: { overallRank: 50 },
      });

      const scoreReasonable = scoreMatchup(player, reasonableRival, state);
      const scoreMismatch = scoreMatchup(player, mismatchRival, state);

      // Reasonable (diff=9) gets +5, mismatch (diff=45) gets -10
      expect(scoreReasonable).toBeGreaterThan(scoreMismatch);
      expect(scoreReasonable - scoreMismatch).toBe(15);
    });

    it('handles missing realmRankings gracefully', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);

      const state = mockState([rival]); // realmRankings is {}

      const score = scoreMatchup(player, rival, state);
      // No crash, base score 100 (same style/fame/career, no rivalry)
      expect(score).toBe(100);
    });
  });

  describe('History-Based Scoring', () => {
    it('boosts opponent who defeated player previously (grudge match)', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const grudgeRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const neutralRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([grudgeRival, neutralRival]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'D', 1), // rival won
        mockFightBetween('other', 'also_other', 'A', 1), // filler to make arenaHistory non-empty
      ]);
      state.week = 10; // push forward so fight is not "recent"

      const scoreGrudge = scoreMatchup(player, grudgeRival, state);
      const scoreNeutral = scoreMatchup(player, neutralRival, state);

      // Grudge: base + 10 = base + 10. Neutral: base + 3 (novelty) = base + 3
      expect(scoreGrudge).toBeGreaterThan(scoreNeutral);
      expect(scoreGrudge - scoreNeutral).toBe(7);
    });

    it('slightly boosts opponent player previously beat (momentum)', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const beatenRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const neutralRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([beatenRival, neutralRival]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'A', 1), // player won
        mockFightBetween('other', 'also_other', 'A', 1),
      ]);
      state.week = 10;

      const scoreBeaten = scoreMatchup(player, beatenRival, state);
      const scoreNeutral = scoreMatchup(player, neutralRival, state);

      // Beaten: base + 5. Neutral: base + 3
      expect(scoreBeaten).toBeGreaterThan(scoreNeutral);
      expect(scoreBeaten - scoreNeutral).toBe(2);
    });

    it('penalizes repetitive farm matchups', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const farmRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const neutralRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([farmRival, neutralRival]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'A', 1),
        mockFightBetween('p1', 'r1', 'A', 2),
        mockFightBetween('p1', 'r1', 'A', 3),
        mockFightBetween('other', 'also_other', 'A', 1),
      ]);
      state.week = 10;

      const scoreFarm = scoreMatchup(player, farmRival, state);
      const scoreNeutral = scoreMatchup(player, neutralRival, state);

      // Farm: base + 5 (last winner player) - 5 (farm penalty) = base + 0
      // Neutral: base + 3 (novelty)
      expect(scoreNeutral).toBeGreaterThan(scoreFarm);
      expect(scoreNeutral - scoreFarm).toBe(3);
    });

    it('penalizes curb stomp matchups', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const curbRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const neutralRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([curbRival, neutralRival]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'D', 1),
        mockFightBetween('p1', 'r1', 'D', 2),
        mockFightBetween('p1', 'r1', 'D', 3),
        mockFightBetween('other', 'also_other', 'A', 1),
      ]);
      state.week = 10;

      const scoreCurb = scoreMatchup(player, curbRival, state);
      const scoreNeutral = scoreMatchup(player, neutralRival, state);

      // Curb: base + 10 (last winner rival) - 15 (curb stomp) = base - 5
      // Neutral: base + 3 (novelty)
      expect(scoreNeutral).toBeGreaterThan(scoreCurb);
      expect(scoreNeutral - scoreCurb).toBe(8);
    });

    it('gives novelty bonus to never-fought opponents', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const rivalA = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const rivalB = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([rivalA, rivalB]);
      // arenaHistory has fights but none involving these warriors
      state = stateWithHistory(state, [
        mockFightBetween('other1', 'other2', 'A', 1),
        mockFightBetween('other3', 'other4', 'D', 2),
      ]);

      const scoreA = scoreMatchup(player, rivalA, state);
      const scoreB = scoreMatchup(player, rivalB, state);

      // Both get +3 novelty since they never fought the player
      expect(scoreA).toBe(scoreB);
      expect(scoreA).toBe(103); // base 100 + 3 novelty
    });

    it('handles empty arenaHistory gracefully', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);

      const state = mockState([rival]); // arenaHistory is []

      const score = scoreMatchup(player, rival, state);
      // No crash, no history modifier
      expect(score).toBe(100);
    });
  });

  describe('Integration: Rank + History + Existing Factors', () => {
    it('ranks correctly when all factors differ', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 20, 5, 5);
      // r1: close rank + player beat them before + same style = strong recommendation
      // r2: far rank + lost to them + bad style = weak recommendation
      const r1 = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const r2 = mockWarrior('r2', FightingStyle.WallOfSteel, 10, 5, 5);

      let state = mockState([r1, r2]);
      state = stateWithRankings(state, {
        p1: { overallRank: 5 },
        r1: { overallRank: 6 },
        r2: { overallRank: 50 },
      });
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'A', 1), // player won
        mockFightBetween('p1', 'r2', 'D', 1), // rival won
      ]);
      state.week = 10;

      const challenges = getRecommendedChallenges(state, player, 2);

      expect(challenges.length).toBe(2);
      expect(challenges[0]?.rivalWarrior.id).toBe('r1');
      expect(challenges[1]?.rivalWarrior.id).toBe('r2');
    });

    it('notes include rank and history context', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([rival]);
      state = stateWithRankings(state, {
        p1: { overallRank: 5 },
        r1: { overallRank: 6 },
      });
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'A', 1),
      ]);
      state.week = 10;

      const challenges = getRecommendedChallenges(state, player, 1);

      expect(challenges.length).toBe(1);
      const notes = challenges[0]?.notes ?? [];
      expect(notes).toContain('Close rank matchup — competitive bout!');
      expect(notes).toContain('Favorable history — you\'ve beaten them before.');
    });

    it('getMatchupsToAvoid includes historically dominated opponent', () => {
      const player = mockWarrior('p1', FightingStyle.AimedBlow, 10, 5, 5);
      // r1: curb stomp record + bad style matchup
      // r2: neutral
      // r3: neutral
      const r1 = mockWarrior('r1', FightingStyle.ParryRiposte, 10, 5, 5);
      const r2 = mockWarrior('r2', FightingStyle.BashingAttack, 10, 5, 5);
      const r3 = mockWarrior('r3', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([r1, r2, r3]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'D', 1),
        mockFightBetween('p1', 'r1', 'D', 2),
        mockFightBetween('p1', 'r1', 'D', 3),
      ]);
      state.week = 10;

      const avoid = getMatchupsToAvoid(state, player, 2);

      expect(avoid.length).toBe(2);
      // r1 should be the most avoided (bad style + curb stomp penalty)
      expect(avoid[0]?.rivalWarrior.id).toBe('r1');
    });

    it('recommends higher-ranked rival when all else equal', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const highRankRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const lowRankRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([highRankRival, lowRankRival]);
      state = stateWithRankings(state, {
        p1: { overallRank: 10 },
        r1: { overallRank: 8 },  // higher rank than player
        r2: { overallRank: 50 }, // much lower rank
      });

      const challenges = getRecommendedChallenges(state, player, 2);

      // Both have close rank diff: |10-8|=2 -> +15, |10-50|=40 -> -10
      expect(challenges[0]?.rivalWarrior.id).toBe('r1');
    });
  });

  describe('getMatchupsToAvoid Injury Exclusion', () => {
    it('excludes rivals with Severe injury and weeksRemaining > 2', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const injuredRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5, 'rival1', undefined, [
        { id: 'inj1' as any, name: 'Broken Arm', description: '', severity: 'Severe', weeksRemaining: 3, penalties: {} },
      ]);
      const healthyRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      const state = mockState([injuredRival, healthyRival]);
      const avoid = getMatchupsToAvoid(state, player, 3);

      expect(avoid.length).toBe(1);
      expect(avoid[0]?.rivalWarrior.id).toBe('r2');
    });

    it('includes rivals with Moderate injuries', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const injuredRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5, 'rival1', undefined, [
        { id: 'inj1' as any, name: 'Concussion', description: '', severity: 'Moderate', weeksRemaining: 4, penalties: {} },
      ]);

      const state = mockState([injuredRival]);
      const avoid = getMatchupsToAvoid(state, player, 1);

      expect(avoid.length).toBe(1);
      expect(avoid[0]?.rivalWarrior.id).toBe('r1');
    });

    it('includes rivals with Severe injury at exactly 2 weeks remaining', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const injuredRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5, 'rival1', undefined, [
        { id: 'inj1' as any, name: 'Skull Fracture', description: '', severity: 'Severe', weeksRemaining: 2, penalties: {} },
      ]);

      const state = mockState([injuredRival]);
      const avoid = getMatchupsToAvoid(state, player, 1);

      expect(avoid.length).toBe(1);
      expect(avoid[0]?.rivalWarrior.id).toBe('r1');
    });

    it('excludes rivals with Critical injuries (>2 weeks)', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const injuredRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5, 'rival1', undefined, [
        { id: 'inj1' as any, name: 'Critical Wound', description: '', severity: 'Critical', weeksRemaining: 10, penalties: {} },
      ]);

      const state = mockState([injuredRival]);
      const avoid = getMatchupsToAvoid(state, player, 1);

      expect(avoid.length).toBe(0);
    });
  });

  describe('getMatchupsToAvoid Recency Penalty', () => {
    it('penalizes and flags recent rematch within 1 week', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const recentRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const neutralRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([recentRival, neutralRival]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'A', 4),
      ]);
      state.week = 5;

      const avoid = getMatchupsToAvoid(state, player, 2);

      const recentEntry = avoid.find((a) => a.rivalWarrior.id === 'r1');
      expect(recentEntry).toBeDefined();
      expect(recentEntry!.notes).toContain('Recent rematch — fought within last 2 weeks.');
    });

    it('penalizes and flags recent rematch within 2 weeks', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const recentRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const neutralRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([recentRival, neutralRival]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'A', 3),
      ]);
      state.week = 5;

      const avoid = getMatchupsToAvoid(state, player, 2);

      const recentEntry = avoid.find((a) => a.rivalWarrior.id === 'r1');
      expect(recentEntry).toBeDefined();
      expect(recentEntry!.notes).toContain('Recent rematch — fought within last 2 weeks.');
    });

    it('does not penalize rematch older than 2 weeks', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const oldRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const neutralRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([oldRival, neutralRival]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'A', 2),
      ]);
      state.week = 5;

      const avoid = getMatchupsToAvoid(state, player, 2);

      const oldEntry = avoid.find((a) => a.rivalWarrior.id === 'r1');
      expect(oldEntry).toBeDefined();
      expect(oldEntry!.notes).not.toContain('Recent rematch — fought within last 2 weeks.');
    });

    it('promotes recent rematch into avoid list over otherwise equal rival', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const recentRival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);
      const neutralRival = mockWarrior('r2', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([recentRival, neutralRival]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'A', 4),
      ]);
      state.week = 5;

      const avoid = getMatchupsToAvoid(state, player, 1);

      expect(avoid.length).toBe(1);
      expect(avoid[0]?.rivalWarrior.id).toBe('r1');
    });
  });

  describe('scoreMatchup Recency Edge Cases', () => {
    it('applies -15 recency penalty for fight within last 2 weeks', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([rival]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'A', 4),
      ]);
      state.week = 5;

      const score = scoreMatchup(player, rival, state);
      // Base 100 + 5 (last winner player) - 15 (recency) = 90
      expect(score).toBe(90);
    });

    it('applies no recency penalty when last fight was 3+ weeks ago', () => {
      const player = mockWarrior('p1', FightingStyle.TotalParry, 10, 5, 5);
      const rival = mockWarrior('r1', FightingStyle.TotalParry, 10, 5, 5);

      let state = mockState([rival]);
      state = stateWithHistory(state, [
        mockFightBetween('p1', 'r1', 'A', 2),
      ]);
      state.week = 5;

      const score = scoreMatchup(player, rival, state);
      // Base 100 + 5 (last winner player) = 105
      expect(score).toBe(105);
    });
  });
});
