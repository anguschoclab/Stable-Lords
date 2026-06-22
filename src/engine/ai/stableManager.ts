import type { GameState, RivalStableData, Trainer, Warrior } from '@/types/state.types';
import type { LedgerEntryId } from '@/types/shared.types';
import { processStaff } from './workers/staffWorker';
import { processRoster } from './workers/rosterWorker';
import { consolidateAgentMemory, createAgentContext } from './agentCore';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import { computeWeeklyBreakdown, type StableEconomyInput } from '@/engine/economy';
import { SeededRNGService } from '@/utils/random';
import { BANKRUPTCY_THRESHOLD } from '@/constants/economy';

/**
 * processAIStable - The Lead Agent Orchestrator for a Rival Stable.
 * Implements "Hierarchical Delegation" and "Context Isolation".
 */
export function processAIStable(
  rival: RivalStableData,
  state: GameState
): {
  updatedRival: RivalStableData;
  isBankrupt: boolean;
  gazetteItems: string[];
  updatedHiringPool: Trainer[];
  impact: StateImpact;
} {
  // 1. Initialize Context & Skeptical Memory
  const context = createAgentContext(rival, state);
  let updatedRival = { ...context.rival };
  let currentHiringPool = [...(state.hiringPool || [])];
  const gazetteItems: string[] = [];
  const impacts: StateImpact[] = [];

  // ── Fatigue Decay & HP Recovery for AI Warriors ──
  updatedRival.roster = updatedRival.roster.map((w): Warrior => {
    // Intentional deviation: single-item status check inside map
    if (w.status === 'Active') {
      const fatigue = Math.max(0, (w.fatigue || 0) - 25);
      const currentHP = w.derivedStats?.hp ?? 100;
      const hp = Math.min(100, currentHP + 20); // Passive heal +20%
      return {
        ...w,
        fatigue,
        derivedStats: { ...(w.derivedStats || {}), hp },
      } as Warrior;
    }
    return w;
  });

  // 2. Delegate to Workers (Hierarchical Delegation)

  // A) StaffWorker (Hiring/Firing)
  const staffResult = processStaff(updatedRival, state, currentHiringPool, context);
  updatedRival = staffResult.updatedRival;
  currentHiringPool = staffResult.updatedHiringPool;
  gazetteItems.push(...staffResult.gazetteItems);
  impacts.push({ hiringPool: currentHiringPool });

  // B) RosterWorker (Training/Gear)
  const rosterSeed = state.week * 8123 + updatedRival.owner.id.length * 101;
  // `processRoster` takes 5 args; the previous 6th (`context`) was silently
  // dropped and has been removed. Agent context flows via `updatedRival` state.
  updatedRival = processRoster(updatedRival, state.week, state.season, rosterSeed);

  // 3. Calculate Weekly Economy via shared player path
  const economyInput: StableEconomyInput = {
    week: state.week,
    roster: updatedRival.roster,
    fame: updatedRival.fame ?? updatedRival.owner.fame ?? 0,
    weather: state.weather,
    arenaHistory: state.arenaHistory.filter((f) => f.week === state.week),
    trainers: updatedRival.trainers ?? [],
    trainingAssignments: updatedRival.trainingAssignments ?? [],
    applyStipend: (state.rivals || []).length <= 45,
  };

  const breakdown = computeWeeklyBreakdown(economyInput);

  // Apply treasury delta
  updatedRival.treasury += breakdown.net;

  // Write ledger entries
  const rngService = new SeededRNGService(state.week * 31 + updatedRival.id.length);
  const newEntries: import('@/types/state.types').LedgerEntry[] = [];
  for (const i of breakdown.income) {
    newEntries.push({
      id: rngService.uuid() as LedgerEntryId,
      week: state.week,
      label: i.label,
      amount: i.amount,
      category: 'fight',
    });
  }
  for (const e of breakdown.expenses) {
    newEntries.push({
      id: rngService.uuid() as LedgerEntryId,
      week: state.week,
      label: e.label,
      amount: -e.amount,
      category: 'upkeep',
    });
  }
  updatedRival.ledger = [...(updatedRival.ledger || []), ...newEntries];

  // Clear training assignments (mirrors player finalizeState)
  updatedRival.trainingAssignments = [];

  // 4. Bankruptcy check (aligned with player threshold)
  const isBankrupt = updatedRival.treasury < BANKRUPTCY_THRESHOLD;

  // Milestone detection — narrow parity with the player's own-stable gazette.
  // Fires once per threshold crossing this tick: fame (100, 250, 500), cumulative
  // roster wins (50, 100, 250). Uses `rival` (pre-tick) vs `updatedRival` to
  // detect the crossing edge so we don't re-fire every week once over-threshold.
  const fameBefore = rival.owner.fame ?? 0;
  const fameAfter = updatedRival.owner.fame ?? 0;
  for (const t of [100, 250, 500]) {
    if (fameBefore < t && fameAfter >= t) {
      gazetteItems.push(`🏛 ${updatedRival.owner.stableName} has reached ${t} fame.`);
    }
  }
  const winsBefore = rival.roster.reduce((s, w) => s + (w.career?.wins ?? 0), 0);
  const winsAfter = updatedRival.roster.reduce((s, w) => s + (w.career?.wins ?? 0), 0);
  for (const t of [50, 100, 250]) {
    if (winsBefore < t && winsAfter >= t) {
      gazetteItems.push(`⚔ ${updatedRival.owner.stableName} tallied its ${t}th career win.`);
    }
  }

  // 6. Background Consolidation: Prune logs and update burn rate in memory
  updatedRival = consolidateAgentMemory(updatedRival, state.week);

  // Collect impact for this rival
  const rivalsUpdates = new Map<
    import('@/types/shared.types').StableId,
    Partial<RivalStableData>
  >();
  rivalsUpdates.set(rival.id, updatedRival);
  impacts.push({ rivalsUpdates });

  // console.log(`[AIStable] ${updatedRival.owner.stableName} | Pop: ${updatedRival.roster.length} | T: ${updatedRival.treasury}`);

  return {
    updatedRival,
    isBankrupt,
    gazetteItems,
    updatedHiringPool: currentHiringPool,
    impact: mergeImpacts(impacts),
  };
}
