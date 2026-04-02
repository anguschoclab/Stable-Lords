import type { RivalStableData, Warrior } from "@/types/state.types";
import { checkBudget } from "./budgetWorker";
import { computeWarriorStats } from "../../skillCalc";
import { logAgentAction } from "../agentCore";

/**
 * RosterWorker: Handles training and equipment.
 * Implements "Risk-Tiered Execution" for gear.
 */
export function processRoster(
  rival: RivalStableData,
  currentWeek: number
): RivalStableData {
  let updatedRival = { ...rival };
  const activeRoster = updatedRival.roster.filter(w => w.status === "Active");
  const intent = updatedRival.strategy?.intent ?? "CONSOLIDATION";

  // 1. Training (Low Risk)
  const trainee = activeRoster[0];
  if (trainee && updatedRival.gold > 200) {
    const trainingCost = 35;
    const budgetReport = checkBudget(updatedRival, trainingCost, "ROSTER");
    
    if (budgetReport.isAffordable) {
      updatedRival.gold -= trainingCost;
      updatedRival.roster = updatedRival.roster.map(w => w.id === trainee.id ? performAITraining(w) : w);
      // No log needed for routine low-risk training to prevent bloat.
    }
  }

  // 2. Equipment (High Risk)
  if (intent === "EXPANSION" || (intent === "VENDETTA" && updatedRival.gold > 1000)) {
    const gearCost = 400;
    const budgetReport = checkBudget(updatedRival, gearCost, "ROSTER");
    
    if (budgetReport.isAffordable) {
      const luckyWarrior = activeRoster[Math.floor(Math.random() * activeRoster.length)];
      if (luckyWarrior) {
        updatedRival.gold -= gearCost;
        updatedRival.roster = updatedRival.roster.map(w => w.id === luckyWarrior.id ? applyGearUpgrade(w) : w);
        updatedRival = logAgentAction(updatedRival, "ROSTER", `Invested 400g in gear for ${luckyWarrior.name}.`, budgetReport.riskTier, currentWeek);
      }
    }
  }

  return updatedRival;
}

function applyGearUpgrade(w: Warrior): Warrior {
  const keys = (Object.keys(w.attributes) as (keyof typeof w.attributes)[]).filter(k => k !== "SZ");
  const newAttrs = { ...w.attributes };
  for (let i = 0; i < 2; i++) {
    const key = keys[Math.floor(Math.random() * keys.length)];
    if (newAttrs[key] < 25) newAttrs[key]++;
  }
  const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, w.style);
  return { ...w, attributes: newAttrs, baseSkills, derivedStats };
}

function performAITraining(w: Warrior): Warrior {
  const keys = (Object.keys(w.attributes) as (keyof typeof w.attributes)[]).filter(k => k !== "SZ");
  const sorted = keys.sort((a, b) => w.attributes[a] - w.attributes[b]);
  const chosen = sorted[0];
  if (w.attributes[chosen] < 25) {
    const newAttrs = { ...w.attributes, [chosen]: w.attributes[chosen] + 1 };
    const { baseSkills, derivedStats } = computeWarriorStats(newAttrs, w.style);
    return { ...w, attributes: newAttrs, baseSkills, derivedStats };
  }
  return w;
}
