/**
 * Phase 5.3 headless soak — multi-season run + SimPulse/emergent check.
 * Run: bun run scripts/soak.mjs
 */
import { runSimulation } from '../src/scripts/simulation-harness.ts';
import { formatPulseTable } from '../src/engine/stats/simulationMetrics.ts';

const WEEKS = 40; // ~3 seasons
const SEED = 20260919;

const { finalState, pulses, cumulative } = await runSimulation({
  weeks: WEEKS,
  seed: SEED,
  logFrequency: 5,
  ignoreBankruptcy: true,
});

console.log('\n=== PULSE TABLE (every 5th week) ===');
console.log(formatPulseTable(pulses.filter((_, i) => i % 5 === 4)));

const last = pulses[pulses.length - 1];
console.log('\n=== FINAL STATE ===');
console.log({
  week: finalState.absoluteWeek,
  rosterSize: last.rosterSize,
  dead: last.deadCount,
  retired: last.retiredCount,
  rivals: last.rivalCount,
  cumulativeBouts: cumulative?.bouts ?? last.cumulativeBouts,
  cumulativeDeaths: cumulative?.deaths ?? last.cumulativeDeaths,
  traitedWarriors: last.traitedWarriors,
  intentDistribution: last.intentDistribution,
  vendettaCount: last.vendettaCount,
  avgDossierCoverage: last.avgDossierCoverage?.toFixed?.(2),
  counterOfferRate: last.counterOfferRate?.toFixed?.(2),
  playerChallengedWeeks: pulses.reduce((n, p) => n + (p.playerChallengedWeeks || 0), 0),
  tournamentsHeld: (finalState.arenaHistory ?? []).filter((f) => f.tournamentId).length,
  newsletterItems: (finalState.newsletter ?? []).length,
  graveyardSize: (finalState.graveyard ?? []).length,
});
