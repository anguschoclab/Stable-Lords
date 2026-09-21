import type {
  GameState,
  RivalStableData,
  AIEvent,
  AIAgentMemory,
  AIIntent,
  AIEventCause,
} from '@/types/state.types';
import { AI_INTENTS } from '@/types/enumSources';
import { hashStr } from '../../utils/random';
import { computeMetaDrift } from '../metaDrift';
import { refreshKnownRivals, updateDossiers } from './memory/intelDossier';
import type { PerceptionSnapshot } from './memory/perceptionSnapshot';

/**
 * LeadAgent Orchestrator
 * Encapsulates the turn logic for a single rival stable.
 * Implements "Skeptical Memory" and "Hierarchical Delegation".
 */
export type PlayerThreatLevel = 'Dominant' | 'Moderate' | 'Neutral';

/**
 * Defines the shape of agent context.
 */
export interface AgentContext {
  rival: RivalStableData;
  state: GameState;
  meta: Record<string, number>;
  playerThreatLevel: PlayerThreatLevel;
  /** Shared once-per-tick world view (built in RivalStrategyPass). */
  perception?: PerceptionSnapshot;
}

/**
 * Weeks of meta lag per owner: Methodical owners study the tapes and see the
 * current meta; everyone else reacts to 1–2 week old information.
 */
function metaLagWeeks(rival: RivalStableData): number {
  if (rival.owner.personality === 'Methodical') return 0;
  return 1 + (hashStr(`${rival.owner.id}|meta-lag`) % 2);
}

/**
 * The meta this agent *perceives* — lagged arena history for non-Methodical
 * owners so meta-awareness is a belief, not omniscience.
 */
function perceivedMeta(rival: RivalStableData, state: GameState): Record<string, number> {
  const lag = metaLagWeeks(rival);
  if (lag === 0) return state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);
  const cutoff = (state.absoluteWeek ?? state.week) - lag;
  const lagged = (state.arenaHistory || []).filter((f) => (f.absoluteWeek ?? f.week) <= cutoff);
  return computeMetaDrift(lagged);
}

/**
 * Create agent context.
 */
export function createAgentContext(
  rival: RivalStableData,
  state: GameState,
  perception?: PerceptionSnapshot
): AgentContext {
  // ⚡ Skeptical Memory: Initialize memory if missing
  const prior: AIAgentMemory = rival.agentMemory || {
    lastTreasury: rival.treasury,
    burnRate: 0,
    metaAwareness: {},
    knownRivals: [],
    opponentDossiers: {},
    currentIntent: 'CONSOLIDATION',
  };

  const agentMemory: AIAgentMemory = {
    ...prior,
    knownRivals: refreshKnownRivals(rival, state),
    opponentDossiers: updateDossiers(
      { ...rival, agentMemory: prior },
      state,
      perception?.weekFights
    ),
    metaAwareness: perceivedMeta(rival, state),
  };

  // ⚡ Continuous Alignment: full-fidelity meta for plan generation
  const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);

  // Player threat level from realm rankings — rivals use this to decide VENDETTA targets
  const playerThreatLevel = computePlayerThreatLevel(state);

  return {
    rival: { ...rival, agentMemory },
    state,
    meta,
    playerThreatLevel,
    ...(perception ? { perception } : {}),
  };
}

const isAIIntent = (cause: AIEventCause): cause is AIIntent =>
  (AI_INTENTS as readonly string[]).includes(cause);

/**
 * Logs an event to the agent's action history, maintaining "Daemon Limits" (pruning old logs).
 * `cause` is the typed reason for the action; when it is an AIIntent it also
 * updates agentMemory.currentIntent (no more description substring matching).
 */
export function logAgentAction(
  rival: RivalStableData,
  type: AIEvent['type'],
  description: string,
  riskTier: AIEvent['riskTier'],
  week: number,
  cause?: AIEventCause
): RivalStableData {
  const eventIndex = (rival.actionHistory || []).length;
  const eventId = `event-${hashStr(`${rival.owner.id}|${week}|${type}|${description}|${eventIndex}`).toString(16)}`;
  const newEvent: AIEvent = {
    id: eventId,
    week,
    type,
    description,
    riskTier,
    ...(cause !== undefined ? { cause } : {}),
  };
  const actionHistory = [newEvent, ...(rival.actionHistory || [])].slice(0, 20);

  const currentIntent: AIIntent =
    cause !== undefined && isAIIntent(cause)
      ? cause
      : (rival.agentMemory?.currentIntent ?? 'CONSOLIDATION');

  const agentMemory = { ...(rival.agentMemory || {}), currentIntent };
  return { ...rival, actionHistory, agentMemory: agentMemory as AIAgentMemory };
}

/**
 * Background Consolidation: Updates burn rate and long-term memory.
 * (Season record resets live in updateSeasonRecord so week-1 bout outcomes
 * are counted toward the new season rather than wiped.)
 */
export function consolidateAgentMemory(
  rival: RivalStableData,
  _currentWeek: number
): RivalStableData {
  if (!rival.agentMemory) return rival;

  const lastTreasury = rival.agentMemory.lastTreasury;
  const currentTreasury = rival.treasury;
  const burnRate = lastTreasury - currentTreasury;

  return {
    ...rival,
    agentMemory: {
      ...rival.agentMemory,
      lastTreasury: currentTreasury,
      burnRate,
    },
  };
}

/**
 * Computes how threatening the player is relative to the world,
 * based on their best warrior's realm ranking vs the world median.
 */
export function computePlayerThreatLevel(state: GameState): PlayerThreatLevel {
  const rankings = state.realmRankings;
  if (!rankings || Object.keys(rankings).length === 0) return 'Neutral';

  let playerBestRank: number | null = null;
  const roster = state.roster || [];

  // ⚡ Bolt: Replaced Object.entries(rankings) loop with a targeted iteration over the roster
  // This changes complexity from O(total realm rankings) to O(player roster size)
  // and avoids allocating a large array of key-value pairs per tick.
  for (let i = 0; i < roster.length; i++) {
    const warrior = roster[i];
    if (!warrior) continue;
    const entry = rankings[warrior.id];
    if (entry && (playerBestRank === null || entry.overallRank < playerBestRank)) {
      playerBestRank = entry.overallRank;
    }
  }

  if (playerBestRank === null) return 'Neutral';

  const totalRanked = Object.keys(rankings).length;
  const percentile = playerBestRank / Math.max(1, totalRanked);

  if (percentile <= 0.15) return 'Dominant';
  if (percentile <= 0.4) return 'Moderate';
  return 'Neutral';
}
