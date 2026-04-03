import { type GameState } from "@/types/game";
import { advanceWeek } from "@/state/gameStore";
import { processWeekBouts } from "@/engine/boutProcessor";
import { populateInitialWorld } from "@/engine/core/worldSeeder";
import { createFreshState } from "@/engine/factories";
import { collectPulse, type SimPulse } from "@/engine/stats/simulationMetrics";

export interface SimulationConfig {
  weeks: number;
  seed: number;
  logFrequency?: number; // Log every N weeks
}

export interface SimulationResult {
  finalState: GameState;
  pulses: SimPulse[];
}

/**
 * Run a headless simulation loop.
 * Synchronous and deterministic.
 */
export function runSimulation(config: SimulationConfig): SimulationResult {
  const { weeks, seed, logFrequency = 1 } = config;
  
  // 1. Initialize State
  const fresh = createFreshState();
  let state = populateInitialWorld(fresh, seed);
  const pulses: SimPulse[] = [];

  // 2. Main Loop
  for (let w = 1; w <= weeks; w++) {
    // Process Bouts
    const processed = processWeekBouts(state);
    
    // Advance Week
    state = advanceWeek(processed.state);

    // Collect Data
    if (w % logFrequency === 0 || w === weeks) {
      pulses.push(collectPulse(state));
    }

    // Stop Conditions (Optional)
    if (state.roster.length === 0 && state.gold < 100) {
      console.warn(`[Sim] Failure at week ${w}: Stable Bankrupt/Empty.`);
      break;
    }
  }

  return {
    finalState: state,
    pulses
  };
}
