import type { GameState, RivalStableData, WeatherType } from '@/types/state.types';
import { type CrowdMood } from '@/engine/crowdMood';
import { FightingStyle } from '@/types/shared.types';
import { scoreMatchup } from '@/engine/schedulingAssistant';
import { filterActive } from '@/utils/roster';
import type { BoutBid } from './types';

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
