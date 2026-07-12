import type {
  GameState,
  RivalStableData,
  AIEvent,
  AIAgentMemory,
  AIIntent,
} from '@/types/state.types';
import { hashStr } from '../../utils/random';
import { computeMetaDrift } from '../metaDrift';

/**
 * LeadAgent Orchestrator
 * Encapsulates the turn logic for a single rival stable.
 * Implements "Skeptical Memory" and "Hierarchical Delegation".
 */
export type PlayerThreatLevel = 'Dominant' | 'Moderate' | 'Neutral'; /**
 * Defines the shape of agent context.
 */

/**
 * Defines the shape of agent context.
 */
export interface AgentContext {
  rival: RivalStableData;
  state: GameState;
  meta: Record<string, number>;
  playerThreatLevel: PlayerThreatLevel;
} /**
 * Create agent context.
 */

/**
 * Create agent context.
 */
export function createAgentContext(rival: RivalStableData, state: GameState): AgentContext {
  // ⚡ Skeptical Memory: Initialize memory if missing
  const agentMemory: AIAgentMemory = rival.agentMemory || {
    lastTreasury: rival.treasury,
    burnRate: 0,
    metaAwareness: {},
    knownRivals: state.rivals
      ? state.rivals.map((r) => r.owner.id).filter((id) => id !== rival.owner.id)
      : [],
    currentIntent: 'CONSOLIDATION',
  };

  // ⚡ Continuous Alignment: Compute meta awareness from current arena history (use cached if available)
  const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);

  // Player threat level from realm rankings — rivals use this to decide VENDETTA targets
  const playerThreatLevel = computePlayerThreatLevel(state);

  return {
    rival: { ...rival, agentMemory },
    state,
    meta,
    playerThreatLevel,
  };
}

/**
 * Logs an event to the agent's action history, maintaining "Daemon Limits" (pruning old logs).
 */
export function logAgentAction(
  rival: RivalStableData,
  type: AIEvent['type'],
  description: string,
  riskTier: AIEvent['riskTier'],
  week: number
): RivalStableData {
  const eventIndex = (rival.actionHistory || []).length;
  const eventId = `event-${hashStr(`${rival.owner.id}|${week}|${type}|${description}|${eventIndex}`).toString(16)}`;
  const newEvent: AIEvent = {
    id: eventId,
    week,
    type,
    description,
    riskTier,
  };
  const actionHistory = [newEvent, ...(rival.actionHistory || [])].slice(0, 20);

  // ⚡ Intent Recognition: Infer intent from action type
  let currentIntent: AIIntent = rival.agentMemory?.currentIntent || 'CONSOLIDATION';
  if (type === 'FINANCE' && (description.includes('hoard') || description.includes('saving')))
    currentIntent = 'WEALTH_ACCUMULATION';
  if (
    type === 'STRATEGY' &&
    (description.includes('aggressive') || description.includes('dominance'))
  )
    currentIntent = 'AGGRESSIVE_EXPANSION';
  if (type === 'ROSTER' && (description.includes('scout') || description.includes('diversify')))
    currentIntent = 'ROSTER_DIVERSITY';

  const agentMemory = { ...(rival.agentMemory || {}), currentIntent };
  return { ...rival, actionHistory, agentMemory: agentMemory as AIAgentMemory };
}

/**
 * Background Consolidation: Updates burn rate and long-term memory.
 * Resets seasonRecord on week 1 (season boundary).
 */
export function consolidateAgentMemory(
  rival: RivalStableData,
  currentWeek: number
): RivalStableData {
  if (!rival.agentMemory) return rival;

  const lastTreasury = rival.agentMemory.lastTreasury;
  const currentTreasury = rival.treasury;
  const burnRate = lastTreasury - currentTreasury;

  const isSeasonBoundary = currentWeek === 1;
  const seasonRecord = isSeasonBoundary
    ? {
        wins: 0,
        losses: 0,
        kills: 0,
        rosterSizeAtSeasonStart: rival.roster.reduce(
          (count, w) => (w.status === 'Active' ? count + 1 : count),
          0
        ),
      }
    : rival.agentMemory.seasonRecord;

  return {
    ...rival,
    agentMemory: {
      ...rival.agentMemory,
      lastTreasury: currentTreasury,
      burnRate,
      ...(seasonRecord !== undefined ? { seasonRecord } : {}),
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
