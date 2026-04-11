import type { GameState, RivalStableData } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { logAgentAction } from "../ai/agentCore";
import { generateBoutBids, verifyBoutAcceptance, BoutBid } from "../ai/workers/competitionWorker";
import { AIPoolWarrior } from "./aiPoolCollector";
import { StateImpact } from "@/engine/impacts";

/** Stablemates cannot fight each other */
function disallowStablemates(aStableId: string, dStableId: string): boolean {
  return !!aStableId && !!dStableId && aStableId === dStableId;
}

/**
 * Reconciles AI bout bids into pairings.
 * 1. Collect bids from all eligible agents.
 * 2. Reconcile bids into pairings.
 * 3. Skeptical verify acceptance.
 */
export function reconcileBidsIntoPairings(
  pool: AIPoolWarrior[],
  rivals: RivalStableData[],
  state: GameState,
  seed?: number,
  rng?: IRNGService
): { boutPairs: { a: AIPoolWarrior; d: AIPoolWarrior }[]; impact: StateImpact } {
  const rngSnapshot = rng || new SeededRNGService(seed ?? (state.week * 7919 + 202));
  const maxBouts = Math.min(Math.floor(pool.length / 2), 6); 
  const paired = new Set<string>();
  const boutPairs: { a: AIPoolWarrior; d: AIPoolWarrior }[] = [];
  const rivalsUpdates = new Map<string, Partial<RivalStableData>>();

  // A) Collect Bids
  const allBids: { rivalIdx: number; bids: BoutBid[] }[] = rivals.map((r, idx) => ({
    rivalIdx: idx,
    bids: generateBoutBids(r, state.week, state.weather, state.crowdMood).bids 
  }));

  // Sort bids by priority (VENDETTA highest)
  const flattenedBids = allBids.flatMap(ab => ab.bids.map(b => ({ ...b, rivalIdx: ab.rivalIdx })))
    .sort((a, b) => b.priority - a.priority);

  // B) Reconcile Bids
  for (const bid of flattenedBids) {
    if (paired.has(bid.proposingWarriorId) || boutPairs.length >= maxBouts) continue;

    const attackerPoolEntry = pool.find(p => p.warrior.id === bid.proposingWarriorId);
    if (!attackerPoolEntry) continue;

    // Find best defender based on bid criteria
    const candidates = pool.filter(p => {
      if (paired.has(p.warrior.id)) return false;
      if (disallowStablemates(attackerPoolEntry.stableId, p.stableId)) return false;

      // Bid Filters
      if (bid.targetStableId && p.stableId !== bid.targetStableId) return false;
      if (bid.targetWarriorId && p.warrior.id !== bid.targetWarriorId) return false;
      if (bid.minFame && (p.warrior.fame || 0) < bid.minFame) return false;
      if (bid.maxFame && (p.warrior.fame || 0) > bid.maxFame) return false;

      return true;
    });

    if (candidates.length > 0) {
      const d = rngSnapshot.pick(candidates);
      
      // Skeptical Acceptance Check for the Defender
      const defenderStable = rivals.find(r => r.owner.id === d.stableId);
      const attackerStable = rivals[bid.rivalIdx];
      
      if (defenderStable && attackerPoolEntry && d) {
        const decision = verifyBoutAcceptance(defenderStable, d.warrior, attackerPoolEntry.warrior, attackerStable, state.weather);
        
        if (decision.accepted) {
          boutPairs.push({ a: attackerPoolEntry, d });
          paired.add(attackerPoolEntry.warrior.id);
          paired.add(d.warrior.id);
          
          const updatedAttacker = logAgentAction(attackerStable, "STRATEGY", `Proposed bout: ${attackerPoolEntry.warrior.name} vs ${d.warrior.name} - ${bid.description}`, "Medium", state.week);
          rivalsUpdates.set(attackerStable.owner.id, updatedAttacker);
          
          const updatedDefender = logAgentAction(defenderStable, "STRATEGY", `Accepted bout: ${d.warrior.name} vs ${attackerPoolEntry.warrior.name} from ${attackerStable.owner.stableName}.`, "Low", state.week);
          rivalsUpdates.set(defenderStable.owner.id, updatedDefender);
        } else {
          const updatedDefender = logAgentAction(defenderStable, "STRATEGY", `Declined bout for ${d.warrior.name}: ${decision.reason}`, "Low", state.week);
          rivalsUpdates.set(defenderStable.owner.id, updatedDefender);
        }
      }
    }
  }

  return { boutPairs, impact: { rivalsUpdates } };
}
