import type { Warrior } from "@/types/warrior.types";

/**
 * Checks if a warrior is eligible for matchmaking in the current week.
 * Criteria:
 * 1. Must be "Active" (not Dead, Retired, etc.).
 * 2. Must not be currently in a mandatory rest period (e.g., from a recent KO or Injury).
 * 3. Must not be assigned to a training activity in the current turn.
 */
export function isEligible(
  w: Warrior, 
  week: number, 
  restMap: Map<string, number>, 
  trainingIds: Set<string>
): boolean {
  // 1. Status Check
  if (w.status !== "Active") return false;
  
  // 2. Rest Check
  const restUntil = restMap.get(w.id);
  if (restUntil !== undefined && restUntil > week) return false;
  
  // 3. Training Check
  if (trainingIds.has(w.id)) return false;
  
  return true;
}
