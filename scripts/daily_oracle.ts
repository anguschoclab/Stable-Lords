import { promises as fs } from 'fs';
import * as path from 'path';

import { runSimulation } from './simulation-harness';
import { formatPulseTable } from '@/engine/stats/simulationMetrics';
import { NodeArchiveService } from './nodeArchiveService';

const WEEKS_TO_SIMULATE = 1000;

const REPORT_FILE = path.join(process.cwd(), 'Daily_Balance_Report.md');
const ARCHIVE_DIR = path.join(process.cwd(), 'archives');

/** Fold the simulation result into headline metrics. */
export function computeMetrics(result: Awaited<ReturnType<typeof runSimulation>>) {
  const { pulses, cumulative } = result;

  // All-time counters accumulated before each truncation pass, so they
  // reflect the full 1000 weeks.
  const styleWinRates: Record<string, number> = {};
  for (const style in cumulative.styleWins) {
    const wins = cumulative.styleWins[style] ?? 0;
    const losses = cumulative.styleLosses[style] ?? 0;
    const total = wins + losses;
    if (total > 0) {
      styleWinRates[style] = wins / total;
    }
  }

  const deaths = cumulative.deaths;
  const bouts = cumulative.totalBouts;
  const weeklyBouts = cumulative.weeklyBouts;
  const weeklyKills = cumulative.weeklyKills;
  const tournamentBouts = cumulative.tournamentBouts;
  const tournamentKills = cumulative.tournamentKills;
  // Kill-outcome rate over ordinary weekly arena bouts — the denominator the
  // design target (8–15% per bout) actually refers to. Tournament bouts are
  // excluded: their geometry and stakes are not the weekly arena baseline.
  const killRate = weeklyBouts > 0 ? weeklyKills / weeklyBouts : 0;
  const mortalityRate = killRate;
  // Unique deaths must track kill outcomes ~1:1. When the roster-removal bug
  // was live, kill victims stayed on rival rosters and were "killed" again,
  // while the graveyard id-dedup hid the repeats — kills >> deaths signals
  // that corruption class resurfacing.
  const killOutcomes = weeklyKills + tournamentKills;
  const killDeathDivergence = killOutcomes - deaths;

  // Economy = the rival stables, which are the real population. The player is
  // one autopiloted stable and is not representative.
  const last = pulses[pulses.length - 1];
  const rivalTreasuryMean = last?.avgRivalTreasury ?? 0;
  const rivalTreasuryMedian = last?.medianRivalTreasury ?? 0;
  const avgEconomy = rivalTreasuryMean;

  return {
    styleWinRates,
    deaths,
    bouts,
    weeklyBouts,
    weeklyKills,
    tournamentBouts,
    tournamentKills,
    killRate,
    mortalityRate,
    killDeathDivergence,
    rivalTreasuryMean,
    rivalTreasuryMedian,
    avgEconomy,
  };
}

/** Rule-of-thumb balance suggestions from the headline metrics. */
function buildRecommendations(m: ReturnType<typeof computeMetrics>): string {
  let recommendations = '';
  let hasAnomalies = false;

  // State-integrity check first: corrupted rosters poison every other metric.
  if (m.killDeathDivergence > 0) {
    recommendations += `- **State Corruption**: ${m.killDeathDivergence} kill outcomes produced no unique death — dead warriors may still be on rosters. Investigate graveyard↔roster disjointness BEFORE tuning anything.\n`;
    hasAnomalies = true;
  }

  // Lethality: the design band for ordinary weekly arena bouts is 8–15% (Kill,
  // Death & Permadeath spec §6.1); the 2026-09 kill pass tuned the world to the
  // low end of it. World dial: KILL_WINDOW.SCALE (constants/combat) — it scales
  // the kill roll without reshaping which conditions produce kills; the shape
  // lives in the other KILL_WINDOW fields. NOT CRIT_DAMAGE_MULT, which only
  // scales crit damage — a 0-HP defender is a KO either way. Seed-to-seed
  // spread is about ±1pp, so only flag a rate clearly outside the band.
  if (m.mortalityRate > 0.15) {
    recommendations += `- **Lethality High**: Weekly kill rate is ${(m.mortalityRate * 100).toFixed(2)}% (Target: 8% - 15%). Lever: lower KILL_WINDOW.SCALE; NOT CRIT_DAMAGE_MULT (KO-only effect).\n`;
    hasAnomalies = true;
  } else if (m.mortalityRate < 0.01) {
    recommendations += `- **Lethality Dead**: Weekly kill rate is ${(m.mortalityRate * 100).toFixed(2)}% — the kill path is effectively non-firing on the deployed population. Investigate checkKillWindow gating before tuning.\n`;
    hasAnomalies = true;
  } else if (m.mortalityRate < 0.06) {
    recommendations += `- **Lethality Low**: Weekly kill rate is ${(m.mortalityRate * 100).toFixed(2)}% (Target: 8% - 15%). Lever: raise KILL_WINDOW.SCALE. If it collapsed suddenly, check first that rival max HP is not inflating (derivedStats.hp is a stat, not a health percentage).\n`;
    hasAnomalies = true;
  }

  // Adjust style winrates
  for (const [style, rate] of Object.entries(m.styleWinRates)) {
    if (rate > 0.65) {
      recommendations += `- **Meta Anomaly**: ${style} win rate is too high (${(rate * 100).toFixed(2)}%). Trim its STYLE_PENALTIES row or passive — see .claude/skills/combat-balance.\n`;
      hasAnomalies = true;
    } else if (rate < 0.35) {
      recommendations += `- **Meta Anomaly**: ${style} win rate is too low (${(rate * 100).toFixed(2)}%). Check what its warriors actually carry and roll first (scripts/style-probe.ts: weapon fit, effective skills); the world-only lever is STYLE_SKILL_FLOORS, since penalties do not reach skills already on the floor.\n`;
      hasAnomalies = true;
    }
  }

  // Check economy — rival stables are the meaningful population.
  if (m.avgEconomy < -20000) {
    recommendations += `- **Economy Warning**: Average rival treasury is deeply negative (${m.avgEconomy.toFixed(0)} gold, median ${m.rivalTreasuryMedian.toFixed(0)}). Suggest increasing FIGHT_PURSE or reducing costs.\n`;
    hasAnomalies = true;
  } else if (m.avgEconomy > 50000) {
    recommendations += `- **Economy Warning**: Rival hyper-inflation detected (mean ${m.rivalTreasuryMean.toFixed(0)} gold, median ${m.rivalTreasuryMedian.toFixed(0)}). Rivals earn purses+bonuses but rarely spend — prefer AI-purchasable sinks (recruits, trainers, training) over purse cuts.\n`;
    hasAnomalies = true;
  }

  if (!hasAnomalies) {
    return '- No mathematical anomalies detected. Meta is stable.';
  }
  return recommendations;
}

/** Render the markdown report body. */
function buildReport(m: ReturnType<typeof computeMetrics>, recommendations: string): string {
  return `# Daily Balance Report

## Simulation Results
- **Weeks Simulated:** ${WEEKS_TO_SIMULATE}
- **Total Bouts:** ${m.bouts} (${m.weeklyBouts} weekly / ${m.tournamentBouts} tournament)
- **Kill Outcomes:** ${m.weeklyKills + m.tournamentKills} (${m.weeklyKills} weekly / ${m.tournamentKills} tournament)
- **Unique Deaths:** ${m.deaths}
- **Weekly Kill Rate:** ${(m.killRate * 100).toFixed(2)}% (design target 8–15%)
- **Rival Stable Gold:** mean ${m.rivalTreasuryMean.toFixed(0)} / median ${m.rivalTreasuryMedian.toFixed(0)} (final week)

## Style Win Rates
${Object.entries(m.styleWinRates)
  .sort((a, b) => b[1] - a[1])
  .map(([style, rate]) => `- **${style}:** ${(rate * 100).toFixed(2)}%`)
  .join('\n')}

## Suggested Variable Tweaks (For Product Owner Approval)
${recommendations}
`;
}

async function main() {
  console.log(`Starting Autobalance Simulation for ${WEEKS_TO_SIMULATE} weeks...`);

  const result = await runSimulation({
    weeks: WEEKS_TO_SIMULATE,
    seed: 12345, // Deterministic
    logFrequency: 1,
    ignoreBankruptcy: true,
    // Archive fight transcripts to disk (mirrors OPFS layout) and truncate
    // historical arrays every 50 weeks so the 1000-week run stays bounded.
    // Transcript archival is opt-in via ORACLE_ARCHIVE=1 — the metrics only
    // need the in-memory run, and transcript writes are i/o-bound on synced
    // volumes (~80k files over 1000 weeks).
    archiveService: process.env.ORACLE_ARCHIVE ? new NodeArchiveService(ARCHIVE_DIR) : undefined,
  });

  console.log('Simulation complete. Analyzing data...');

  const metrics = computeMetrics(result);
  const { pulses } = result;

  console.log('=== Autobalance Engine Metrics ===');
  console.log(formatPulseTable(pulses.slice(-20))); // trailing 20-week pulse window
  console.log(
    `Weekly Kill Rate: ${(metrics.killRate * 100).toFixed(2)}% (${metrics.weeklyKills}/${metrics.weeklyBouts})`
  );
  console.log(
    `Unique Deaths: ${metrics.deaths} (kill-death divergence: ${metrics.killDeathDivergence})`
  );
  console.log(
    `Rival Economy: mean ${metrics.rivalTreasuryMean} / median ${metrics.rivalTreasuryMedian} gold`
  );
  console.log(`Win Rates:`);
  for (const [style, rate] of Object.entries(metrics.styleWinRates).sort((a, b) => b[1] - a[1])) {
    console.log(`- ${style}: ${(rate * 100).toFixed(2)}%`);
  }

  const recommendations = buildRecommendations(metrics);
  const report = buildReport(metrics, recommendations);

  await fs.writeFile(REPORT_FILE, report);
  console.log(`\nWrote Daily_Balance_Report.md`);
}

// Guard like daily_bard.ts — importing this module under a test runner must
// not kick off the 1000-week simulation.
if (!process.env.VITEST) {
  main().catch(console.error);
}
