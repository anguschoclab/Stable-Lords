import type { GameState, RivalStableData, TrainerData } from "@/types/state.types";
import { processStaff } from "./workers/staffWorker";
import { processRoster } from "./workers/rosterWorker";
import { consolidateAgentMemory, createAgentContext } from "./agentCore";

const FIGHT_PURSE = 75;
const WIN_BONUS = 40;
const FAME_DIVIDEND = 2;
const WARRIOR_UPKEEP = 55;
const BASE_OPS_COST = 20;

// Trainer Economics (Salary)
const SALARY: Record<string, number> = { Novice: 10, Seasoned: 25, Master: 75 };

/**
 * processAIStable - The Lead Agent Orchestrator for a Rival Stable.
 * Implements "Hierarchical Delegation" and "Context Isolation".
 */
export function processAIStable(
  rival: RivalStableData,
  state: GameState
): { updatedRival: RivalStableData; isBankrupt: boolean; gazetteItems: string[]; updatedHiringPool: TrainerData[] } {
  // 1. Initialize Context & Skeptical Memory
  const context = createAgentContext(rival, state);
  let updatedRival = { ...context.rival };
  const activeRoster = updatedRival.roster.filter(w => w.status === "Active");
  let currentHiringPool = [...(state.hiringPool || [])];
  const gazetteItems: string[] = [];

  // 2. Calculate Weekly Income (Fights + Fame)
  let weeklyIncome = 0;
  const weekFights = state.arenaHistory.filter(f => f.week === state.week);
  for (const f of weekFights) {
    const isOwnerA = updatedRival.owner.id === f.stableA;
    const isOwnerD = updatedRival.owner.id === f.stableD;
    if (isOwnerA || isOwnerD) {
      weeklyIncome += FIGHT_PURSE;
      if ((isOwnerA && f.winner === "A") || (isOwnerD && f.winner === "D")) {
        weeklyIncome += WIN_BONUS;
      }
    }
  }
  const totalFame = activeRoster.reduce((sum, w) => sum + (w.fame || 0), 0);
  weeklyIncome += totalFame * FAME_DIVIDEND;

  // 3. Delegate to Workers (Hierarchical Delegation)
  
  // A) StaffWorker (Hiring/Firing)
  const staffResult = processStaff(updatedRival, state, currentHiringPool);
  updatedRival = staffResult.updatedRival;
  currentHiringPool = staffResult.updatedHiringPool;
  gazetteItems.push(...staffResult.gazetteItems);

  // B) RosterWorker (Training/Gear)
  updatedRival = processRoster(updatedRival, state.week);

  // 4. Calculate Final Expenses
  let weeklyExpenses = BASE_OPS_COST;
  weeklyExpenses += activeRoster.length * WARRIOR_UPKEEP;
  weeklyExpenses += (updatedRival.trainers || []).reduce((sum, t) => sum + (SALARY[t.tier] || 10), 0);

  // 5. Update Gold & Check Bankruptcy (Risk Control)
  const goldDelta = weeklyIncome - weeklyExpenses;
  const newGold = updatedRival.gold + goldDelta;
  const isBankrupt = newGold <= 0;
  
  updatedRival.gold = newGold;

  if (isBankrupt) {
    gazetteItems.push(`📉 BANKRUPTCY: ${updatedRival.owner.stableName} has collapsed under its debts.`);
  }

  // 6. Background Consolidation: Prune logs and update burn rate in memory
  updatedRival = consolidateAgentMemory(updatedRival, state.week);

  return {
    updatedRival,
    isBankrupt,
    gazetteItems,
    updatedHiringPool: currentHiringPool
  };
}
