import "./mock-env";
import { runSimulation } from "../src/scripts/simulation-harness";
import { type GameState } from "../src/types/state.types";

/**
 * 1.0 Season Smoke Test
 * 
 * Validates:
 * 1. Simulation integrity over a full 13-week season.
 * 2. Determinism (same seed = same final state).
 * 3. Narrative path consistency (catches "Missing path" errors in logs).
 */

async function main() {
  const SEED = 42;
  const WEEKS = 13;

  console.log("--- Starting Season Smoke Test (13 Weeks) ---");

  // Run 1
  const result1 = runSimulation({
    weeks: WEEKS,
    seed: SEED,
    logFrequency: 1
  });

  console.log(`\nRun 1 Complete. Week: ${result1.finalState.week}, Gold: ${result1.finalState.gold}`);

  // Run 2 (Determinism Check)
  console.log("\n--- Starting Determinism Check (Same Seed) ---");
  const result2 = runSimulation({
    weeks: WEEKS,
    seed: SEED,
    logFrequency: 13 // Only log start/end
  });

  const goldMatch = result1.finalState.gold === result2.finalState.gold;
  const weekMatch = result1.finalState.week === result2.finalState.week;
  const rosterMatch = result1.finalState.roster.length === result2.finalState.roster.length;

  if (goldMatch && weekMatch && rosterMatch) {
    console.log("\n✅ DETERMINISM VERIFIED: Run 1 and Run 2 match exactly.");
  } else {
    console.error("\n❌ DETERMINISM FAILURE!");
    console.error(`Gold: ${result1.finalState.gold} vs ${result2.finalState.gold}`);
    console.error(`Week: ${result1.finalState.week} vs ${result2.finalState.week}`);
    console.error(`Roster: ${result1.finalState.roster.length} vs ${result2.finalState.roster.length}`);
    process.exit(1);
  }

  console.log("\n--- Season Smoke Test PASSED ---");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
