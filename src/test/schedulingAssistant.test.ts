import { describe, it, expect } from 'vitest';
import { FightingStyle, type Warrior, type GameState, type RivalStableData, type Rivalry } from '@/types/game';
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
    career?: { wins: number; losses: number; kills: number }
  ): Warrior => ({
    id: id as any,
    name: `Warrior ${id}`,
    style,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    titles: [],
    injuries: [],
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
});
