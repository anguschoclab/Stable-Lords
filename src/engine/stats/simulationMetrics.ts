import type { GameState } from '@/types/state.types';
import { TRAITS } from '@/engine/traits';

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
