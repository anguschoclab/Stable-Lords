import type { GameState } from '@/types/state.types';
import { TRAITS } from '@/engine/traits';
import { owningStableOf } from '@/engine/championship/arenaChampionship';
import { CHAMPIONS_TOURNEY } from '@/constants/arena';
import { WEEKS_PER_YEAR } from '@/constants/core/core';
import { findWarriorById } from '@/engine/core/warriorLookup';

/**
 * Defines the shape of sim pulse.
 */
export interface SimPulse {
  week: number;
  playerTreasury: number;
  rosterSize: number;
  deadCount: number;
  retiredCount: number;
  rivalCount: number;
  avgRivalTreasury: number;
  totalBouts: number;
  // ─── Trait / churn emergence (world-wide: player + all rivals) ───
  traitedWarriors: number;
  totalTraits: number;
  flawInstances: number;
  multiFlawWarriors: number;
  classTraitInstances: number;
  signatureInstances: number;
  // ─── All-time counters (set by the harness; survive truncation) ───
  cumulativeBouts?: number;
  cumulativeDeaths?: number;
  cumulativeRetired?: number;
  // ─── AI behavior metrics (Stage I) ───
  /** Rival count per active strategy intent this week. */
  intentDistribution: Record<string, number>;
  /** 1 when ≥1 Proposed offer targets a player warrior this sampled week, else 0. */
  playerChallengedWeeks: number;
  /** Rivals currently running VENDETTA. */
  vendettaCount: number;
  /** Mean opponent-dossier count across rivals. */
  avgDossierCoverage: number;
  /** Share of standing offers carrying a counter purse bump. */
  counterOfferRate: number;
  // ─── Championship metrics (Phase-2 megaplan Stage A baselines) ───
  /** Arena crowns currently held by rival stables vs the player. */
  aiCrownsHeld: number;
  playerCrownsHeld: number;
  /** Open title offers (Proposed or Signed) across all arenas. */
  liveTitleOffers: number;
  /** All-time reign endings by reason, summed across arena title histories. */
  reignEndings: Record<string, number>;
  /** Grand Champions crowned so far (one per completed Champions tournament). */
  grandChampionsCount: number;
  // ─── Stage H: AI-depth + championship liveness metrics ───
  /** Rivals currently running the CROWN_CAMPAIGN intent. */
  crownCampaignsActive: number;
  /** Standing title offers tallied by status (Proposed/Signed/Declined/…). */
  titleOfferStatuses: Record<string, number>;
  /** Mean weeks since rival plan intel was gathered (0 when none exists). */
  avgPlanIntelStaleness: number;
  /** Rival warriors carrying a masked/decoy plan (planMasked). */
  maskedScoutReports: number;
  /** Participant count of the most recent champions-tier tournament (0 if none). */
  grandChampFieldSize: number;
  /** Elapsed year boundaries with no Champions-tier tournament — honest
   *  derivation of cancellations (the engine never persists a cancelled GC). */
  grandChampCancellations: number;
  /** Mean fatigue across currently reigning arena champions (0 when none). */
  avgChampionFatigue: number;
  /** CONDITION_*@CORNER firings across lastWeekBoutDisplay's exchange logs. */
  cornerAdviceEvents: number;
}

/**
 * Collect a snapshot of metrics from the current game state.
 */
export function collectPulse(state: GameState): SimPulse {
  const activeRivals = state.rivals || [];
  let totalTreasury = 0;
  for (const r of activeRivals) {
    totalTreasury += r.treasury;
  }
  const avgRivalTreasury = activeRivals.length > 0 ? totalTreasury / activeRivals.length : 0;

  // World-wide trait accounting: player roster + every rival roster.
  // Using direct loops instead of a generator to avoid allocating temporary iterator objects in the simulation hot path.
  let traitedWarriors = 0;
  let totalTraits = 0;
  let flawInstances = 0;
  let multiFlawWarriors = 0;
  let classTraitInstances = 0;
  let signatureInstances = 0;

  const processWarrior = (w: (typeof state.roster)[0]) => {
    const ids = w.traits ?? [];
    if (ids.length > 0) traitedWarriors++;
    totalTraits += ids.length;
    let flawsOnW = 0;
    for (const id of ids) {
      const t = TRAITS[id];
      if (!t) continue;
      if (t.tier === 'Flaw') {
        flawInstances++;
        flawsOnW++;
      }
      if (t.tier === 'Signature') signatureInstances++;
      if (t.styles && t.styles.length > 0) classTraitInstances++;
    }
    if (flawsOnW >= 2) multiFlawWarriors++;
  };

  for (const w of state.roster) {
    processWarrior(w);
  }
  for (const r of activeRivals) {
    if (r.roster) {
      for (const w of r.roster) {
        processWarrior(w);
      }
    }
  }

  // ─── AI behavior metrics ───
  const intentDistribution: Record<string, number> = {};
  let vendettaCount = 0;
  let totalDossiers = 0;
  for (const r of activeRivals) {
    const intent = r.strategy?.intent;
    if (intent) {
      intentDistribution[intent] = (intentDistribution[intent] ?? 0) + 1;
      if (intent === 'VENDETTA') vendettaCount++;
    }
    totalDossiers += Object.keys(r.agentMemory?.opponentDossiers ?? {}).length;
  }

  const playerIds = new Set(state.roster.map((w) => w.id as string));
  let playerChallenged = false;
  let offerCount = 0;
  let counteredCount = 0;
  for (const o of Object.values(state.boutOffers ?? {})) {
    if (!o) continue;
    offerCount++;
    if ((o.counterPurseBump ?? 0) > 0) counteredCount++;
    if (o.status === 'Proposed' && o.warriorIds.some((id) => playerIds.has(id as string))) {
      playerChallenged = true;
    }
  }

  // ─── Championship metrics ───
  let aiCrownsHeld = 0;
  let playerCrownsHeld = 0;
  const reignEndings: Record<string, number> = {};
  for (const title of Object.values(state.arenaChampions ?? {})) {
    const champId = title?.champion?.warriorId;
    if (champId) {
      if (owningStableOf(state, champId)?.isPlayer) playerCrownsHeld++;
      else aiCrownsHeld++;
    }
    for (const r of title?.history ?? []) {
      reignEndings[r.endReason] = (reignEndings[r.endReason] ?? 0) + 1;
    }
  }
  const liveTitleOffers = Object.values(state.boutOffers ?? {}).filter(
    (o) => o?.titleArenaId && (o.status === 'Proposed' || o.status === 'Signed')
  ).length;

  // ─── Stage H metrics ───
  const titleOfferStatuses: Record<string, number> = {};
  for (const o of Object.values(state.boutOffers ?? {})) {
    if (!o?.titleArenaId) continue;
    titleOfferStatuses[o.status] = (titleOfferStatuses[o.status] ?? 0) + 1;
  }

  let intelSum = 0;
  let intelCount = 0;
  let maskedScoutReports = 0;
  const now = state.absoluteWeek ?? state.week;
  for (const r of activeRivals) {
    for (const w of r.roster ?? []) {
      if (w.planMasked) maskedScoutReports++;
    }
    for (const dossier of Object.values(r.agentMemory?.opponentDossiers ?? {})) {
      const lpw = dossier?.planIntel?.lastPlanWeek;
      if (lpw !== undefined) {
        intelSum += Math.max(0, now - lpw);
        intelCount++;
      }
    }
  }

  const champsTournaments = (state.tournaments ?? []).filter(
    (t) => t.tierId === CHAMPIONS_TOURNEY.TIER_ID
  );
  const grandChampFieldSize = champsTournaments.at(-1)?.participants.length ?? 0;
  const expectedGCs = Math.floor(Math.max(0, now - 1) / WEEKS_PER_YEAR);
  const grandChampCancellations = Math.max(0, expectedGCs - champsTournaments.length);

  let champFatigueSum = 0;
  let champFatigueCount = 0;
  for (const title of Object.values(state.arenaChampions ?? {})) {
    const champId = title?.champion?.warriorId;
    if (!champId) continue;
    const w = findWarriorById(state, champId);
    if (w) {
      champFatigueSum += w.fatigue ?? 0;
      champFatigueCount++;
    }
  }

  let cornerAdviceEvents = 0;
  for (const r of state.lastWeekBoutDisplay?.results ?? []) {
    for (const e of r.outcome?.exchangeLog ?? []) {
      for (const code of e.reasonCodes ?? []) {
        if (code.includes('@CORNER')) cornerAdviceEvents++;
      }
    }
  }

  return {
    week: state.week,
    playerTreasury: state.treasury,
    rosterSize: state.roster.length,
    deadCount: state.graveyard.length,
    retiredCount: state.retired.length,
    rivalCount: activeRivals.length,
    avgRivalTreasury: Math.round(avgRivalTreasury),
    totalBouts: state.arenaHistory.length,
    traitedWarriors,
    totalTraits,
    flawInstances,
    multiFlawWarriors,
    classTraitInstances,
    signatureInstances,
    intentDistribution,
    playerChallengedWeeks: playerChallenged ? 1 : 0,
    vendettaCount,
    avgDossierCoverage:
      activeRivals.length > 0 ? Math.round((totalDossiers / activeRivals.length) * 100) / 100 : 0,
    counterOfferRate: offerCount > 0 ? counteredCount / offerCount : 0,
    aiCrownsHeld,
    playerCrownsHeld,
    liveTitleOffers,
    reignEndings,
    grandChampionsCount: state.grandChampions?.length ?? 0,
    crownCampaignsActive: intentDistribution['CROWN_CAMPAIGN'] ?? 0,
    titleOfferStatuses,
    avgPlanIntelStaleness: intelCount > 0 ? Math.round(intelSum / intelCount) : 0,
    maskedScoutReports,
    grandChampFieldSize,
    grandChampCancellations,
    avgChampionFatigue:
      champFatigueCount > 0 ? Math.round(champFatigueSum / champFatigueCount) : 0,
    cornerAdviceEvents,
  };
}

/**
 * Formats a list of pulses into a console table-friendly format.
 */
export function formatPulseTable(pulses: SimPulse[]): string {
  if (pulses.length === 0) return 'No data';

  const header = 'Week | Treasury | Roster | Dead | Rivals | Avg Rival Treas';
  const divider = '---- | -------- | ------ | ---- | ------ | --------------';
  const rows = pulses.map(
    (p) =>
      `${p.week.toString().padEnd(4)} | ${p.playerTreasury.toString().padEnd(8)} | ${p.rosterSize.toString().padEnd(6)} | ${p.deadCount.toString().padEnd(4)} | ${p.rivalCount.toString().padEnd(6)} | ${p.avgRivalTreasury}`
  );

  return [header, divider, ...rows].join('\n');
}
