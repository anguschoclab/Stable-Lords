/**
 * Tournament & Pacing Advisor
 * Evaluates warrior qualification across the 4 canonical tournament tiers,
 * tracks seasonal countdowns, and advises strategic resting/tapering before brackets ignite.
 */
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';
import type { WarriorTournamentAdvice } from './types';
import { TOURNAMENT_TIERS } from '@/engine/matchmaking/tournamentSelection/core';

interface TierInfo {
  tierId: 'Gold' | 'Silver' | 'Bronze' | 'Iron';
  tierName: string;
}

function resolveTierForRank(rank?: number): TierInfo | null {
  if (rank === undefined || rank < 1 || rank > 256) return null;
  const match = TOURNAMENT_TIERS.find((t) => rank >= t.minRank && rank <= t.maxRank);
  if (!match) return null;
  return {
    tierId: match.id as 'Gold' | 'Silver' | 'Bronze' | 'Iron',
    tierName: match.name,
  };
}

/**
 * Evaluate seasonal tournament status and pacing directives for a warrior.
 */
export function evaluateTournamentAdvice(
  warrior: Warrior,
  state: GameState
): WarriorTournamentAdvice {
  const ranking = state.realmRankings?.[warrior.id];
  const overallRank = ranking?.overallRank ?? null;
  const tierInfo = resolveTierForRank(overallRank ?? undefined);

  // Canonical 13-week seasonal cycle
  const seasonWeek = ((state.week - 1) % 13) + 1;
  const weeksUntilTournament = Math.max(0, 13 - seasonWeek);

  const currentTournament = (state.tournaments || []).find(
    (t) => t.season === state.season && !t.completed
  );
  const isParticipant = currentTournament
    ? currentTournament.participants.some((p) => p.id === warrior.id)
    : false;

  // 1. Live tournament week
  if (state.isTournamentWeek || weeksUntilTournament === 0) {
    if (isParticipant) {
      return {
        qualifiedTier: tierInfo?.tierId ?? null,
        tierName: tierInfo?.tierName ?? currentTournament?.name ?? null,
        overallRank,
        isParticipant: true,
        weeksUntilTournament: 0,
        status: 'ACTIVE_ROUND',
        headline: `🏆 Live Bracket Active: ${currentTournament?.name ?? 'Seasonal Tournament'}`,
        details: 'Tournament bouts take priority. Tune battle plan tactics for each opponent in the bracket.',
      };
    }
    return {
      qualifiedTier: tierInfo?.tierId ?? null,
      tierName: tierInfo?.tierName ?? null,
      overallRank,
      isParticipant: false,
      weeksUntilTournament: 0,
      status: 'OFF_SEASON',
      headline: 'Tournament Week (Non-Participant)',
      details: 'Focus on rest, recovery, and preparation for next season.',
    };
  }

  // 2. Unqualified
  if (!tierInfo) {
    return {
      qualifiedTier: null,
      tierName: null,
      overallRank,
      isParticipant: false,
      weeksUntilTournament,
      status: 'NONE',
      headline: 'Not Qualified for Seasonal Tournaments',
      details: 'Current realm ranking is outside the top 256. Win arena bouts to climb rankings before season end.',
    };
  }

  // 3. Tapering Window (weeks 11-12)
  if (weeksUntilTournament <= 2) {
    return {
      qualifiedTier: tierInfo.tierId,
      tierName: tierInfo.tierName,
      overallRank,
      isParticipant,
      weeksUntilTournament,
      status: 'CONTENDER_REST',
      headline: `🏆 Rest & Taper for ${tierInfo.tierName} (${weeksUntilTournament} wk${weeksUntilTournament === 1 ? '' : 's'} away)`,
      details: `Rank #${overallRank} qualifies for ${tierInfo.tierName}. Strongly advise to taper fights and enter Med Bay recovery to eliminate fatigue and ensure 100% readiness.`,
    };
  }

  // 4. Standard Season Campaign (weeks 1-10)
  return {
    qualifiedTier: tierInfo.tierId,
    tierName: tierInfo.tierName,
    overallRank,
    isParticipant,
    weeksUntilTournament,
    status: 'QUALIFYING',
    headline: `Contending for ${tierInfo.tierName} (Rank #${overallRank})`,
    details: `Currently seeded in ${tierInfo.tierName}. ${weeksUntilTournament} weeks remaining to build fame and secure seeding.`,
  };
}
