import { describe, it, expect } from 'vitest';
import { evaluateTournamentAdvice } from '@/engine/advisor/tournamentAdvisor';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, TournamentEntry } from '@/types/state.types';

const mkWarrior = (id = 'w1'): Warrior => ({
  id,
  name: 'Marcus',
  style: FightingStyle.WallOfSteel,
  attributes: { ST: 14, CN: 14, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 },
  fame: 100,
  popularity: 50,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 10, losses: 2, kills: 0 },
  champion: false,
  status: 'Active',
  traits: [],
});

const mkState = (overrides: Partial<GameState> = {}): GameState =>
  ({
    week: 6,
    absoluteWeek: 6,
    year: 1,
    season: 'Spring',
    roster: [],
    realmRankings: {},
    tournaments: [],
    isTournamentWeek: false,
    ...overrides,
  }) as unknown as GameState;

describe('evaluateTournamentAdvice', () => {
  it('maps rank 1-64 to Imperial Gold Cup with QUALIFYING status in mid-season', () => {
    const warrior = mkWarrior('w1');
    const state = mkState({
      week: 5,
      realmRankings: {
        w1: { overallRank: 12, classRank: 2, compositeScore: 240 },
      },
    });

    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.qualifiedTier).toBe('Gold');
    expect(advice.tierName).toBe('Imperial Gold Cup');
    expect(advice.overallRank).toBe(12);
    expect(advice.status).toBe('QUALIFYING');
    expect(advice.weeksUntilTournament).toBe(8); // 13 - 5 = 8
    expect(advice.headline).toContain('Imperial Gold Cup');
  });

  it('maps rank 65-128 to Proconsul Silver Plate', () => {
    const warrior = mkWarrior('w2');
    const state = mkState({
      week: 4,
      realmRankings: {
        w2: { overallRank: 95, classRank: 10, compositeScore: 150 },
      },
    });

    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.qualifiedTier).toBe('Silver');
    expect(advice.tierName).toBe('Proconsul Silver Plate');
  });

  it('maps rank 129-192 to Steel Bronze Gauntlet', () => {
    const warrior = mkWarrior('w3');
    const state = mkState({
      week: 4,
      realmRankings: {
        w3: { overallRank: 140, classRank: 14, compositeScore: 110 },
      },
    });

    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.qualifiedTier).toBe('Bronze');
    expect(advice.tierName).toBe('Steel Bronze Gauntlet');
  });

  it('maps rank 193-256 to Foundry Iron Trials', () => {
    const warrior = mkWarrior('w4');
    const state = mkState({
      week: 4,
      realmRankings: {
        w4: { overallRank: 210, classRank: 22, compositeScore: 80 },
      },
    });

    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.qualifiedTier).toBe('Iron');
    expect(advice.tierName).toBe('Foundry Iron Trials');
  });

  it('reports NONE status if unranked or rank exceeds 256', () => {
    const warrior = mkWarrior('w5');
    const state = mkState({
      week: 4,
      realmRankings: {
        w5: { overallRank: 280, classRank: 30, compositeScore: 40 },
      },
    });

    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.qualifiedTier).toBeNull();
    expect(advice.status).toBe('NONE');
  });

  it('triggers CONTENDER_REST during weeks 11-12 for qualified warriors', () => {
    const warrior = mkWarrior('w1');
    const state = mkState({
      week: 11, // 2 weeks until tournament
      realmRankings: {
        w1: { overallRank: 30, classRank: 4, compositeScore: 200 },
      },
    });

    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.status).toBe('CONTENDER_REST');
    expect(advice.weeksUntilTournament).toBe(2);
    expect(advice.headline).toContain('Rest & Taper');
    expect(advice.details).toContain('taper fights');
  });

  it('triggers ACTIVE_ROUND when isTournamentWeek is true and warrior is a participant', () => {
    const warrior = mkWarrior('w1');
    const mockTournament: TournamentEntry = {
      id: 'tour_1',
      season: 'Spring',
      week: 13,
      tierId: 'Gold',
      name: 'Imperial Gold Cup',
      bracket: [],
      participants: [warrior],
      completed: false,
    };
    const state = mkState({
      week: 13,
      isTournamentWeek: true,
      tournaments: [mockTournament],
      realmRankings: {
        w1: { overallRank: 25, classRank: 3, compositeScore: 210 },
      },
    });

    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.status).toBe('ACTIVE_ROUND');
    expect(advice.isParticipant).toBe(true);
    expect(advice.headline).toContain('Live Bracket');
  });
});
