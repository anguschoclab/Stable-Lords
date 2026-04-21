import type { GameState, Warrior, RivalStableData } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { archiveWeekLogs } from "../adapters/opfsArchiver";
import { computeMetaDrift } from "@/engine/metaDrift";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { resolveImpacts, StateImpact } from "@/engine/impacts";

// 🌩️ Modular Pipeline Passes
import { runBoutSimulationPass } from "../passes/BoutSimulationPass";
import { runWarriorPass } from "../passes/WarriorPass";
import { runEconomyPass } from "../passes/EconomyPass";
import { runEquipmentPass } from "../passes/EquipmentPass";
import { runWorldPass } from "../passes/WorldPass";
import { runRecruitmentPass } from "../passes/RecruitmentPass";
import { runSystemPass } from "../passes/SystemPass";
import { runRankingsPass } from "../passes/RankingsPass";
import { runPromoterPass } from "../passes/PromoterPass";
import { runPromoterLifecyclePass } from "../passes/PromoterLifecyclePass";
import { runTrainerPass } from "../passes/TrainerPass";
import { runRivalStrategyPass } from "../passes/RivalStrategyPass";
import { runEventPass } from "../passes/EventPass";
import { runNarrativePass } from "../passes/NarrativePass";

/**
 * Stable Lords — Consolidated Weekly Pipeline (1.0 Hardened)
 * Orchestrates the simulation tick using a high-performance batched architecture.
 */
export function advanceWeek(state: GameState): GameState {
  console.log("[advanceWeek] START week", state.week);
  // 1. Preparation & Temporal Logic
  const currentWeek = state.week;
  let nextWeek = currentWeek + 1;
  let nextYear = state.year || 1;

  if (nextWeek > 52) {
    nextWeek = 1;
    nextYear++;
  }

  // Consistent Root RNG for the new week
  const rootRng = new SeededRNGService(nextYear * 52 + nextWeek * 7919 + 101);
  const metaDrift = computeMetaDrift(state.arenaHistory || []);
  console.log("[advanceWeek] metaDrift done, arenaHistory length:", state.arenaHistory?.length);

  // 2. Bout Simulation (happens for the week just ending)
  const boutImpact = runBoutSimulationPass(state, rootRng);
  console.log("[advanceWeek] boutSimulation done");
  const settledState = resolveImpacts(state, [boutImpact]);
  settledState.cachedMetaDrift = metaDrift;

  // Build and cache warrior map for subsequent AI passes
  const warriorMap = new Map<string, Warrior>();
  settledState.roster.forEach((w: Warrior) => warriorMap.set(w.id, w));
  (settledState.rivals || []).forEach((r: RivalStableData) => r.roster.forEach((w: Warrior) => warriorMap.set(w.id, w)));
  settledState.warriorMap = warriorMap;

  // 3. Collection Phase (Collect all intended changes)
  const impacts: StateImpact[] = [];

  // Core Simulation Impacts
  impacts.push(runWarriorPass(settledState, rootRng));
  console.log("[advanceWeek] warriorPass done");
  impacts.push(runEconomyPass(settledState, rootRng));
  console.log("[advanceWeek] economyPass done");
  impacts.push(runEquipmentPass(settledState));
  console.log("[advanceWeek] equipmentPass done");

  // ⚡ Early Exit: Bankruptcy Check
  const economyImpact = impacts.find(i => i.treasuryDelta !== undefined);
  const estimatedTreasury = settledState.treasury + (economyImpact?.treasuryDelta || 0);
  if (estimatedTreasury < -500) {
    const finalState = resolveImpacts(settledState, impacts);
    finalState.week = nextWeek;
    finalState.year = nextYear;
    return archiveWeekLogs(finalState);
  }

  // World & System Impacts
  impacts.push(runWorldPass(settledState, nextWeek, rootRng));
  console.log("[advanceWeek] worldPass done");
  impacts.push(runRecruitmentPass(settledState, rootRng));
  console.log("[advanceWeek] recruitmentPass done");
  impacts.push(runSystemPass(settledState, rootRng));
  console.log("[advanceWeek] systemPass done");
  impacts.push(runRankingsPass(settledState));
  console.log("[advanceWeek] rankingsPass done");
  impacts.push(runPromoterPass(settledState));
  console.log("[advanceWeek] promoterPass done");
  impacts.push(runPromoterLifecyclePass(settledState, rootRng));
  console.log("[advanceWeek] promoterLifecyclePass done");
  impacts.push(runTrainerPass(settledState, rootRng));
  console.log("[advanceWeek] trainerPass done");

  // AI & Strategic Impacts
  impacts.push(runRivalStrategyPass(settledState, nextWeek, rootRng));
  console.log("[advanceWeek] rivalStrategyPass done");

  // Narrative & Event Impacts
  impacts.push(runEventPass(settledState, nextWeek, rootRng));
  console.log("[advanceWeek] eventPass done");
  impacts.push(runNarrativePass(settledState, currentWeek, nextWeek, rootRng));
  console.log("[advanceWeek] narrativePass done");

  // 4. Resolution Phase (Apply all impacts in one unified pass)
  const finalizedState = resolveImpacts(settledState, impacts);
  console.log("[advanceWeek] resolveImpacts done");

  // 5. Finalization
  finalizedState.week = nextWeek;
  finalizedState.year = nextYear;
  finalizedState.day = 0; // Reset daily counter
  finalizedState.trainingAssignments = []; // Reset weekly assignments

  // Prune stale seasonal growth entries on season change to prevent unbounded growth.
  // The seasonal cap is keyed by season name, so old-season entries are already ignored
  // mechanically — this just keeps the array from growing forever.
  if (finalizedState.season !== state.season) {
    finalizedState.seasonalGrowth = (finalizedState.seasonalGrowth ?? []).filter(
      (sg) => sg.season === finalizedState.season
    );
  }

  return archiveWeekLogs(finalizedState);
}
