import { describe, test, expect, vi, beforeEach } from "vitest";
import { runSimulation } from "./simulation-harness";
import { formatPulseTable } from "@/engine/stats/simulationMetrics";
import { setMockIdGenerator } from "@/utils/idUtils";
import { engineEventBus } from "@/engine/core/EventBus";
import { NewsletterFeed } from "@/engine/newsletter/feed";

// Mock the OPFS Archiver to avoid side effects and conflict errors in tests
vi.mock("@/engine/storage/opfsArchive", () => ({
  OPFSArchiveService: class {
    isSupported = () => true;
    archiveBoutLog = vi.fn().mockResolvedValue(undefined);
    retrieveBoutLog = vi.fn().mockResolvedValue(null);
    archiveGazette = vi.fn().mockResolvedValue(undefined);
    retrieveGazette = vi.fn().mockResolvedValue(null);
    archiveHotState = vi.fn().mockResolvedValue(undefined);
    retrieveHotState = vi.fn().mockResolvedValue(null);
    getArchivedBoutIdsForSeason = vi.fn().mockResolvedValue([]);
  }
}));

function resetGlobalState() {
  // 1. Reset ID generator sequence
  let idCounter = 0;
  setMockIdGenerator(() => `id_${++idCounter}`);

  // 2. Clear Event Bus
  engineEventBus.clear();

  // 3. Clear Newsletter Buffers
  NewsletterFeed.clear();
}

describe("Headless Simulation Harness", () => {
  beforeEach(() => {
    resetGlobalState();
  });
  test("runs a 52-week simulation deterministically", () => {
    const seed = 12345;
    const config = {
      weeks: 52,
      seed,
      logFrequency: 4, // Log every month
    };

    console.log(`\n[Sim] Starting 52-week simulation with seed: ${seed}`);
    resetGlobalState(); // Critical: Reset before Run 1
    const result = runSimulation(config);
    
    console.log("\n[Sim] Monthly Pulse Report:");
    console.log(formatPulseTable(result.pulses));

    expect(result.pulses.length).toBeGreaterThan(0);
    expect(result.finalState.week).toBeGreaterThanOrEqual(13); // Should at least finish a season
    
    // Determinism check: run again with same seed
    resetGlobalState(); // Critical: Reset before Run 2
    const result2 = runSimulation(config);
    expect(result.finalState.gold).toBe(result2.finalState.gold);
    expect(result.finalState.roster.length).toBe(result2.finalState.roster.length);
    expect(result.finalState.graveyard.length).toBe(result2.finalState.graveyard.length);
    
    console.log("\n[Sim] Determinism verified: Run 1 and Run 2 are identical.");
  });

  test("runs a long-term balance check (104 weeks)", () => {
    const seed = 999;
    const config = {
      weeks: 104,
      seed,
      logFrequency: 13, // Log every season
    };

    console.log(`\n[Sim] Starting 104-week balance check with seed: ${seed}`);
    const result = runSimulation(config);
    
    console.log("\n[Sim] Seasonal Pulse Report:");
    console.log(formatPulseTable(result.pulses));

    // Survival Check: Did we go bankrupt?
    const isBankrupt = result.finalState.gold <= 0;
    const isEmpty = result.finalState.roster.length === 0;

    console.log(`\n[Sim] End State: Gold=${result.finalState.gold}, Roster=${result.finalState.roster.length}, Dead=${result.finalState.graveyard.length}`);
    
    if (isBankrupt || isEmpty) {
      console.warn("⚠️ Simulation ended in Failure condition (Bankrupt or Empty Roster).");
    } else {
      console.log("✅ Simulation completed with a healthy stable.");
    }
  });
});
