import { type GameState } from "@/types/game";

export interface SimPulse {
  week: number;
  playerGold: number;
  rosterSize: number;
  deadCount: number;
  retiredCount: number;
  rivalCount: number;
  avgRivalGold: number;
  totalBouts: number;
}

/**
 * Collect a snapshot of metrics from the current game state.
 */
export function collectPulse(state: GameState): SimPulse {
  const activeRivals = state.rivals || [];
  const avgRivalGold = activeRivals.length > 0 
    ? activeRivals.reduce((sum, r) => sum + r.gold, 0) / activeRivals.length 
    : 0;

  return {
    week: state.week,
    playerGold: state.gold,
    rosterSize: state.roster.length,
    deadCount: state.graveyard.length,
    retiredCount: state.retired.length,
    rivalCount: activeRivals.length,
    avgRivalGold: Math.round(avgRivalGold),
    totalBouts: state.arenaHistory.length,
  };
}

/**
 * Formats a list of pulses into a console table-friendly format.
 */
export function formatPulseTable(pulses: SimPulse[]): string {
  if (pulses.length === 0) return "No data";
  
  const header = "Week | Gold | Roster | Dead | Rivals | Avg Rival Gold";
  const divider = "---- | ---- | ------ | ---- | ------ | --------------";
  const rows = pulses.map(p => 
    `${p.week.toString().padEnd(4)} | ${p.playerGold.toString().padEnd(4)} | ${p.rosterSize.toString().padEnd(6)} | ${p.deadCount.toString().padEnd(4)} | ${p.rivalCount.toString().padEnd(6)} | ${p.avgRivalGold}`
  );

  return [header, divider, ...rows].join("\n");
}
