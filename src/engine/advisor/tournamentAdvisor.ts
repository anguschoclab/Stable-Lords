/**
 * Tournament & Pacing Advisor
 * Evaluates warrior qualification across the 4 canonical tournament tiers,
 * tracks seasonal countdowns, and advises strategic resting/tapering before brackets ignite.
 */
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';
import type { WarriorTournamentAdvice } from './types';
import type { TournamentEntry } from '@/types/state/game';
import { TOURNAMENT_TIERS } from '@/engine/matchmaking/tournamentSelection/core';
import { weeksUntilNextSeasonalTournament } from '@/engine/core/absoluteWeek';

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

  // Seasonal calendar (weeks 10/20/30/42) — the Grand Championship is excluded
  // deliberately: most warriors can never enter week 52, so "weeks until" only
  // counts the brackets they could actually fight in.
  const weeksUntilTournament = weeksUntilNextSeasonalTournament(state.week);

  const currentTournament = (state.tournaments || []).find(
    (t) => t.season === state.season && !t.completed
  );
  const isParticipant = currentTournament
    ? currentTournament.participants.some((p) => p.id === warrior.id)
    : false;

  // 1. Live tournament week
  if (state.isTournamentWeek || weeksUntilTournament === 0) {
    return liveTournamentAdvice(tierInfo, currentTournament, isParticipant, overallRank);
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
      details:
        'Current realm ranking is outside the top 256. Win arena bouts to climb rankings before season end.',
    };
  }

  // 3. Tapering Window (final two weeks before the next seasonal)
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

  // 4. Standard Season Campaign (outside the tapering window)
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

/** Advice for a live tournament week — participant or spectator. */
function liveTournamentAdvice(
  tierInfo: TierInfo | null,
  currentTournament: TournamentEntry | undefined,
  isParticipant: boolean,
  overallRank: number | null
): WarriorTournamentAdvice {
  if (isParticipant) {
    return {
      qualifiedTier: tierInfo?.tierId ?? null,
      tierName: tierInfo?.tierName ?? currentTournament?.name ?? null,
      overallRank,
      isParticipant: true,
      weeksUntilTournament: 0,
      status: 'ACTIVE_ROUND',
      headline: `🏆 Live Bracket Active: ${currentTournament?.name ?? 'Seasonal Tournament'}`,
      details:
        'Tournament bouts take priority. Tune battle plan tactics for each opponent in the bracket.',
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
