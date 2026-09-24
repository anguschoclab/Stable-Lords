import { describe, it, expect } from 'vitest';
import { evaluateBoutOffers } from '@/engine/advisor/boutOfferAdvisor';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, BoutOffer, Promoter } from '@/types/state.types';
import type { WarriorTournamentAdvice } from '@/engine/advisor/types';

const mkWarrior = (id: string, style: FightingStyle = FightingStyle.LungingAttack, over: Partial<Warrior> = {}): Warrior => ({
  id,
  name: `Warrior_${id}`,
  style,
  attributes: { ST: 14, CN: 14, SZ: 11, WT: 12, WL: 11, SP: 14, DF: 11 },
  fame: 60,
  popularity: 30,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 5, losses: 1, kills: 0 },
  champion: false,
  status: 'Active',
  traits: [],
  ...over,
});

const mkOffer = (
  id: string,
  warriorIdA: string,
  warriorIdB: string,
  over: Partial<BoutOffer> = {}
): BoutOffer => ({
  id,
  promoterId: 'promoter_1',
  warriorIds: [warriorIdA, warriorIdB],
  boutWeek: 6,
  createdAbsoluteWeek: 5,
  expirationWeek: 6,
  purse: 180,
  hype: 20,
  status: 'Proposed',
  responses: { [warriorIdA]: 'Pending', [warriorIdB]: 'Pending' },
  ...over,
});

const mkState = (over: Partial<GameState> = {}): GameState =>
  ({
    week: 5,
    absoluteWeek: 5,
    year: 1,
    season: 'Spring',
    weather: 'Clear',
    roster: [],
    rivals: [],
    promoters: {
      promoter_1: { id: 'promoter_1', name: 'Cassius', personality: 'Honorable', tier: 'Regional' } as unknown as Promoter,
      promoter_sadistic: { id: 'promoter_sadistic', name: 'Nero', personality: 'Sadistic', tier: 'Regional' } as unknown as Promoter,
    },
    boutOffers: {},
    tournaments: [],
    isTournamentWeek: false,
    ...over,
  }) as unknown as GameState;

describe('evaluateBoutOffers', () => {
  it('blocks combat when warrior has moderate, severe, or critical injury', () => {
    const warrior = mkWarrior('p1', FightingStyle.LungingAttack, {
      injuries: [
        {
          id: 'i1',
          name: 'Fractured Rib',
          description: '',
          severity: 'Severe',
          weeksRemaining: 3,
          penalties: {},
        },
      ],
    });
    const rival = mkWarrior('r1', FightingStyle.TotalParry);
    const offer = mkOffer('offer_1', 'p1', 'r1');
    const state = mkState({
      roster: [warrior],
      rivals: [{ id: 'rival_stable', roster: [rival], owner: { stableName: 'Rivals' } } as any],
      boutOffers: { offer_1: offer },
    });

    const advice = evaluateBoutOffers(warrior, state, 'REHABILITATION');
    expect(advice.action).toBe('BLOCKED_BY_INJURY');
    expect(advice.dangerLevel).toBe('LETHAL');
    expect(advice.headline).toContain('Combat Blocked');
    expect(advice.warnings.length).toBeGreaterThan(0);
  });

  it('recommends rest when tournament contender is in prep window (weeks 11-12)', () => {
    const warrior = mkWarrior('p1');
    const rival = mkWarrior('r1', FightingStyle.TotalParry);
    const offer = mkOffer('offer_1', 'p1', 'r1', { boutWeek: 12, createdAbsoluteWeek: 11 });
    const state = mkState({
      week: 11,
      absoluteWeek: 11,
      roster: [warrior],
      rivals: [{ id: 'rival_stable', roster: [rival], owner: { stableName: 'Rivals' } } as any],
      boutOffers: { offer_1: offer },
    });
    const tourneyAdvice: WarriorTournamentAdvice = {
      qualifiedTier: 'Gold',
      tierName: 'Imperial Gold Cup',
      overallRank: 15,
      isParticipant: false,
      weeksUntilTournament: 2,
      status: 'CONTENDER_REST',
      headline: 'Rest & Taper',
      details: 'Taper fights.',
    };

    const advice = evaluateBoutOffers(warrior, state, 'TOURNAMENT_PUSH', tourneyAdvice);
    expect(advice.action).toBe('REST_RECOMMENDED');
    expect(advice.headline).toContain('Rest Contender');
  });

  it('recommends rest when warrior fatigue is critical (>= 50)', () => {
    const warrior = mkWarrior('p1', FightingStyle.LungingAttack, { fatigue: 55 });
    const rival = mkWarrior('r1', FightingStyle.TotalParry);
    const offer = mkOffer('offer_1', 'p1', 'r1');
    const state = mkState({
      roster: [warrior],
      rivals: [{ id: 'rival_stable', roster: [rival], owner: { stableName: 'Rivals' } } as any],
      boutOffers: { offer_1: offer },
    });

    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.action).toBe('REST_RECOMMENDED');
    expect(advice.headline).toContain('Critical Fatigue');
  });

  it('flags an opponent with career kills as LETHAL danger tier', () => {
    const warrior = mkWarrior('p1', FightingStyle.LungingAttack);
    const killerRival = mkWarrior('killer_1', FightingStyle.BashingAttack, {
      career: { wins: 12, losses: 1, kills: 3 },
    });
    const offer = mkOffer('offer_killer', 'p1', 'killer_1');
    const state = mkState({
      roster: [warrior],
      rivals: [{ id: 'rival_stable', roster: [killerRival], owner: { stableName: 'Bloody Hands' } } as any],
      boutOffers: { offer_killer: offer },
    });

    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.dangerLevel).toBe('LETHAL');
    expect(advice.warnings.some((w) => w.toLowerCase().includes('kill'))).toBe(true);
  });

  it('selects favorable style matchup with high purse as ACCEPT_OFFER', () => {
    const warrior = mkWarrior('p1', FightingStyle.AimedBlow);
    // Aimed Blow vs Wall of Steel is +3 hard counter in matrix
    const favoredOpponent = mkWarrior('ws_1', FightingStyle.WallOfSteel);
    const offer = mkOffer('offer_good', 'p1', 'ws_1', { purse: 250 });
    const state = mkState({
      roster: [warrior],
      rivals: [{ id: 'rival_stable', roster: [favoredOpponent], owner: { stableName: 'Rivals' } } as any],
      boutOffers: { offer_good: offer },
    });

    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.action).toBe('ACCEPT_OFFER');
    expect(advice.recommendedOfferId).toBe('offer_good');
    expect(advice.matchupEdge).toBeGreaterThan(0);
    expect(advice.dangerLevel).toBe('SAFE');
    expect(advice.headline).toContain('Favorable Bout');
  });

  it('returns NO_VIABLE_OFFERS when no bout offers exist for this warrior', () => {
    const warrior = mkWarrior('p1');
    const state = mkState({
      roster: [warrior],
      boutOffers: {},
    });

    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.action).toBe('NO_VIABLE_OFFERS');
    expect(advice.headline).toContain('No Bout Offers');
  });
});
