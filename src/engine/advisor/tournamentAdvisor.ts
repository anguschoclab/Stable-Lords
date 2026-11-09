/**
 * Tournament & Pacing Advisor
 * Evaluates warrior qualification across the 4 canonical tournament tiers,
 * tracks seasonal countdowns, and advises strategic resting/tapering before brackets ignite.
 * V27: layered with FE tournament classes — the frozen cycle snapshot is the
 * class authority; post-freeze FE growth never moves a warrior up a class.
 */
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';
import type { WarriorTournamentAdvice } from './types';
import type { TournamentEntry } from '@/types/state/game';
import { TOURNAMENT_TIERS } from '@/engine/matchmaking/tournamentSelection/core';
import { weeksUntilNextSeasonalTournament } from '@/engine/core/absoluteWeek';
import {
  TOURNAMENT_CLASSES,
  classForFE,
  type TournamentClassSpec,
} from '@/engine/matchmaking/tournamentSelection/classes';
import { fightEquivalentsOf } from '@/engine/warrior/careerUpdate';

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

/** Class fields resolved once — frozen FE wins when the cycle covers the warrior. */
function classLayer(warrior: Warrior, state: GameState) {
  const cycle = state.tournamentCycle;
  const liveFE = fightEquivalentsOf(warrior);
  const fe = cycle?.feByWarrior[warrior.id] ?? liveFE;
  const classId = classForFE(fe);
  const spec = TOURNAMENT_CLASSES.find((c) => c.id === classId);
  const nextSpec = TOURNAMENT_CLASSES.find((c) => c.minFE > fe);
  const breakpointGap = nextSpec ? nextSpec.minFE - fe : 0;
  const scratched = (cycle?.scratched ?? []).includes(warrior.id);
  const entered =
    !!cycle &&
    !scratched &&
    ((cycle.invited[classId] ?? []).includes(warrior.id) ||
      (cycle.declared[state.player.id] ?? []).includes(warrior.id));
  return { cycle, fe, classId, spec, breakpointGap, entered };
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

  // Multi-bracket world: the warrior's live bracket is ANY uncompleted entry
  // holding them — class brackets no longer share the season key 1:1.
  const currentTournament = (state.tournaments || []).find(
    (t) => !t.completed && t.participants.some((p) => p.id === warrior.id)
  );
  const isParticipant = currentTournament !== undefined;

  const { cycle, fe, classId, spec, breakpointGap, entered } = classLayer(warrior, state);
  const classFields = {
    classId,
    fe,
    breakpointGap,
    entered,
  };

  // 1. Live tournament week
  if (state.isTournamentWeek || weeksUntilTournament === 0) {
    return { ...liveTournamentAdvice(tierInfo, currentTournament, isParticipant, overallRank), ...classFields };
  }

  // 2. Frozen cycle live — the class is locked; entry status + breakpoint edge
  // drive advice. This precedes the rank check: class membership is FE-based,
  // not rank-based, so an unranked warrior still has a locked class.
  if (cycle && spec) {
    return frozenCycleAdvice(tierInfo, overallRank, weeksUntilTournament, spec, breakpointGap, entered, classFields);
  }

  // 3. Unqualified
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
      ...classFields,
    };
  }

  // 4. Tapering Window (final two weeks before the next seasonal)
  if (weeksUntilTournament <= 2) {
    return {
      qualifiedTier: tierInfo?.tierId ?? null,
      tierName: tierInfo?.tierName ?? null,
      overallRank,
      isParticipant,
      weeksUntilTournament,
      status: 'CONTENDER_REST',
      headline: `🏆 Rest & Taper for ${tierInfo.tierName} (${weeksUntilTournament} wk${weeksUntilTournament === 1 ? '' : 's'} away)`,
      details: `Rank #${overallRank} qualifies for ${tierInfo.tierName}. Strongly advise to taper fights and enter Med Bay recovery to eliminate fatigue and ensure 100% readiness.`,
      ...classFields,
    };
  }

  // 5. Standard Season Campaign (outside the tapering window)
  return {
    qualifiedTier: tierInfo?.tierId ?? null,
    tierName: tierInfo?.tierName ?? null,
    overallRank,
    isParticipant,
    weeksUntilTournament,
    status: 'QUALIFYING',
    headline: `Contending for ${tierInfo.tierName} (Rank #${overallRank})`,
    details: `Currently seeded in ${tierInfo.tierName}. ${weeksUntilTournament} weeks remaining to build fame and secure seeding.`,
    ...classFields,
  };
}

/** Post-freeze entry window — class locked, breakpoint edge flips taper advice. */
function frozenCycleAdvice(
  tierInfo: TierInfo | null,
  overallRank: number | null,
  weeksUntilTournament: number,
  spec: TournamentClassSpec,
  breakpointGap: number,
  entered: boolean,
  classFields: Pick<
    WarriorTournamentAdvice,
    'classId' | 'fe' | 'breakpointGap' | 'entered'
  >
): WarriorTournamentAdvice {
  // Breakpoint edge: frozen exactly at the class ceiling — the article's
  // exploit. Real bouts after the freeze can't move the class, so the usual
  // taper advice inverts: keep fighting for records, fame, and learns.
  if (breakpointGap === 1) {
    return {
      qualifiedTier: tierInfo?.tierId ?? null,
      tierName: tierInfo?.tierName ?? null,
      overallRank,
      isParticipant: false,
      weeksUntilTournament,
      status: 'CLASS_LOCKED',
      headline: `⚔️ Class locked at ${spec.name} — keep fighting`,
      details:
        `Frozen into ${spec.name} one bout under the breakpoint. Post-freeze fights ` +
        `add experience on top of the locked class — run them up for records and ` +
        `learns; the bracket can't bump you to the next class this cycle.`,
      ...classFields,
    };
  }
  if (entered) {
    return {
      qualifiedTier: tierInfo?.tierId ?? null,
      tierName: tierInfo?.tierName ?? null,
      overallRank,
      isParticipant: false,
      weeksUntilTournament,
      status: 'ENTERED',
      headline: `🎖️ Entered: ${spec.name} (${weeksUntilTournament} wk${weeksUntilTournament === 1 ? '' : 's'} out)`,
      details:
        `Locked into ${spec.name}. Taper fights and rest to reach the bracket ` +
        `at full strength — fatigue does not reset at the gate.`,
      ...classFields,
    };
  }
  return {
    qualifiedTier: tierInfo?.tierId ?? null,
    tierName: tierInfo?.tierName ?? null,
    overallRank,
    isParticipant: false,
    weeksUntilTournament,
    status: 'FREEZE_WATCH',
    headline: `Frozen out of ${spec.name} — declare at the Entry Desk`,
    details:
      `Class snapshot locked at ${spec.name} but no invite. Declarations close ` +
      `when brackets are drawn — enter before the window shuts.`,
    ...classFields,
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
