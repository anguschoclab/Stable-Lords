/**
 * Gap 10 — planWorldBouts and runPromoterPass have no weather awareness.
 * World matchmaking pairs warriors by fame/vendetta only.
 * Promoter pass pairs by rank/personality only.
 * Neither considers weather-style interactions.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior, WarriorId } from '@/types/shared.types';
import type { GameState, RivalStableData } from '@/types/state.types';
import { planWorldBouts } from '@/engine/matchmaking/worldMatchmaking';
import { runPromoterPass } from '@/engine/pipeline/passes/PromoterPass';
import { SeededRNGService } from '@/utils/random';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeWarrior(
  name: string,
  style: FightingStyle,
  stableId: string,
  fame: number = 100
): Warrior {
  return {
    id: `w_${name}` as WarriorId,
    name,
    style,
    attributes: { ST: 10, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    stableId: stableId as any,
    derivedStats: { hp: 100 } as any,
    fatigue: 0,
    lastBoutWeek: 0,
  } as Warrior;
}

function makeRival(id: string, roster: Warrior[]): RivalStableData {
  return {
    id: id as any,
    owner: {
      id: `${id}_owner` as any,
      name: id,
      stableName: `${id} Stable`,
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
    },
    roster,
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
  } as RivalStableData;
}

function makeBaseState(overrides: Partial<GameState> = {}): GameState {
  return {
    meta: { gameName: '', version: '', createdAt: '' },
    week: 5,
    year: 1,
    season: 'Spring',
    weather: 'Clear',
    crowdMood: 'Calm',
    treasury: 1000,
    fame: 0,
    roster: [],
    rivals: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    graveyard: [],
    trainers: [],
    hiringPool: [],
    recruitPool: [],
    scoutReports: [],
    hallOfFame: [],
    retired: [],
    player: {
      id: 'player-1' as any,
      name: 'Player',
      stableName: 'Player',
      fame: 0,
      renown: 0,
      titles: 0,
    } as any,
    moodHistory: [],
    tournaments: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    ownerGrudges: [],
    insightTokens: [],
    unacknowledgedDeaths: [],
    day: 0,
    isTournamentWeek: false,
    activeTournamentId: undefined,
    promoters: {},
    boutOffers: {},
    realmRankings: {},
    awards: [],
    phase: 'planning',
    ledger: [],
    popularity: 0,
    rosterBonus: 0,
    ftueComplete: true,
    ftueStep: 0,
    coachDismissed: [],
    isFTUE: false,
    ...overrides,
  } as unknown as GameState;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Gap 10: planWorldBouts considers weather in pairing', () => {
  it('avoids pairing LungingAttack warrior into Rainy weather', () => {
    const lunger = makeWarrior('Lunger', FightingStyle.LungingAttack, 'rival-1', 100);
    const basher = makeWarrior('Basher', FightingStyle.BashingAttack, 'rival-2', 100);
    const striker = makeWarrior('Striker', FightingStyle.StrikingAttack, 'rival-3', 100);

    const state = makeBaseState({
      weather: 'Rainy',
      rivals: [
        makeRival('rival-1', [lunger]),
        makeRival('rival-2', [basher]),
        makeRival('rival-3', [striker]),
      ],
    });

    const rng = new SeededRNGService(42);
    const offers = planWorldBouts(state, rng);

    // The lunger should either not be paired, or paired with lower priority
    // than the basher/striker who are less affected by rain
    const lungerOffer = offers.find((o) => o.warriorIds.includes(lunger.id));
    const basherOffer = offers.find((o) => o.warriorIds.includes(basher.id));

    // At minimum, the lunger should not be preferentially paired over
    // weather-suitable warriors
    if (basherOffer && lungerOffer) {
      // Basher should be paired first (higher priority) in Rainy
      const basherIdx = offers.indexOf(basherOffer);
      const lungerIdx = offers.indexOf(lungerOffer);
      expect(basherIdx).toBeLessThanOrEqual(lungerIdx);
    }
  });

  it('still pairs warriors in Clear weather', () => {
    const w1 = makeWarrior('W1', FightingStyle.LungingAttack, 'rival-1', 100);
    const w2 = makeWarrior('W2', FightingStyle.BashingAttack, 'rival-2', 100);

    const state = makeBaseState({
      weather: 'Clear',
      rivals: [makeRival('rival-1', [w1]), makeRival('rival-2', [w2])],
    });

    const rng = new SeededRNGService(42);
    const offers = planWorldBouts(state, rng);

    expect(offers.length).toBeGreaterThan(0);
  });
});

describe('Gap 10: runPromoterPass considers weather in matchup quality', () => {
  it('does not generate offers pairing LungingAttack into hostile weather', () => {
    const lunger = makeWarrior('Lunger', FightingStyle.LungingAttack, 'rival-1', 200);
    const basher = makeWarrior('Basher', FightingStyle.BashingAttack, 'rival-2', 200);

    const state = makeBaseState({
      weather: 'Rainy',
      rivals: [makeRival('rival-1', [lunger]), makeRival('rival-2', [basher])],
      promoters: {
        'prom-1': {
          id: 'prom-1' as any,
          name: 'Test Promoter',
          tier: 'Regional',
          personality: 'Pragmatic',
          capacity: 5,
        } as any,
      },
      realmRankings: {
        [lunger.id]: { overallRank: 1, compositeScore: 100 },
        [basher.id]: { overallRank: 1, compositeScore: 100 },
      },
    });

    const impact = runPromoterPass(state);

    // Check if any offer pairs the lunger
    const offers = Object.values(impact.boutOffers || {});
    const lungerOffers = offers.filter((o) => o.warriorIds.includes(lunger.id));

    // In Rainy weather, the lunger should not be matched (or at minimum,
    // the promoter should prefer the basher)
    // This test will fail until weather awareness is added
    expect(lungerOffers.length).toBe(0);
  });

  it('still generates offers in Clear weather', () => {
    const w1 = makeWarrior('W1', FightingStyle.LungingAttack, 'rival-1', 200);
    const w2 = makeWarrior('W2', FightingStyle.BashingAttack, 'rival-2', 200);

    const state = makeBaseState({
      weather: 'Clear',
      rivals: [makeRival('rival-1', [w1]), makeRival('rival-2', [w2])],
      promoters: {
        'prom-1': {
          id: 'prom-1' as any,
          name: 'Test Promoter',
          tier: 'Regional',
          personality: 'Pragmatic',
          capacity: 5,
        } as any,
      },
      realmRankings: {
        [w1.id]: { overallRank: 1, compositeScore: 100 },
        [w2.id]: { overallRank: 1, compositeScore: 100 },
      },
    });

    const impact = runPromoterPass(state);
    const offers = Object.values(impact.boutOffers || {});
    expect(offers.length).toBeGreaterThan(0);
  });
});
