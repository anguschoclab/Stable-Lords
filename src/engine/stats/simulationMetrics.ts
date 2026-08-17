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
  let totalTreasury = 0;
  for (const r of activeRivals) {
    totalTreasury += r.treasury;
  }
  const avgRivalTreasury = activeRivals.length > 0 ? totalTreasury / activeRivals.length : 0;

  let traitedWarriors = 0;
  let totalTraits = 0;
  let flawInstances = 0;
  let multiFlawWarriors = 0;
  let classTraitInstances = 0;
  let signatureInstances = 0;

  // Process a single warrior
  const processWarrior = (w: import('@/types/warrior.types').Warrior) => {
    const ids = w.traits;
    if (!ids) return;
    const len = ids.length;
    if (len > 0) traitedWarriors++;
    totalTraits += len;
    let flawsOnW = 0;
    for (let i = 0; i < len; i++) {
      const tId = ids[i];
      if (!tId) continue;
      const t = TRAITS[tId];
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

  // Iterate without generators to avoid iterator allocations
  for (let i = 0; i < state.roster.length; i++) {
    const w = state.roster[i];
    if (w) processWarrior(w);
  }
  for (let i = 0; i < activeRivals.length; i++) {
    const rivalRoster = activeRivals[i]?.roster;
    if (rivalRoster) {
      for (let j = 0; j < rivalRoster.length; j++) {
        const w = rivalRoster[j];
        if (w) processWarrior(w);
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
