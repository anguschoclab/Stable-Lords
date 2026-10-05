/**
 * Phase 5.3 headless soak — multi-season run + SimPulse/emergent check.
 * Run: bun run scripts/soak.mjs [--weeks N] [--seed N] [--profile] [--invariants N]
 *
 *   --weeks N       Weeks to simulate (default 40).
 *   --seed N        World seed (default 20260919).
 *   --profile       Enable the per-pass pipeline profiler; writes
 *                   scripts/out/baseline.json with aggregated timings.
 *   --invariants N  Validate state invariants every N weeks (default 5;
 *                   0 disables). Violations are printed and fail the run.
 *   --day-mode      Tick each week as seven advanceDay calls instead of one
 *                   advanceWeek — exercises the interactive day path
 *                   (per-day tournament rounds, day-7 weekly pipeline).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { runSimulation } from './simulation-harness.ts';
import { formatPulseTable } from '../src/engine/stats/simulationMetrics.ts';
import { validateStateInvariants } from '../src/engine/validate/stateInvariants.ts';

const args = process.argv.slice(2);
const argVal = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i >= 0 ? Number(args[i + 1]) : dflt;
};
const WEEKS = argVal('--weeks', 40); // ~3 seasons
const SEED = argVal('--seed', 20260919);
const PROFILE = args.includes('--profile');
const INVARIANT_EVERY = argVal('--invariants', 5);

let invariantFailures = 0;
let counteredOfferWeeks = 0;
const started = performance.now();

const { finalState, pulses, cumulative, profile } = await runSimulation({
  weeks: WEEKS,
  seed: SEED,
  logFrequency: 5,
  ignoreBankruptcy: true,
  profile: PROFILE,
  // Counter-eligible offers: without bait, organic soaks never lowball a
  // famous warrior and counterOfferRate reads 0 forever (audit-v3 §6).
  counterBait: !args.includes('--no-counter-bait'),
  advanceMode: args.includes('--day-mode') ? 'day' : 'week',
  onWeek: (state, w) => {
    // Weekly counter observability — the standing-bump window (~3-4 wk)
    // outlives pulse sampling, so count every week, not every 5th.
    if (Object.values(state.boutOffers ?? {}).some((o) => (o.counterPurseBump ?? 0) > 0))
      counteredOfferWeeks++;
    if (INVARIANT_EVERY <= 0 || (w % INVARIANT_EVERY !== 0 && w !== WEEKS)) return;
    const violations = validateStateInvariants(state);
    for (const v of violations) {
      invariantFailures++;
      console.error(`[INVARIANT:${v.id}] week ${w}: ${v.message}`);
    }
  },
});

const elapsedMs = performance.now() - started;

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
  counterOfferRate: last.counterOfferRate?.toFixed?.(3),
  counterOfferRatePeak: Math.max(...pulses.map((p) => p.counterOfferRate ?? 0)).toFixed(3),
  counteredOfferWeeks: `${counteredOfferWeeks}/${WEEKS} weeks`,
  counteredOffers: `${last.counteredOfferCount ?? 0}/${last.offerCount ?? 0}`,
  playerChallengedWeeks: pulses.reduce((n, p) => n + (p.playerChallengedWeeks || 0), 0),
  aiCrownsHeld: last.aiCrownsHeld,
  playerCrownsHeld: last.playerCrownsHeld,
  liveTitleOffers: last.liveTitleOffers,
  reignEndings: last.reignEndings,
  grandChampions: last.grandChampionsCount,
  tournamentsHeld: (finalState.arenaHistory ?? []).filter((f) => f.tournamentId).length,
  newsletterItems: (finalState.newsletter ?? []).length,
  graveyardSize: (finalState.graveyard ?? []).length,
});

console.log(`\n=== SOAK RESULT ===`);
console.log(
  `${WEEKS} weeks in ${(elapsedMs / 1000).toFixed(1)}s ` +
    `(${(elapsedMs / WEEKS).toFixed(1)} ms/week), ` +
    `${invariantFailures} invariant violation(s)`
);

if (PROFILE && profile) {
  mkdirSync(new URL('./out', import.meta.url).pathname, { recursive: true });
  const out = {
    seed: SEED,
    weeks: WEEKS,
    totalMs: Math.round(elapsedMs),
    msPerWeek: Math.round((elapsedMs / WEEKS) * 10) / 10,
    passes: profile,
    generatedAt: new Date().toISOString(),
  };
  const path = new URL('./out/baseline.json', import.meta.url).pathname;
  writeFileSync(path, JSON.stringify(out, null, 2));
  console.log(`\n=== PER-PASS PROFILE (total ms, ${WEEKS} weeks) ===`);
  for (const p of profile) {
    console.log(
      `  ${p.id.padEnd(20)} ${p.stage.padEnd(8)} total=${p.totalMs.toFixed(1)}ms ` +
        `avg=${p.avgMs.toFixed(2)}ms max=${p.maxMs.toFixed(1)}ms`
    );
  }
  console.log(`\nWrote ${path}`);
}

if (invariantFailures > 0) {
  console.error(`\nSOAK FAILED: ${invariantFailures} invariant violation(s).`);
  process.exit(1);
}
