import type { GameState, RivalStableData, WeatherType, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, PromoterId, WarriorId } from '@/types/shared.types';
import { type CrowdMood } from '@/engine/crowdMood';
import { FightingStyle } from '@/types/shared.types';
import { scoreMatchup } from '@/engine/schedulingAssistant';
import { selectArenaForMatchup } from '@/engine/matchmaking/arenaFit';
import { filterActive } from '@/utils/roster';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { BoutBid } from './types';

export const BID_MATCHMAKING_ID = 'BID_MATCHMAKING' as PromoterId;

/**
 *
 */
export function generateBoutBids(
  rival: RivalStableData,
  currentWeek: number,
  weather: WeatherType = 'Clear',
  crowdMood: CrowdMood = 'Calm',
  rivals: RivalStableData[] = []
): { bids: BoutBid[]; updatedRival: RivalStableData } {
  const intent = rival.strategy?.intent ?? 'CONSOLIDATION';
  const activeRoster = filterActive(rival.roster);
  const bids: BoutBid[] = [];

  // Build a mock state for matchup scoring
  const mockState: GameState = {
    meta: { gameName: '', version: '', createdAt: '' },
    ftueComplete: true,
    ftueStep: undefined,
    coachDismissed: [],
    player: rival.owner,
    fame: rival.owner.fame,
    popularity: rival.owner.renown,
    treasury: rival.treasury,
    ledger: [],
    week: currentWeek,
    year: 1,
    phase: 'planning',
    season: 'Spring',
    weather,
    roster: activeRoster,
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    rivals,
    gazettes: [],
    hallOfFame: [],
    crowdMood,
    tournaments: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    unacknowledgedDeaths: [],
    isFTUE: false,
    day: 1,
    isTournamentWeek: false,
    promoters: {},
    boutOffers: {},
    activeTournamentId: undefined,
    realmRankings: {},
    awards: [],
    bookmarks: [],
    progression: structuredClone(DEFAULT_PROGRESSION),
  };

  for (const warrior of activeRoster) {
    // Weather Predation & Caution
    let weatherModifier = 0;
    if (weather === 'Rainy') {
      if (warrior.style === FightingStyle.LungingAttack) weatherModifier = -3;
      if (warrior.style === FightingStyle.BashingAttack) weatherModifier = +2;
    } else if (weather === 'Sweltering' && warrior.attributes.CN < 10) {
      weatherModifier = -2;
    } else if (weather === 'Blizzard') {
      weatherModifier = -4;
      if (warrior.style === FightingStyle.BashingAttack) weatherModifier = -1;
    } else if (weather === 'Dense Fog') {
      if (warrior.style === FightingStyle.LungingAttack) weatherModifier = -5;
      if (warrior.style === FightingStyle.ParryRiposte) weatherModifier = +3;
    } else if (weather === 'Thunderstorm') {
      weatherModifier = -1;
      if (warrior.style === FightingStyle.BashingAttack) weatherModifier = +2;
    } else if (weather === 'Ashfall') {
      if (warrior.attributes.CN < 14) weatherModifier = -3;
    } else if (weather === 'Acid Rain') {
      weatherModifier = -6;
    } else if (weather === 'Mana Surge') {
      weatherModifier = +4;
    } else if (weather === 'Gale') {
      weatherModifier = -3;
      if (warrior.style === FightingStyle.ParryRiposte) weatherModifier = +2;
    } else if (weather === 'Sandstorm') {
      weatherModifier = -3;
      if (warrior.style === FightingStyle.BashingAttack) weatherModifier = +1;
    } else if (weather === 'Tornado') {
      weatherModifier = -5;
    } else if (weather === 'Blood Moon') {
      if (
        warrior.style === FightingStyle.BashingAttack ||
        warrior.style === FightingStyle.StrikingAttack
      )
        weatherModifier = +3;
    } else if (weather === 'Hailstorm') {
      weatherModifier = -2;
      if (warrior.attributes.CN < 10) weatherModifier = -4;
    } else if (weather === 'Eclipse') {
      weatherModifier = +2;
    } else if (weather === 'Scorching Wind') {
      weatherModifier = -2;
      if (warrior.attributes.CN < 12) weatherModifier = -3;
    } else if (weather === 'Spooky Night') {
      weatherModifier = -2;
    } else if (weather === 'Meteor Shower') {
      weatherModifier = -2;
    } else if (weather === 'Abyssal Gloom') {
      weatherModifier = +1;
      if (warrior.style === FightingStyle.ParryRiposte) weatherModifier = +3;
    } else if (weather === 'Cursed Miasma') {
      weatherModifier = -3;
    } else if (weather === 'Chaotic Winds') {
      weatherModifier = -2;
      if (warrior.style === FightingStyle.ParryRiposte) weatherModifier = +1;
    } else if (weather === 'Blood Rain') {
      weatherModifier = +1;
      if (warrior.style === FightingStyle.BashingAttack) weatherModifier = +2;
    } else if (weather === 'Wildfire Smoke') {
      weatherModifier = -3;
      if (warrior.attributes.CN < 12) weatherModifier = -4;
    } else if (weather === 'Mirage') {
      weatherModifier = -2;
      if (warrior.style === FightingStyle.LungingAttack) weatherModifier = -4;
    }

    // Crowd Pandering
    let moodModifier = 0;
    const personality = rival.owner.personality ?? 'Pragmatic';
    if (crowdMood === 'Bloodthirsty' && personality === 'Aggressive') moodModifier = +3;
    if (crowdMood === 'Theatrical' && personality === 'Showman') moodModifier = +3;

    // Scheduling Assistant: Matchup scoring
    let matchupModifier = 0;
    if (intent !== 'VENDETTA') {
      for (const otherRival of mockState.rivals) {
        for (const opponent of otherRival.roster) {
          if (opponent.status === 'Active') {
            const matchupScore = scoreMatchup(warrior, opponent, mockState);
            const score = Math.max(-5, Math.min(5, (matchupScore - 100) / 20));
            // Track the best (highest) matchup modifier across all opponents
            matchupModifier = Math.max(matchupModifier, score);
          }
        }
      }
    }

    if (intent === 'VENDETTA' && rival.strategy?.targetStableId) {
      bids.push({
        proposingWarriorId: warrior.id,
        targetStableId: rival.strategy.targetStableId,
        priority: Math.max(1, 10 + weatherModifier + moodModifier + matchupModifier),
        description: `Vendetta target. ${weatherModifier < 0 ? '(Weather caution)' : weatherModifier > 0 ? '(Weather advantage)' : ''} ${matchupModifier > 0 ? '(Favorable matchup)' : matchupModifier < 0 ? '(Unfavorable matchup)' : ''}`,
      });
    } else if (intent === 'RECOVERY') {
      if (weatherModifier < -2) continue;
      bids.push({
        proposingWarriorId: warrior.id,
        maxFame: 50,
        priority: Math.max(1, 5 + moodModifier + matchupModifier),
        description: 'Seeking low-risk recovery bout.',
      });
    } else if (intent === 'EXPANSION') {
      bids.push({
        proposingWarriorId: warrior.id,
        minFame: 100,
        priority: Math.max(1, 7 + weatherModifier + moodModifier + matchupModifier),
        description: 'Seeking high-visibility expansion bout.',
      });
    } else {
      bids.push({
        proposingWarriorId: warrior.id,
        priority: Math.max(1, 4 + weatherModifier + moodModifier + matchupModifier),
        description: 'Standard training bout.',
      });
    }
  }

  return { bids, updatedRival: rival };
}

/**
 * Convert bids from all rivals into actual BoutOffer objects.
 * Sorts by priority (descending), finds matching opponents based on bid criteria,
 * and prevents double-booking warriors already in existing offers.
 */
export function convertBidsToOffers(
  allBids: { bid: BoutBid; rivalId: string }[],
  rivals: RivalStableData[],
  state: GameState,
  rng: IRNGService,
  nextWeek: number,
  existingOfferWarriorIds: Set<string>
): BoutOffer[] {
  const sorted = [...allBids].sort((a, b) => b.bid.priority - a.bid.priority);
  const paired = new Set<string>(existingOfferWarriorIds);
  const rivalMap = new Map(rivals.map((r) => [r.id as string, r]));
  const offers: BoutOffer[] = [];

  for (const { bid } of sorted) {
    if (paired.has(bid.proposingWarriorId)) continue;

    const proposer = state.warriorMap?.get(bid.proposingWarriorId as WarriorId);
    if (!proposer) continue;

    const proposerStable = state.warriorToStableMap?.get(bid.proposingWarriorId as WarriorId);
    if (!proposerStable) continue;

    // Find candidate opponents based on bid criteria
    let candidates: { warrior: typeof proposer; stableId: string }[] = [];

    if (bid.targetStableId) {
      // VENDETTA: target a specific stable
      const targetRival = rivalMap.get(bid.targetStableId);
      if (targetRival) {
        candidates = filterActive(targetRival.roster).map((w) => ({
          warrior: w,
          stableId: targetRival.id as string,
        }));
      }
    } else {
      // All other intents: search all rival stables
      for (const rival of rivals) {
        if (rival.id === proposerStable.stableId) continue;
        for (const w of filterActive(rival.roster)) {
          candidates.push({ warrior: w, stableId: rival.id as string });
        }
      }
    }

    // Apply fame filters
    candidates = candidates.filter((c) => {
      if (paired.has(c.warrior.id)) return false;
      if (bid.maxFame !== undefined && (c.warrior.fame ?? 0) > bid.maxFame) return false;
      if (bid.minFame !== undefined && (c.warrior.fame ?? 0) < bid.minFame) return false;
      return true;
    });

    if (candidates.length === 0) continue;

    // Pick the best matchup opponent
    let bestCandidate = candidates[0]!;
    let bestScore = -Infinity;
    for (const candidate of candidates) {
      const score = scoreMatchup(proposer, candidate.warrior, state);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    const opponent = bestCandidate.warrior;
    const arenaId = selectArenaForMatchup(proposer, opponent, rng);
    const offerId = `bid_${rng.uuid()}` as BoutOfferId;

    const offer: BoutOffer = {
      id: offerId,
      promoterId: BID_MATCHMAKING_ID,
      proposerStableId: proposerStable.stableId as any,
      warriorIds: [bid.proposingWarriorId as WarriorId, opponent.id as WarriorId],
      boutWeek: nextWeek,
      expirationWeek: nextWeek,
      purse: Math.max(50, Math.floor((proposer.fame ?? 50) + (opponent.fame ?? 50))),
      hype: Math.max(
        40,
        Math.floor((proposer.fame ?? 50) + (opponent.fame ?? 50)) + bid.priority * 5
      ),
      status: 'Proposed',
      responses: {
        [bid.proposingWarriorId as WarriorId]: 'Accepted',
        [opponent.id as WarriorId]: 'Pending',
      },
      arenaId,
    };

    offers.push(offer);
    paired.add(bid.proposingWarriorId);
    paired.add(opponent.id);
  }

  return offers;
}
