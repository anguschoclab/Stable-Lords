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
}

/**
 * Collect a snapshot of metrics from the current game state.
 */
export function collectPulse(state: GameState): SimPulse {
  const activeRivals = state.rivals || [];
  const avgRivalTreasury =
    activeRivals.length > 0
      ? activeRivals.reduce((sum, r) => sum + r.treasury, 0) / activeRivals.length
      : 0;

  // World-wide trait accounting: player roster + every rival roster.
  const allWarriors = [...state.roster, ...activeRivals.flatMap((r) => r.roster ?? [])];
  let traitedWarriors = 0;
  let totalTraits = 0;
  let flawInstances = 0;
  let multiFlawWarriors = 0;
  let classTraitInstances = 0;
  let signatureInstances = 0;
  for (const w of allWarriors) {
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
