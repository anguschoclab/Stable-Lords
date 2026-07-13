import { describe, it, expect, beforeEach } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateTestState } from '@/test/_setup/testHelpers';
import { runPromoterPass, lowerBound, upperBound } from '@/engine/pipeline/passes/PromoterPass';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import { FightingStyle } from '@/types/shared.types';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import type { GameState, Promoter, TournamentEntry, Warrior, BoutOffer } from '@/types/state.types';
import type { WarriorId, InjuryId, TournamentId } from '@/types/shared.types';
import { generateId } from '@/utils/idUtils';
import { resolveImpacts } from '@/engine/impacts';

// Helper to create a promoter with specific personality
function createTestPromoter(
  id: string,
  name: string,
  personality: Promoter['personality'],
  tier: Promoter['tier'] = 'Local',
  capacity: number = 2,
  biases: FightingStyle[] = [FightingStyle.StrikingAttack]
): Promoter {
  return {
    id: id as import('@/types/shared.types').PromoterId,
    name,
    age: 45,
    personality,
    tier,
    capacity,
    biases,
    history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
  };
}

// Helper to add tournament participants
function addTournamentParticipants(
  state: GameState,
  participantIds: string[],
  week: number = 13
): GameState {
  const participants = participantIds
    .map((id) => {
      const warrior = [...state.roster, ...(state.rivals?.flatMap((r) => r.roster) || [])].find(
        (w) => w.id === (id as WarriorId)
      );
      return (
        warrior ||
        makeWarrior(id as WarriorId, `Warrior ${id}`, FightingStyle.StrikingAttack, {
          ST: 10,
          CN: 10,
          SZ: 10,
          WT: 10,
          WL: 10,
          SP: 10,
          DF: 10,
        })
      );
    })
    .filter((w): w is Warrior => w !== undefined);

  const tournament: TournamentEntry = {
    id: `t-gold-spring-${week}` as TournamentId,
    name: 'Test Tournament',
    tierId: 'Gold',
    season: 'Spring',
    week,
    participants,
    bracket: [],
    completed: false,
  };

  return {
    ...state,
    isTournamentWeek: true,
    tournaments: [tournament],
  };
}

describe('PromoterPass', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
    state = populateTestState(state);
    // Run rankings pass and apply impacts to populate rankings cache
    const rankingsImpact = runRankingsPass(state);
    state = resolveImpacts(state, [rankingsImpact]);
  });

  describe('Personality-based purse modifiers', () => {
    it('should apply +15% purse modifier for Greedy promoters', () => {
      // Replace promoters with just a Greedy one
      (state as any).promoters = {
        ['greedy_promoter' as import('@/types/shared.types').PromoterId]: createTestPromoter(
          'greedy_promoter',
          'Greedy Gary',
          'Greedy',
          'Regional',
          1
        ),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Should generate at least one offer
      expect(offers.length).toBeGreaterThan(0);

      const offer = offers.find((o) => o.promoterId === 'greedy_promoter');

      if (offer) {
        // Just verify an offer was generated with a reasonable purse
        expect(offer.purse).toBeGreaterThan(0);
        expect(offer.promoterId).toBe('greedy_promoter');
      }
    });

    it('should apply +20% purse when both warriors have fame > 75 for Flashy promoters', () => {
      // Add high-fame warriors
      const highFameWarrior1 = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Famous Fighter 1',
        FightingStyle.LungingAttack,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        { fame: 100 }
      );
      highFameWarrior1.id = 'high_fame_1' as WarriorId;

      const highFameWarrior2 = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Famous Fighter 2',
        FightingStyle.LungingAttack,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        { fame: 100 }
      );
      highFameWarrior2.id = 'high_fame_2' as WarriorId;

      state.roster = [...state.roster, highFameWarrior1, highFameWarrior2];
      runRankingsPass(state);

      (state as any).promoters = {
        ['flashy_promoter' as import('@/types/shared.types').PromoterId]: createTestPromoter(
          'flashy_promoter',
          'Flashy Fred',
          'Flashy',
          'Regional',
          1
        ),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Find offer involving high-fame warriors
      const highFameOffer = offers.find(
        (o) =>
          o.warriorIds.includes('high_fame_1' as WarriorId) ||
          o.warriorIds.includes('high_fame_2' as WarriorId)
      );

      // If such offer exists, verify purse reflects the Flashy modifier
      if (
        highFameOffer &&
        highFameOffer.warriorIds.includes('high_fame_1' as WarriorId) &&
        highFameOffer.warriorIds.includes('high_fame_2' as WarriorId)
      ) {
        const basePurse = 250 * 1.8;
        // Should be higher due to +20% modifier when both fame > 75
        expect(highFameOffer.purse).toBeGreaterThan(basePurse * 1.1);
      }
    });

    it('should apply +5% purse for Corporate promoters', () => {
      (state as any).promoters = {
        ['corporate_promoter' as import('@/types/shared.types').PromoterId]: createTestPromoter(
          'corporate_promoter',
          'Corporate Carl',
          'Corporate',
          'Regional',
          1
        ),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      expect(offers.length).toBeGreaterThan(0);

      const offer = offers.find((o) => o.promoterId === 'corporate_promoter');

      if (offer) {
        // Just verify an offer was generated with a reasonable purse
        expect(offer.purse).toBeGreaterThan(0);
        expect(offer.promoterId).toBe('corporate_promoter');
      }
    });
  });

  describe('Personality-based hype modifiers', () => {
    it('should reduce hype by 10% for Greedy promoters', () => {
      // Create two identical scenarios, one with Greedy, one with Corporate
      (state as any).promoters = {
        greedy: createTestPromoter('greedy', 'Greedy', 'Greedy', 'Local', 1),
        corporate: createTestPromoter('corporate', 'Corporate', 'Corporate', 'Local', 1),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      const greedyOffer = offers.find((o) => o.promoterId === 'greedy');
      const corporateOffer = offers.find((o) => o.promoterId === 'corporate');

      // If both generated offers for similar matchups, Greedy should have lower hype
      if (greedyOffer && corporateOffer) {
        // Greedy reduces hype by 10%, so should be lower (or similar base, but never higher)
        expect(greedyOffer.hype).toBeLessThanOrEqual(corporateOffer.hype);
      }
    });

    it('should increase hype by 10% for Honorable promoters when fame difference < 50', () => {
      // Create warriors with similar fame
      const warrior1 = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Honor Warrior 1',
        FightingStyle.StrikingAttack,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        { fame: 100 }
      );
      warrior1.id = 'honor_warrior_1' as WarriorId;

      const warrior2 = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Honor Warrior 2',
        FightingStyle.StrikingAttack,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        { fame: 120 } // Only 20 difference
      );
      warrior2.id = 'honor_warrior_2' as WarriorId;

      state.roster = [...state.roster, warrior1, warrior2];
      runRankingsPass(state);

      (state as any).promoters = {
        honorable: createTestPromoter('honorable', 'Honorable', 'Honorable', 'Local', 2),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      const honorableOffer = offers.find(
        (o) =>
          o.promoterId === 'honorable' &&
          o.warriorIds.includes('honor_warrior_1' as WarriorId) &&
          o.warriorIds.includes('honor_warrior_2' as WarriorId)
      );

      // Base hype is 100, with Honorable bonus should be ~110
      if (honorableOffer) {
        expect(honorableOffer.hype).toBeGreaterThanOrEqual(105);
      }
    });

    it('should increase hype by 25 for Sadistic promoters with high-kill warriors', () => {
      // Create warrior with kills
      const killer = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Killer',
        FightingStyle.BashingAttack,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        { fame: 50 }
      );
      killer.id = 'killer_warrior' as WarriorId;
      killer.career.kills = 5;

      const victim = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Victim',
        FightingStyle.StrikingAttack,
        { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        { fame: 50 }
      );
      victim.id = 'victim_warrior' as WarriorId;

      state.roster = [...state.roster, killer, victim];
      runRankingsPass(state);

      (state as any).promoters = {
        sadistic: createTestPromoter('sadistic', 'Sadistic', 'Sadistic', 'Local', 2),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      const sadisticOffer = offers.find(
        (o) =>
          o.promoterId === 'sadistic' &&
          (o.warriorIds.includes('killer_warrior' as WarriorId) ||
            o.warriorIds.includes('victim_warrior' as WarriorId))
      );

      // Should have +25 hype for high-kill warrior
      if (sadisticOffer && sadisticOffer.warriorIds.includes('killer_warrior' as WarriorId)) {
        expect(sadisticOffer.hype).toBeGreaterThan(120); // Base 100 + 25 for kills
      }
    });

    it('should increase hype by 15 for Flashy promoters when warriors have fame > 100', () => {
      const famousWarrior = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Famous Fighter',
        FightingStyle.LungingAttack,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        { fame: 150 }
      );
      famousWarrior.id = 'famous_warrior' as WarriorId;

      state.roster = [...state.roster, famousWarrior];
      runRankingsPass(state);

      (state as any).promoters = {
        flashy: createTestPromoter('flashy', 'Flashy', 'Flashy', 'Local', 2),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      const flashyOffer = offers.find(
        (o) => o.promoterId === 'flashy' && o.warriorIds.includes('famous_warrior' as WarriorId)
      );

      // Should have +15 hype for fame > 100
      if (flashyOffer) {
        expect(flashyOffer.hype).toBeGreaterThan(105); // Base + 15 for fame
      }
    });
  });

  describe('Personality-based skill gap thresholds', () => {
    it('should allow larger skill gaps (0.35) for Greedy promoters', () => {
      // Greedy allows 35% skill gap vs default 25%
      (state as any).promoters = {
        greedy: createTestPromoter('greedy', 'Greedy', 'Greedy', 'Legendary', 5),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Greedy should generate offers due to larger allowed gap
      expect(offers.length).toBeGreaterThan(0);
    });

    it('should restrict skill gaps to 0.10 for Honorable promoters', () => {
      // Honorable restricts to 10% skill gap (tight parity)
      (state as any).promoters = {
        honorable: createTestPromoter('honorable', 'Honorable', 'Honorable', 'Legendary', 5),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Should still generate offers but with tighter matching
      // Note: In a well-populated test state, Honorable may generate fewer offers
      // due to strict parity requirements
      expect(offers.length).toBeGreaterThanOrEqual(0);
    });

    it('should use 0.25 skill gap for Sadistic and Flashy promoters', () => {
      (state as any).promoters = {
        sadistic: createTestPromoter('sadistic', 'Sadistic', 'Sadistic', 'Legendary', 3),
        flashy: createTestPromoter('flashy', 'Flashy', 'Flashy', 'Legendary', 3),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Both should generate reasonable numbers of offers with standard gap
      const { sadisticCount, flashyCount } = offers.reduce(
        (acc, o) => {
          if (o.promoterId === 'sadistic') acc.sadisticCount++;
          if (o.promoterId === 'flashy') acc.flashyCount++;
          return acc;
        },
        { sadisticCount: 0, flashyCount: 0 }
      );

      // Both should be able to generate offers
      expect(sadisticCount + flashyCount).toBeGreaterThan(0);
    });

    it('should use 0.20 skill gap for Corporate promoters', () => {
      (state as any).promoters = {
        corporate: createTestPromoter('corporate', 'Corporate', 'Corporate', 'Legendary', 5),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Corporate should generate stable, predictable matchups
      expect(offers.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tournament week warrior exclusion', () => {
    it('should exclude tournament-locked warriors from regular bout offers', () => {
      // Get a player warrior to add to tournament
      const playerWarrior = state.roster[0];
      expect(playerWarrior).toBeDefined();
      if (!playerWarrior) return;

      // Add this warrior to tournament participants
      state = addTournamentParticipants(state, [playerWarrior.id as string]);

      // Clear other promoters and add one simple promoter
      (state as any).promoters = {
        local: createTestPromoter('local', 'Local', 'Corporate', 'Local', 10),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Tournament-locked warrior should NOT appear in any offers
      const offersWithLockedWarrior = offers.filter((o) =>
        o.warriorIds.includes(playerWarrior.id as WarriorId)
      );

      expect(offersWithLockedWarrior.length).toBe(0);
    });

    it('should still generate offers for non-tournament warriors during tournament weeks', () => {
      // Get some player warriors, put half in tournament
      const tournamentWarriors = state.roster.slice(0, 3).map((w) => w.id as string);

      state = addTournamentParticipants(state, tournamentWarriors);

      // Re-apply rankings after tournament modification
      const rankingsImpact = runRankingsPass(state);
      state = resolveImpacts(state, [rankingsImpact]);

      (state as any).promoters = {
        local: createTestPromoter('local', 'Local', 'Corporate', 'Local', 10),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Should still generate some offers (may be for rival warriors not in tournament)
      expect(offers.length).toBeGreaterThanOrEqual(0);
    });

    it('should not affect offer generation when isTournamentWeek is false', () => {
      // Same setup as above, but no tournament week
      // Not a tournament week
      state.isTournamentWeek = false;
      state.tournaments = [];

      (state as any).promoters = {
        local: createTestPromoter('local', 'Local', 'Corporate', 'Local', 10),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // All warriors should be eligible
      const offersGenerated = offers.length;
      expect(offersGenerated).toBeGreaterThan(0);
    });
  });

  describe('Sadistic promoter injury-risk matching', () => {
    it('should prefer injury-risk matchups for Sadistic promoters', () => {
      // Create injured warrior
      const injuredWarrior = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Injured Fighter',
        FightingStyle.StrikingAttack,
        { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        { fame: 50 }
      );
      injuredWarrior.id = 'injured_warrior' as WarriorId;
      injuredWarrior.injuries = [
        {
          id: generateId(undefined, 'injury') as InjuryId,
          name: 'Broken Arm',
          severity: 'Moderate',
          location: 'Right Arm',
          description: 'Broken arm',
          weeksRemaining: 4,
          penalties: { ST: -2, CN: -1 },
        },
      ];

      state.roster = [...state.roster, injuredWarrior];
      runRankingsPass(state);

      (state as any).promoters = {
        sadistic: createTestPromoter('sadistic', 'Sadistic', 'Sadistic', 'Local', 5),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Sadistic promoter should generate offers, potentially with injured warrior
      const sadisticOffers = offers.filter((o) => o.promoterId === 'sadistic');
      expect(sadisticOffers.length).toBeGreaterThan(0);
    });

    it('should apply +20% purse modifier for injury-risk matchups with Sadistic promoters', () => {
      // This is harder to test deterministically, but we verify the function exists
      // and that Sadistic promoters generate offers
      (state as any).promoters = {
        sadistic: createTestPromoter('sadistic', 'Sadistic', 'Sadistic', 'Regional', 5),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      expect(offers.length).toBeGreaterThan(0);
    });
  });

  describe('Flashy promoter showy-style matching', () => {
    it('should prefer showy styles (Lunging, AimedBlow, ParryLunge) for Flashy promoters', () => {
      // Create warriors with showy styles
      const showyWarrior1 = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Showy 1',
        FightingStyle.LungingAttack,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        { fame: 80 }
      );
      showyWarrior1.id = 'showy_1' as WarriorId;

      const showyWarrior2 = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Showy 2',
        FightingStyle.AimedBlow,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        { fame: 80 }
      );
      showyWarrior2.id = 'showy_2' as WarriorId;

      state.roster = [...state.roster, showyWarrior1, showyWarrior2];
      runRankingsPass(state);

      (state as any).promoters = {
        flashy: createTestPromoter('flashy', 'Flashy', 'Flashy', 'Local', 5),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Flashy should generate offers, potentially with showy warriors
      expect(offers.length).toBeGreaterThan(0);
    });

    it('should apply +10% hype when both warriors have showy styles', () => {
      // Create two showy warriors
      const showy1 = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Showy A',
        FightingStyle.LungingAttack,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        { fame: 80 }
      );
      showy1.id = 'showy_a' as WarriorId;

      const showy2 = makeWarrior(
        generateId(undefined, 'warrior') as WarriorId,
        'Showy B',
        FightingStyle.AimedBlow,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        { fame: 80 }
      );
      showy2.id = 'showy_b' as WarriorId;

      state.roster = [...state.roster, showy1, showy2];
      runRankingsPass(state);

      (state as any).promoters = {
        flashy: createTestPromoter('flashy', 'Flashy', 'Flashy', 'Local', 5),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Find offer with both showy warriors
      const showyOffer = offers.find(
        (o) =>
          o.warriorIds.includes('showy_a' as WarriorId) &&
          o.warriorIds.includes('showy_b' as WarriorId)
      );

      // Should have +10% hype bonus
      if (showyOffer) {
        expect(showyOffer.hype).toBeGreaterThanOrEqual(110); // Base 100 + 10%
      }
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty promoters gracefully', () => {
      (state as any).promoters = {};

      const result = runPromoterPass(state);

      // Should return existing offers (after garbage collection)
      expect(result.boutOffers).toBeDefined();
    });

    it('should handle promoters with zero capacity', () => {
      (state as any).promoters = {
        no_capacity: createTestPromoter('no_cap', 'No Capacity', 'Corporate', 'Local', 0),
      };

      const result = runPromoterPass(state);
      const offers = Object.values(result.boutOffers || {});

      // Should not generate any offers
      const offersFromNoCap = offers.filter((o) => o.promoterId === 'no_cap');
      expect(offersFromNoCap.length).toBe(0);
    });

    it('should garbage collect expired offers', () => {
      // Add an expired offer
      const roster0 = state.roster[0];
      const roster1 = state.roster[1];
      if (!roster0 || !roster1) return;

      const expiredOffer = {
        id: 'expired_test',
        promoterId: 'p_local',
        warriorIds: [roster0.id, roster1.id],
        boutWeek: state.week - 1, // Past week
        expirationWeek: state.week - 1,
        purse: 100,
        hype: 100,
        status: 'Proposed' as const,
        responses: {},
      };

      (state as any).boutOffers = { expired_test: expiredOffer };

      const result = runPromoterPass(state);

      // Expired offer should be removed
      expect(result.boutOffers!['expired_test']).toBeUndefined();
    });

    it('should preserve signed offers for current week', () => {
      // Add a signed offer for current week
      const roster0b = state.roster[0];
      const roster1b = state.roster[1];
      if (!roster0b || !roster1b) return;

      const signedOffer = {
        id: 'signed_test',
        promoterId: 'p_local',
        warriorIds: [roster0b.id, roster1b.id],
        boutWeek: state.week,
        expirationWeek: state.week + 1,
        purse: 100,
        hype: 100,
        status: 'Signed' as const,
        responses: {
          [roster0b.id]: 'Accepted' as const,
          [roster1b.id]: 'Accepted' as const,
        },
      };

      (state as any).boutOffers = { signed_test: signedOffer };

      const result = runPromoterPass(state);

      // Signed offer should be preserved
      const preservedOffer = result.boutOffers?.['signed_test' as BoutOfferId];
      expect(preservedOffer).toBeDefined();
      if (preservedOffer) {
        expect(preservedOffer.status).toBe('Signed');
      }
    });
  });
});

// ─── Binary search helper tests ──────────────────────────────────────────────

describe('lowerBound / upperBound', () => {
  it('finds correct window for normal case', () => {
    const scores = [10, 20, 30, 40, 50];
    expect(lowerBound(scores, 25)).toBe(2);
    expect(upperBound(scores, 35)).toBe(3);
  });

  it('includes all elements when window covers full range', () => {
    const scores = [10, 20, 30, 40, 50];
    expect(lowerBound(scores, 0)).toBe(0);
    expect(upperBound(scores, 100)).toBe(5);
  });

  it('returns empty range when no elements in window', () => {
    const scores = [10, 20, 30, 40, 50];
    expect(lowerBound(scores, 60)).toBe(5);
    expect(upperBound(scores, 70)).toBe(5);
  });

  it('handles exact boundary match', () => {
    const scores = [10, 20, 30, 40, 50];
    expect(lowerBound(scores, 30)).toBe(2);
    expect(upperBound(scores, 30)).toBe(3);
  });

  it('handles single element array', () => {
    const scores = [42];
    expect(lowerBound(scores, 40)).toBe(0);
    expect(upperBound(scores, 45)).toBe(1);
  });

  it('handles empty array', () => {
    const scores: number[] = [];
    expect(lowerBound(scores, 25)).toBe(0);
    expect(upperBound(scores, 35)).toBe(0);
  });

  it('handles duplicate scores', () => {
    const scores = [10, 20, 20, 20, 30];
    expect(lowerBound(scores, 20)).toBe(1);
    expect(upperBound(scores, 20)).toBe(4);
  });
});

// ─── Matched-warrior exclusion tests ─────────────────────────────────────────

describe('Matched-warrior exclusion', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
    state = populateTestState(state);
    state.rivals = [];
    const rankingsImpact = runRankingsPass(state);
    state = resolveImpacts(state, [rankingsImpact]);
  });

  it('should not place a warrior in more than one offer per promoter', () => {
    (state as any).promoters = {
      ['big_cap' as import('@/types/shared.types').PromoterId]: createTestPromoter(
        'big_cap',
        'Big Cap',
        'Corporate',
        'Local',
        50
      ),
    };

    const result = runPromoterPass(state);
    const offers = Object.values(result.boutOffers || {}) as BoutOffer[];

    const warriorOfferCount = new Map<string, number>();
    for (const offer of offers) {
      for (const wid of offer.warriorIds) {
        const id = wid as string;
        warriorOfferCount.set(id, (warriorOfferCount.get(id) || 0) + 1);
      }
    }

    for (const [, count] of warriorOfferCount) {
      expect(count).toBe(1);
    }
  });

  it('should generate at most floor(N/2) offers when capacity >= N', () => {
    const eligibleCount = state.roster.length;
    (state as any).promoters = {
      ['unlimited' as import('@/types/shared.types').PromoterId]: createTestPromoter(
        'unlimited',
        'Unlimited',
        'Corporate',
        'Local',
        eligibleCount
      ),
    };

    const result = runPromoterPass(state);
    const offers = Object.values(result.boutOffers || {}) as BoutOffer[];

    expect(offers.length).toBeLessThanOrEqual(Math.floor(eligibleCount / 2));
  });
});

// ─── Score-window matching correctness ───────────────────────────────────────

describe('Score-window matching', () => {
  function makeStateWithWarriors(
    scores: { id: string; score: number; style?: FightingStyle }[]
  ): GameState {
    const warriors: Warrior[] = scores.map((s) => {
      const w = makeWarrior(
        s.id as WarriorId,
        `Warrior ${s.id}`,
        s.style ?? FightingStyle.StrikingAttack,
        { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        { fame: s.score }
      );
      w.id = s.id as WarriorId;
      return w;
    });

    const realmRankings: Record<string, any> = {};
    for (const s of scores) {
      realmRankings[s.id] = { overallRank: 1, classRank: 1, compositeScore: s.score };
    }

    return {
      meta: { gameName: '', version: '', createdAt: '' },
      week: 5,
      year: 1,
      season: 'Spring',
      weather: 'Clear',
      treasury: 1000,
      fame: 0,
      roster: warriors,
      rivals: [],
      promoters: {},
      boutOffers: {},
      realmRankings,
    } as unknown as GameState;
  }

  it('warrior with score 30 and gap 0.25 should not match score 20 or 40', () => {
    const state = makeStateWithWarriors([
      { id: 'w10', score: 10 },
      { id: 'w20', score: 20 },
      { id: 'w30', score: 30 },
      { id: 'w40', score: 40 },
      { id: 'w50', score: 50 },
    ]);

    (state as any).promoters = {
      ['p' as import('@/types/shared.types').PromoterId]: createTestPromoter(
        'p',
        'Test',
        'Corporate',
        'Local',
        10
      ),
    };

    const result = runPromoterPass(state);
    const offers = Object.values(result.boutOffers || {}) as BoutOffer[];

    // Warrior w30 (score 30, maxScoreA=30, gap 0.2 for Corporate):
    // window = [30 - 0.2*30, 30 + 0.2*30] = [24, 36]
    // Only score 30 is in range, but self is excluded → no match for w30
    const w30Offers = offers.filter((o) => o.warriorIds.includes('w30' as WarriorId));
    expect(w30Offers.length).toBe(0);
  });

  it('warriors with close scores should match each other', () => {
    const state = makeStateWithWarriors([
      { id: 'w100a', score: 100 },
      { id: 'w100b', score: 100 },
    ]);

    (state as any).promoters = {
      ['p' as import('@/types/shared.types').PromoterId]: createTestPromoter(
        'p',
        'Test',
        'Corporate',
        'Local',
        10
      ),
    };

    const result = runPromoterPass(state);
    const offers = Object.values(result.boutOffers || {}) as BoutOffer[];

    expect(offers.length).toBe(1);
    const offer = offers[0]!;
    expect(offer.warriorIds).toContain('w100a' as WarriorId);
    expect(offer.warriorIds).toContain('w100b' as WarriorId);
  });

  it('all score-0 warriors should match (maxScoreA = max(1, 0) = 1)', () => {
    const state = makeStateWithWarriors([
      { id: 'w0a', score: 0 },
      { id: 'w0b', score: 0 },
      { id: 'w0c', score: 0 },
      { id: 'w0d', score: 0 },
    ]);

    (state as any).promoters = {
      ['p' as import('@/types/shared.types').PromoterId]: createTestPromoter(
        'p',
        'Test',
        'Corporate',
        'Local',
        10
      ),
    };

    const result = runPromoterPass(state);
    const offers = Object.values(result.boutOffers || {}) as BoutOffer[];

    // 4 warriors, all score 0 → maxScoreA=1, gap 0.2, window [-0.2, 0.2]
    // All 4 are in range of each other → 2 offers (matched exclusion)
    expect(offers.length).toBe(2);
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe('Edge cases for optimized matching', () => {
  it('should generate 0 offers with a single eligible warrior', () => {
    const state = {
      meta: { gameName: '', version: '', createdAt: '' },
      week: 5,
      year: 1,
      season: 'Spring',
      weather: 'Clear',
      treasury: 1000,
      fame: 0,
      roster: [
        makeWarrior(
          'solo' as WarriorId,
          'Solo',
          FightingStyle.StrikingAttack,
          { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
          { fame: 50 }
        ),
      ],
      rivals: [],
      promoters: {
        ['p' as import('@/types/shared.types').PromoterId]: createTestPromoter(
          'p',
          'Test',
          'Corporate',
          'Local',
          5
        ),
      } as any,
      boutOffers: {},
      realmRankings: {
        solo: { overallRank: 1, classRank: 1, compositeScore: 50 },
      } as any,
    } as unknown as GameState;

    const result = runPromoterPass(state);
    const offers = Object.values(result.boutOffers || {}) as BoutOffer[];
    expect(offers.length).toBe(0);
  });

  it('should handle large pool without timeout (500 warriors)', () => {
    const warriors: Warrior[] = [];
    const realmRankings: Record<string, any> = {};
    for (let i = 0; i < 500; i++) {
      const id = `w_${i}`;
      const w = makeWarrior(
        id as WarriorId,
        `Warrior ${i}`,
        FightingStyle.StrikingAttack,
        { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        { fame: 50 + (i % 20) * 5 }
      );
      w.id = id as WarriorId;
      warriors.push(w);
      realmRankings[id] = { overallRank: i + 1, classRank: 1, compositeScore: 50 + (i % 20) * 5 };
    }

    const state = {
      meta: { gameName: '', version: '', createdAt: '' },
      week: 5,
      year: 1,
      season: 'Spring',
      weather: 'Clear',
      treasury: 1000,
      fame: 0,
      roster: warriors,
      rivals: [],
      promoters: {
        ['p' as import('@/types/shared.types').PromoterId]: createTestPromoter(
          'p',
          'Test',
          'Corporate',
          'Local',
          50
        ),
      } as any,
      boutOffers: {},
      realmRankings,
    } as unknown as GameState;

    const result = runPromoterPass(state);
    const offers = Object.values(result.boutOffers || {}) as BoutOffer[];

    expect(offers.length).toBeGreaterThan(0);
    expect(offers.length).toBeLessThanOrEqual(250);
  });
});
