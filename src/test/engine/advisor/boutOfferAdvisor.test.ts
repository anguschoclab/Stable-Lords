import { describe, it, expect } from 'vitest';
import { evaluateBoutOffers } from '@/engine/advisor/boutOfferAdvisor';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, BoutOffer, Promoter, InsightToken } from '@/types/state.types';
import type { WarriorTournamentAdvice } from '@/engine/advisor/types';
import { makeFightSummary } from '@/test/_fixtures/factories';

const mkWarrior = (id: string, style: FightingStyle = FightingStyle.LungingAttack, over: Partial<Warrior> = {}): Warrior => ({
  id: id as any,
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
  id: id as any,
  promoterId: 'promoter_1' as any,
  warriorIds: [warriorIdA as any, warriorIdB as any],
  boutWeek: 6,
  createdAbsoluteWeek: 5,
  expirationWeek: 6,
  purse: 180,
  hype: 20,
  status: 'Proposed',
  responses: { [warriorIdA]: 'Pending', [warriorIdB]: 'Pending' } as any,
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
          id: 'i1' as any,
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
      boutOffers: { offer_1: offer } as any,
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
      boutOffers: { offer_1: offer } as any,
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
      boutOffers: { offer_1: offer } as any,
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
      boutOffers: { offer_killer: offer } as any,
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
      boutOffers: { offer_good: offer } as any,
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

  it('treasury pressure elevates purse weight — lucrative mismatch beats safe low-purse bout', () => {
    const warrior = mkWarrior('p1', FightingStyle.LungingAttack);
    // LU vs ParryStrike = -1 (unfavorable) but big purse; LU vs BashingAttack = 0 with small purse.
    const toughOpponent = mkWarrior('opp_tough', FightingStyle.ParryStrike);
    const easyOpponent = mkWarrior('opp_easy', FightingStyle.BashingAttack);
    const lucrative = mkOffer('offer_lucrative', 'p1', 'opp_tough', { purse: 250 });
    const modest = mkOffer('offer_modest', 'p1', 'opp_easy', { purse: 100 });
    const rivals = [
      { id: 'rs1', roster: [toughOpponent], owner: { stableName: 'T' } },
      { id: 'rs2', roster: [easyOpponent], owner: { stableName: 'E' } },
    ];

    // Solvent + non-purse focus: modest-purse safe matchup wins (score 60 vs 55).
    // (PURSE_HUNTER itself elevates purse weight — see the focus test below.)
    const solvent = evaluateBoutOffers(
      warrior,
      mkState({
        treasury: 1000,
        roster: [warrior],
        rivals: rivals as any,
        boutOffers: { offer_lucrative: lucrative, offer_modest: modest } as any,
      }),
      'TOURNAMENT_PUSH'
    );
    expect(solvent.recommendedOfferId).toBe('offer_modest');

    // Desperate treasury (< roster * TRAINING_COST): purse weight doubles with a
    // higher cap — the lucrative mismatch now outranks (score 80 vs 70).
    const broke = evaluateBoutOffers(
      warrior,
      mkState({
        treasury: 10,
        roster: [warrior],
        rivals: rivals as any,
        boutOffers: { offer_lucrative: lucrative, offer_modest: modest } as any,
      }),
      'PURSE_HUNTER'
    );
    expect(broke.recommendedOfferId).toBe('offer_lucrative');
    expect(broke.reasoning.some((r) => /treasury|purse/i.test(r))).toBe(true);
  });

  it('PURSE_HUNTER focus elevates purse weight even on a solvent treasury', () => {
    const warrior = mkWarrior('p1', FightingStyle.LungingAttack);
    const toughOpponent = mkWarrior('opp_tough', FightingStyle.ParryStrike);
    const easyOpponent = mkWarrior('opp_easy', FightingStyle.BashingAttack);
    const lucrative = mkOffer('offer_lucrative', 'p1', 'opp_tough', { purse: 250 });
    const modest = mkOffer('offer_modest', 'p1', 'opp_easy', { purse: 100 });
    const rivals = [
      { id: 'rs1', roster: [toughOpponent], owner: { stableName: 'T' } },
      { id: 'rs2', roster: [easyOpponent], owner: { stableName: 'E' } },
    ];
    const state = mkState({
      treasury: 1000, // solvent — treasury pressure alone would not elevate
      roster: [warrior],
      rivals: rivals as any,
      boutOffers: { offer_lucrative: lucrative, offer_modest: modest } as any,
    });

    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.recommendedOfferId).toBe('offer_lucrative');
    expect(advice.reasoning.some((r) => /purse/i.test(r))).toBe(true);
  });

  it('surfaces scout intel tokens for the opponent in reasoning', () => {
    const warrior = mkWarrior('p1', FightingStyle.AimedBlow);
    const opponent = mkWarrior('r1', FightingStyle.WallOfSteel);
    const offer = mkOffer('offer_intel', 'p1', 'r1');
    const tokens: InsightToken[] = [
      {
        id: 'tok1' as any,
        type: 'Weapon',
        warriorId: 'r1' as any,
        warriorName: 'Warrior_r1',
        detail: 'Fights with a tower shield',
        discoveredWeek: 4,
      },
    ];
    const state = mkState({
      roster: [warrior],
      rivals: [{ id: 'rival_stable', roster: [opponent], owner: { stableName: 'Rivals' } } as any],
      boutOffers: { offer_intel: offer } as any,
      insightTokens: tokens,
    });

    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.reasoning.some((r) => /scout intel/i.test(r) && r.includes('tower shield'))).toBe(
      true
    );
  });

  it('recommends commissioning a scout report when the opponent has no dossier and the treasury affords one', () => {
    const warrior = mkWarrior('p1', FightingStyle.AimedBlow);
    const opponent = mkWarrior('r1', FightingStyle.WallOfSteel);
    const offer = mkOffer('offer_blind', 'p1', 'r1');
    const state = mkState({
      roster: [warrior],
      rivals: [{ id: 'rival_stable', roster: [opponent], owner: { stableName: 'Rivals' } } as any],
      boutOffers: { offer_blind: offer } as any,
      insightTokens: [], // never scouted
      treasury: 500,
    });

    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.action).toBe('ACCEPT_OFFER');
    expect(
      advice.reasoning.some((r) => /scout report|dossier/i.test(r) && /25/.test(r))
    ).toBe(true);
  });

  it('omits scout-purchase advice when the treasury cannot cover a Basic report', () => {
    const warrior = mkWarrior('p1', FightingStyle.AimedBlow);
    const opponent = mkWarrior('r1', FightingStyle.WallOfSteel);
    const offer = mkOffer('offer_broke', 'p1', 'r1');
    const state = mkState({
      roster: [warrior],
      rivals: [{ id: 'rival_stable', roster: [opponent], owner: { stableName: 'Rivals' } } as any],
      boutOffers: { offer_broke: offer } as any,
      insightTokens: [],
      treasury: 5, // below the 25G Basic scout cost
    });

    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.reasoning.some((r) => /scout report|dossier/i.test(r))).toBe(false);
  });

  it('omits scout-purchase advice when a dossier already exists', () => {
    const warrior = mkWarrior('p1', FightingStyle.AimedBlow);
    const opponent = mkWarrior('r1', FightingStyle.WallOfSteel);
    const offer = mkOffer('offer_known', 'p1', 'r1');
    const state = mkState({
      roster: [warrior],
      rivals: [{ id: 'rival_stable', roster: [opponent], owner: { stableName: 'Rivals' } } as any],
      boutOffers: { offer_known: offer } as any,
      insightTokens: [
        {
          id: 'tok1' as any,
          type: 'Style',
          warriorId: 'r1' as any,
          warriorName: 'Warrior_r1',
          detail: 'Identified as Wall of Steel',
          discoveredWeek: 3,
        },
      ],
      treasury: 500,
    });

    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.reasoning.some((r) => /scout report|dossier/i.test(r))).toBe(false);
  });

  it('warns rematch caution when the warrior holds a losing record vs the opponent', () => {
    const warrior = mkWarrior('p1', FightingStyle.AimedBlow);
    const opponent = mkWarrior('r1', FightingStyle.WallOfSteel);
    const offer = mkOffer('offer_rematch', 'p1', 'r1');
    const state = mkState({
      roster: [warrior],
      rivals: [{ id: 'rival_stable', roster: [opponent], owner: { stableName: 'Rivals' } } as any],
      boutOffers: { offer_rematch: offer } as any,
      arenaHistory: [
        makeFightSummary({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'D' }),
        makeFightSummary({ warriorIdA: 'r1' as any, warriorIdD: 'p1' as any, winner: 'A' }),
        makeFightSummary({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'D' }),
      ],
    });

    const advice = evaluateBoutOffers(warrior, state, 'PURSE_HUNTER');
    expect(advice.warnings.some((w) => /rematch/i.test(w) && /0-3|0–3/.test(w))).toBe(true);
  });
});
