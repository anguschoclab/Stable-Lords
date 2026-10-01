import type { GameState, RivalStableData, Trainer, Warrior } from '@/types/state.types';
import type { LedgerEntryId } from '@/types/shared.types';
import { processStaff } from './workers/staffWorker';
import { processRoster } from './workers/rosterWorker';
import { consolidateAgentMemory, createAgentContext } from './agentCore';
import { updateSeasonRecord, recordBoutOutcome } from './memory/seasonRecord';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import { computeWeeklyBreakdown, type StableEconomyInput } from '@/engine/economy';
import { getFightsForWeek } from '@/engine/core/historyUtils';
import { SeededRNGService } from '@/utils/random';
import {
  BANKRUPTCY_THRESHOLD,
  BANKRUPTCY_GRACE_WEEKS,
  LEAGUE_SUBSIDY_RATE,
} from '@/constants/economy';
import { WORLD_RIVAL_FLOOR, WORLD_RIVAL_SOFT_CAP } from '@/constants/world';

/**
 * League-subsidy ramp: full `LEAGUE_SUBSIDY_RATE` at/below the rival floor,
 * fading linearly to zero at the soft cap. Above the soft cap the world's
 * economics must stand alone — that's what keeps growth bounded.
 */
function leagueSubsidyScale(rivalCount: number): number {
  const ramp = Math.min(
    1,
    Math.max(0, (WORLD_RIVAL_SOFT_CAP - rivalCount) / (WORLD_RIVAL_SOFT_CAP - WORLD_RIVAL_FLOOR))
  );
  return LEAGUE_SUBSIDY_RATE * ramp;
}
import { isActive } from '@/engine/warrior/warriorStatus';

/**
 * Passive recovery for active warriors: fatigue -25 per week. Hit points are
 * not touched — `derivedStats.hp` is the warrior's maximum HP stat, and damage
 * taken in a bout never persists past it (lasting harm is modelled as injuries).
 */
function decayFatigue(roster: Warrior[]): Warrior[] {
  return roster.map((w): Warrior => {
    // Intentional deviation: single-item status check inside map
    if (isActive(w) && (w.fatigue ?? 0) > 0) {
      return { ...w, fatigue: Math.max(0, (w.fatigue ?? 0) - 25) };
    }
    return w;
  });
}

/** Weekly economy: compute the breakdown, apply treasury, append ledger entries. */
function applyWeeklyEconomy(
  updatedRival: RivalStableData,
  state: GameState,
  perception?: import('./memory/perceptionSnapshot').PerceptionSnapshot
): RivalStableData {
  const economyInput: StableEconomyInput = {
    week: state.week,
    roster: updatedRival.roster,
    fame: updatedRival.fame ?? updatedRival.owner.fame ?? 0,
    weather: state.weather,
    arenaHistory:
      perception?.weekFights ??
      getFightsForWeek(state.arenaHistory, state.absoluteWeek ?? state.week),
    trainers: updatedRival.trainers ?? [],
    trainingAssignments: updatedRival.trainingAssignments ?? [],
    // League subsidy fades from full support at the rival floor to zero at
    // the soft cap — the world can grow past the floor without every young
    // stable being born insolvent, and above the soft cap economics bite.
    applyStipend: (state.rivals || []).length < WORLD_RIVAL_SOFT_CAP,
    stipendScale: leagueSubsidyScale((state.rivals || []).length),
    isPlayer: false,
    treasury: updatedRival.treasury,
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
      category: i.category,
    });
  }
  for (const e of breakdown.expenses) {
    newEntries.push({
      id: rngService.uuid() as LedgerEntryId,
      week: state.week,
      label: e.label,
      amount: -e.amount,
      category: e.category,
    });
  }
  updatedRival.ledger = [...(updatedRival.ledger || []), ...newEntries].slice(-500);
  return updatedRival;
}

/**
 * Milestone detection — narrow parity with the player's own-stable gazette.
 * Fires once per threshold crossing this tick: fame (100, 250, 500), cumulative
 * roster wins (50, 100, 250). Uses `rival` (pre-tick) vs `updatedRival` to
 * detect the crossing edge so we don't re-fire every week once over-threshold.
 */
function detectMilestones(rival: RivalStableData, updatedRival: RivalStableData): string[] {
  const items: string[] = [];
  const fameBefore = rival.owner.fame ?? 0;
  const fameAfter = updatedRival.owner.fame ?? 0;
  for (const t of [100, 250, 500]) {
    if (fameBefore < t && fameAfter >= t) {
      items.push(`🏛 ${updatedRival.owner.stableName} has reached ${t} fame.`);
    }
  }
  const winsBefore = rival.roster.reduce((s, w) => s + (w.career?.wins ?? 0), 0);
  const winsAfter = updatedRival.roster.reduce((s, w) => s + (w.career?.wins ?? 0), 0);
  for (const t of [50, 100, 250]) {
    if (winsBefore < t && winsAfter >= t) {
      items.push(`⚔ ${updatedRival.owner.stableName} tallied its ${t}th career win.`);
    }
  }
  return items;
}

/**
 * processAIStable - The Lead Agent Orchestrator for a Rival Stable.
 * Implements "Hierarchical Delegation" and "Context Isolation".
 */
export function processAIStable(
  rival: RivalStableData,
  state: GameState,
  perception?: import('./memory/perceptionSnapshot').PerceptionSnapshot
): {
  updatedRival: RivalStableData;
  isBankrupt: boolean;
  gazetteItems: string[];
  updatedHiringPool: Trainer[];
  impact: StateImpact;
} {
  // 1. Initialize Context & Skeptical Memory
  const context = createAgentContext(rival, state, perception);
  let updatedRival = { ...context.rival };
  let currentHiringPool = [...(state.hiringPool || [])];
  const gazetteItems: string[] = [];
  const impacts: StateImpact[] = [];

  // ── Fatigue Decay & HP Recovery for AI Warriors ──
  updatedRival.roster = decayFatigue(updatedRival.roster);

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

  // 3. Calculate Weekly Economy via shared player path, then apply it.
  updatedRival = applyWeeklyEconomy(updatedRival, state, perception);

  // Clear training assignments (mirrors player finalizeState)
  updatedRival.trainingAssignments = [];

  // 4. Bankruptcy check (aligned with player threshold). Stables inside
  // BANKRUPTCY_GRACE_WEEKS of their establishment are shielded — a fresh mint
  // bleeds while its roster ramps into bookings and must be allowed to turn
  // the corner.
  const stableAge =
    rival.establishedAbsoluteWeek == null
      ? BANKRUPTCY_GRACE_WEEKS
      : (state.absoluteWeek ?? state.week) - rival.establishedAbsoluteWeek;
  const isBankrupt =
    updatedRival.treasury < BANKRUPTCY_THRESHOLD && stableAge >= BANKRUPTCY_GRACE_WEEKS;

  gazetteItems.push(...detectMilestones(rival, updatedRival));

  // 6. Background Consolidation: record this week's bout outcomes into
  // seasonRecord + typed BOUT events, then prune logs and update burn rate.
  const weekFights =
    perception?.weekFights ??
    getFightsForWeek(state.arenaHistory, state.absoluteWeek ?? state.week);
  updatedRival = updateSeasonRecord(updatedRival, weekFights, state.week);
  updatedRival = recordBoutOutcome(updatedRival, weekFights, state.week);
  updatedRival = consolidateAgentMemory(updatedRival, state.week);

  // Collect impact for this rival
  const rivalsUpdates = new Map<
    import('@/types/shared.types').StableId,
    Partial<RivalStableData>
  >();
  rivalsUpdates.set(rival.id, updatedRival);
  impacts.push({ rivalsUpdates });

  return {
    updatedRival,
    isBankrupt,
    gazetteItems,
    updatedHiringPool: currentHiringPool,
    impact: mergeImpacts(impacts),
  };
}
