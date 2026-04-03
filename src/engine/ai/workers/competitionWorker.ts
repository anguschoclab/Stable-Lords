import { type RivalStableData, type Warrior } from "@/types/state.types";
import { logAgentAction } from "../agentCore";

/**
 * CompetitionWorker: Handles boutique reasoning, tournament entry, and matchmaking bids.
 * Implements "Skeptical Matchmaking" and "Targeted Competition".
 */

export interface BoutBid {
  proposingWarriorId: string;
  targetStableId?: string; // Specific ID for VENDETTA
  targetWarriorId?: string;
  minFame?: number;
  maxFame?: number;
  priority: number; // 1-10
}

export function generateBoutBids(
  rival: RivalStableData,
  currentWeek: number
): { bids: BoutBid[]; updatedRival: RivalStableData } {
  const intent = rival.strategy?.intent ?? "CONSOLIDATION";
  const activeRoster = rival.roster.filter(w => w.status === "Active");
  const bids: BoutBid[] = [];

  for (const warrior of activeRoster) {
    // ⚡ Skeptical Matchmaking: Don't fight if injured or exhausted (Handled by eligibility, but worker adds preference)
    
    if (intent === "VENDETTA" && rival.strategy?.targetStableId) {
      bids.push({
        proposingWarriorId: warrior.id,
        targetStableId: rival.strategy.targetStableId,
        priority: 10,
        description: "Assigned to Vendetta target."
      } as any);
    } else if (intent === "RECOVERY") {
      // Seek low-fame, low-risk opponents
      bids.push({
        proposingWarriorId: warrior.id,
        maxFame: 50,
        priority: 5,
        description: "Seeking low-risk recovery bout."
      } as any);
    } else if (intent === "EXPANSION") {
      // Seek high-visibility bouts
      bids.push({
        proposingWarriorId: warrior.id,
        minFame: 100,
        priority: 7,
        description: "Seeking high-visibility expansion bout."
      } as any);
    } else {
      // CONSOLIDATION: Standard parity bout
      bids.push({
        proposingWarriorId: warrior.id,
        priority: 3,
        description: "Standard training bout."
      } as any);
    }
  }

  return { bids, updatedRival: rival };
}

/**
 * verifyBoutAcceptance: A "Skeptical" check when another agent proposes a fight.
 */
export function verifyBoutAcceptance(
  rival: RivalStableData,
  warrior: Warrior,
  opponent: Warrior,
  opponentStable: RivalStableData
): { accepted: boolean; reason?: string } {
  const intent = rival.strategy?.intent ?? "CONSOLIDATION";
  
  // Skeptical Check: RECOVERY agents refuse fights with "Killers"
  if (intent === "RECOVERY") {
    if (opponent.career.kills > 0 || (opponent.fame || 0) > (warrior.fame || 0) + 100) {
      return { accepted: false, reason: "Too risky for recovery phase." };
    }
  }

  // Skeptical Check: AGGRESSIVE agents accept most things
  if (rival.owner.personality === "Aggressive") {
    return { accepted: true };
  }

  // Default: Accept unless it's a massive fame gap
  if ((opponent.fame || 0) > (warrior.fame || 0) + 300) {
    return { accepted: false, reason: "Opponent outclasses us significantly." };
  }

  return { accepted: true };
}
