import type { 
  GameState, 
  RivalStableData, 
  AIEvent, 
  AIAgentMemory,
  AIIntent
} from "@/types/state.types";
import { computeMetaDrift } from "../metaDrift";

/**
 * LeadAgent Orchestrator
 * Encapsulates the turn logic for a single rival stable.
 * Implements "Skeptical Memory" and "Hierarchical Delegation".
 */
export interface AgentContext {
  rival: RivalStableData;
  state: GameState;
  meta: Record<string, number>;
}

export function createAgentContext(rival: RivalStableData, state: GameState): AgentContext {
  // ⚡ Skeptical Memory: Initialize memory if missing
  const agentMemory: AIAgentMemory = rival.agentMemory || {
    lastGold: rival.gold,
    burnRate: 0,
    metaAwareness: {},
    knownRivals: state.rivals ? state.rivals.map(r => r.owner.id).filter(id => id !== rival.owner.id) : []
  };

  // ⚡ Continuous Alignment: Compute meta awareness from current arena history
  const meta = computeMetaDrift(state.arenaHistory || []);

  return {
    rival: { ...rival, agentMemory },
    state,
    meta
  };
}

/**
 * Logs an event to the agent's action history, maintaining "Daemon Limits" (pruning old logs).
 */
export function logAgentAction(
  rival: RivalStableData, 
  type: AIEvent["type"], 
  description: string, 
  riskTier: AIEvent["riskTier"],
  week: number
): RivalStableData {
  const newEvent: AIEvent = { week, type, description, riskTier };
  const actionHistory = [newEvent, ...(rival.actionHistory || [])].slice(0, 20); // Prune to last 20 events
  return { ...rival, actionHistory };
}

/**
 * Background Consolidation: Updates burn rate and long-term memory.
 */
export function consolidateAgentMemory(rival: RivalStableData, currentWeek: number): RivalStableData {
  if (!rival.agentMemory) return rival;

  const lastGold = rival.agentMemory.lastGold;
  const currentGold = rival.gold;
  const burnRate = lastGold - currentGold;

  return {
    ...rival,
    agentMemory: {
      ...rival.agentMemory,
      lastGold: currentGold,
      burnRate
    }
  };
}
