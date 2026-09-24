import { describe, it, expect } from 'vitest';
import { evaluateCampaignFocus } from '@/engine/advisor/campaignFocusEvaluator';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';

const mkWarrior = (overrides: Partial<Warrior> = {}): Warrior => ({
  id: 'w1' as any,
  name: 'Marcus',
  style: FightingStyle.LungingAttack,
  attributes: { ST: 14, CN: 12, SZ: 11, WT: 12, WL: 10, SP: 14, DF: 10 },
  fame: 50,
  popularity: 20,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 4, losses: 1, kills: 0 },
  champion: false,
  status: 'Active',
  traits: [],
  ...overrides,
});

const mkState = (overrides: Partial<GameState> = {}): GameState =>
  ({
    week: 5,
    absoluteWeek: 5,
    year: 1,
    season: 'Spring',
    roster: [],
    realmRankings: {},
    boutOffers: {},
    tournaments: [],
    isTournamentWeek: false,
    ...overrides,
  }) as unknown as GameState;

describe('evaluateCampaignFocus', () => {
  it('honors a player-pinned campaign focus if set', () => {
    const warrior = mkWarrior({ campaignFocus: 'PURSE_HUNTER' });
    const state = mkState();
    const focus = evaluateCampaignFocus(warrior, state);
    expect(focus).toBe('PURSE_HUNTER');
  });

  it('assigns REHABILITATION if warrior has moderate, severe, or critical injury', () => {
    const warrior = mkWarrior({
      injuries: [
        {
          id: 'inj1' as any,
          name: 'Torn Muscle',
          description: '',
          severity: 'Moderate',
          weeksRemaining: 2,
          penalties: {},
        },
      ],
    });
    const state = mkState();
    expect(evaluateCampaignFocus(warrior, state)).toBe('REHABILITATION');
  });

  it('assigns REHABILITATION if warrior fatigue is 40 or greater', () => {
    const warrior = mkWarrior({ fatigue: 45 });
    const state = mkState();
    expect(evaluateCampaignFocus(warrior, state)).toBe('REHABILITATION');
  });

  it('assigns VETERAN_TWILIGHT for aging fighters over 25 with substantial careers', () => {
    const warrior = mkWarrior({
      age: 28,
      career: { wins: 18, losses: 6, kills: 2 },
    });
    const state = mkState();
    expect(evaluateCampaignFocus(warrior, state)).toBe('VETERAN_TWILIGHT');
  });

  it('assigns TOURNAMENT_PUSH for ranked contenders during seasonal tournament prep (weeks 10-13)', () => {
    const warrior = mkWarrior({ id: 'contender1' as any, career: { wins: 8, losses: 2, kills: 1 } });
    const state = mkState({
      week: 11, // prep window (weeks 11-12)
      realmRankings: {
        contender1: { overallRank: 42, classRank: 5, compositeScore: 120 },
      } as any,
    });
    expect(evaluateCampaignFocus(warrior, state)).toBe('TOURNAMENT_PUSH');
  });

  it('assigns PROSPECT_DEV for young warriors with few bouts and room to grow', () => {
    const warrior = mkWarrior({
      age: 18,
      career: { wins: 1, losses: 0, kills: 0 },
      potential: { ST: 18, CN: 16, SZ: 11, WT: 14, WL: 12, SP: 18, DF: 14 },
    });
    const state = mkState({ week: 4 });
    expect(evaluateCampaignFocus(warrior, state)).toBe('PROSPECT_DEV');
  });

  it('assigns PURSE_HUNTER as standard focus for prime uninjured fighters', () => {
    const warrior = mkWarrior({
      age: 22,
      career: { wins: 6, losses: 2, kills: 0 },
    });
    const state = mkState({ week: 4 });
    expect(evaluateCampaignFocus(warrior, state)).toBe('PURSE_HUNTER');
  });
});
