import type {
  GameState,
  RivalStableData,
  WeatherType,
  Warrior,
} from '@/types/state.types';
import type { PromoterId } from '@/types/shared.types';
import { type CrowdMood } from '@/engine/bout/crowdMood';
import { scorePairwiseMatchup } from '@/engine/matchmaking/schedulingAssistant';
import { weatherBidModifier } from '@/engine/ai/weatherSuitability';
import type { BoutBid } from '../types';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { clamp } from '@/utils/math';
import { isActive } from '@/engine/warrior/warriorStatus';
import { isChampionBookingLocked } from '@/engine/championship/arenaChampionship';

export const BID_MATCHMAKING_ID = 'BID_MATCHMAKING' as PromoterId;

/** Player-bound offer caps: ≤1 per proposing stable, ≤3 globally per week. */
export const MAX_PLAYER_OFFERS_PER_RIVAL = 1;
export const MAX_PLAYER_OFFERS_GLOBAL = 3;
/** Priority bonus for a rival warrior the player has marked as a challenge. */
const CHALLENGED_BID_BONUS = 3;

interface MatchupContext {
  intent: string;
  targetStableId?: string;
  targetIsPlayer: boolean;
  targetRival?: RivalStableData;
  playerTargets: Warrior[];
  nonVendettaOpponents: Warrior[];
  state?: GameState;
  rivalId: string;
}

/**
 * Scheduling Assistant: best pairwise matchup score across the intent-
 * appropriate opponent pool (G18 — no player semantics in the scoring itself).
 */
function bestMatchupModifier(warrior: Warrior, ctx: MatchupContext): number {
  let matchupModifier = -Infinity;
  let foundOpponent = false;
  if (ctx.intent === 'VENDETTA' && ctx.targetStableId) {
    const targetPool = ctx.targetIsPlayer ? ctx.playerTargets : (ctx.targetRival?.roster ?? []);
    for (const opponent of targetPool) {
      if (!isActive(opponent)) continue;
      if (ctx.state && isChampionBookingLocked(ctx.state, opponent.id)) continue;
      const matchupScore = scorePairwiseMatchup(warrior, opponent, {
        aStableId: (warrior.stableId ?? ctx.rivalId) as string,
        bStableId:
          ctx.targetIsPlayer && ctx.state
            ? (ctx.state.player.id as string)
            : ((opponent.stableId ?? ctx.targetStableId) as string),
      });
      const score = clamp((matchupScore - 100) / 20, -5, 5);
      matchupModifier = Math.max(matchupModifier, score);
      foundOpponent = true;
    }
  } else if (ctx.intent !== 'VENDETTA') {
    for (const opponent of ctx.nonVendettaOpponents) {
      const matchupScore = scorePairwiseMatchup(warrior, opponent, {
        aStableId: (warrior.stableId ?? ctx.rivalId) as string,
        bStableId: opponent.stableId as string,
      });
      const score = clamp((matchupScore - 100) / 20, -5, 5);
      matchupModifier = Math.max(matchupModifier, score);
      foundOpponent = true;
    }
  }
  return foundOpponent ? matchupModifier : 0;
}

/**
 *
 */
export interface GenerateBoutBidsArgs {
  rival: RivalStableData;
  _currentWeek: number;
  weather?: WeatherType;
  crowdMood?: CrowdMood;
  rivals?: RivalStableData[];
  state?: GameState;
}

/**
 * Generate bout bids for a rival stable. When `state` is supplied the agent is
 * player-aware: vendettas may target the player roster, the player's
 * challenge/avoid marks steer contact, and per-stable training assignments
 * suppress bids.
 */
export function generateBoutBids(args: GenerateBoutBidsArgs): { bids: BoutBid[]; updatedRival: RivalStableData } {
  const { rival, weather = 'Clear', crowdMood = 'Calm', rivals = [] } = args;
  const { state } = args;
  const intent = rival.strategy?.intent ?? 'CONSOLIDATION';
  const activeRoster = bookableRoster(rival, state);
  const bids: BoutBid[] = [];

  const matchupCtx = buildMatchupCtx(rival, intent, rivals, state);
  const personality = rival.owner.personality ?? 'Pragmatic';

  for (const warrior of activeRoster) {
    const bid = emitWarriorBid(warrior, rival, intent, personality, {
      weather,
      crowdMood,
      state,
      matchupCtx,
      targetIsPlayer: matchupCtx.targetIsPlayer,
    });
    if (bid) bids.push(bid);
  }

  return { bids, updatedRival: rival };
}

/** Warriors free to propose bouts: active, unassigned, unsigned, not title-locked. */
function bookableRoster(rival: RivalStableData, state?: GameState): Warrior[] {
  const assignedIds = new Set((rival.trainingAssignments ?? []).map((a) => a.warriorId));
  // Warriors already committed to a signed upcoming bout don't re-enter the
  // pool — a signed title shot (or any booked fight) shouldn't double-book.
  const signedIds = new Set<string>();
  if (state) {
    const now = state.absoluteWeek ?? state.week;
    for (const offer of Object.values(state.boutOffers ?? {})) {
      if (offer.status !== 'Signed') continue;
      if (boutOfferAbsoluteWeek(offer) <= now) continue;
      for (const wId of offer.warriorIds) signedIds.add(wId as string);
    }
  }
  return rival.roster.filter(
    (w) =>
      isActive(w) &&
      !assignedIds.has(w.id) &&
      !signedIds.has(w.id) &&
      // Booking-locked arena champions only fight title bouts.
      !(state && isChampionBookingLocked(state, w.id))
  );
}

/** Pre-computed vendetta targets and opponent pools for matchup scoring. */
function buildMatchupCtx(
  rival: RivalStableData,
  intent: string,
  rivals: RivalStableData[],
  state?: GameState
): MatchupContext {
  // Pre-calculate vendetta target once outside the loop to prevent O(W * R) lookups
  const targetStableId = rival.strategy?.targetStableId;
  const targetIsPlayer =
    state !== undefined && targetStableId !== undefined && targetStableId === state.player.id;
  const targetRival =
    intent === 'VENDETTA' && targetStableId && !targetIsPlayer
      ? rivals.find((r) => r.id === targetStableId || r.owner.id === targetStableId)
      : undefined;

  // Player warriors the vendetta may target (active only; booking filtered at conversion)
  const playerTargets: Warrior[] =
    intent === 'VENDETTA' && targetIsPlayer && state
      ? state.roster.filter((w) => isActive(w) && !isChampionBookingLocked(state, w.id))
      : [];

  // Pre-calculate active opponents for non-vendetta intents — booking-locked
  // champions are excluded as bid targets as well as proposers.
  const nonVendettaOpponents: Warrior[] = [];
  if (intent !== 'VENDETTA') {
    for (const r of rivals) {
      if (r.id === rival.id) continue;
      for (const w of r.roster) {
        if (isActive(w) && !(state && isChampionBookingLocked(state, w.id)))
          nonVendettaOpponents.push(w);
      }
    }
  }

  return {
    intent,
    targetStableId,
    targetIsPlayer,
    targetRival,
    playerTargets,
    nonVendettaOpponents,
    state,
    rivalId: rival.id,
  };
}

interface BidEnv {
  weather: WeatherType;
  crowdMood: CrowdMood;
  state?: GameState;
  matchupCtx: MatchupContext;
  targetIsPlayer: boolean;
}

/** Emit a single warrior's bid under the rival's current intent, or none. */
function emitWarriorBid(
  warrior: Warrior,
  rival: RivalStableData,
  intent: string,
  personality: string,
  env: BidEnv
): BoutBid | null {
  const { weather, crowdMood, state } = env;
  const weatherModifier = weatherBidModifier(warrior, weather);

  // Crowd Pandering
  let moodModifier = 0;
  if (crowdMood === 'Bloodthirsty' && personality === 'Aggressive') moodModifier = +3;
  if (crowdMood === 'Theatrical' && personality === 'Showman') moodModifier = +3;

  const matchupModifier = bestMatchupModifier(warrior, env.matchupCtx);

  const warriorIsChallenged = state !== undefined && state.playerChallenges?.includes(warrior.id);
  const warriorIsAvoided = state !== undefined && state.playerAvoids?.includes(warrior.id);

  if (intent === 'VENDETTA' && rival.strategy?.targetStableId) {
    // Player-bound vendetta: the player's avoid list vetoes this warrior.
    if (env.targetIsPlayer && warriorIsAvoided) return null;
    return {
      proposingWarriorId: warrior.id,
      targetStableId: rival.strategy.targetStableId,
      priority: Math.max(1, 10 + weatherModifier + moodModifier + matchupModifier),
      description: `Vendetta target. ${weatherModifier < 0 ? '(Weather caution)' : weatherModifier > 0 ? '(Weather advantage)' : ''} ${matchupModifier > 0 ? '(Favorable matchup)' : matchupModifier < 0 ? '(Unfavorable matchup)' : ''}`,
    };
  }
  if (intent === 'VENDETTA') return null;
  // SURVIVAL: no proactive bids — a stable that cannot cover its burn
  // cannot risk a warrior on a bout it does not need.
  if (intent === 'SURVIVAL') return null;
  if (
    intent === 'CROWN_CAMPAIGN' &&
    rival.strategy?.targetArenaId &&
    rival.agentMemory?.crownAssessment?.warriorId === warrior.id
  ) {
    // The campaign warrior's ordinary bookings are pinned to the target
    // arena — every venue bout there feeds contender ranking.
    return {
      proposingWarriorId: warrior.id,
      arenaId: rival.strategy.targetArenaId,
      priority: Math.max(1, 9 + weatherModifier + moodModifier + matchupModifier),
      description: `Crown campaign — climbing the ladder at ${rival.strategy.targetArenaId}.`,
    };
  }
  if (warriorIsChallenged && state && !warriorIsAvoided) {
    // The player publicly challenged this warrior — the stable answers.
    return {
      proposingWarriorId: warrior.id,
      targetStableId: state.player.id,
      priority: Math.max(
        1,
        8 + weatherModifier + moodModifier + matchupModifier + CHALLENGED_BID_BONUS
      ),
      description: 'Answering the challenge the player issued.',
    };
  }
  if (intent === 'RECOVERY') {
    if (weatherModifier < -2) return null;
    return {
      proposingWarriorId: warrior.id,
      maxFame: 50,
      priority: Math.max(1, 5 + moodModifier + matchupModifier),
      description: 'Seeking low-risk recovery bout.',
    };
  }
  if (intent === 'EXPANSION') {
    return {
      proposingWarriorId: warrior.id,
      minFame: 100,
      priority: Math.max(1, 7 + weatherModifier + moodModifier + matchupModifier),
      description: 'Seeking high-visibility expansion bout.',
    };
  }
  return {
    proposingWarriorId: warrior.id,
    priority: Math.max(1, 4 + weatherModifier + moodModifier + matchupModifier),
    description: 'Standard training bout.',
  };
}
