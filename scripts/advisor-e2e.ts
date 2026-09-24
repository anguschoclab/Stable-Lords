/**
 * Advisor end-to-end verification on a REAL entered stable.
 *
 * Walks the genuine new-game path — createFreshState → backstory →
 * rankings/promoter passes → recruiting from the real recruitPool via the
 * same makeWarrior call the Recruit page uses — then plays weeks on the
 * baseline heuristic (world populates, offers flow), runs the War Council on
 * the established stable, and finishes with councilAutoPilot engaged.
 *
 * Run:  bun scripts/advisor-e2e.ts [--save /path/to/save.json]
 */
import { writeFileSync } from 'node:fs';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { applyBackstoryToPlayer, BACKSTORY_IDS } from '@/data/backstories';
import { runRankingsPass } from '@/engine/pipeline/passes/RankingsPass';
import { runPromoterPass } from '@/engine/pipeline/passes/PromoterPass';
import { resolveImpacts } from '@/engine/impacts';
import { SeededRNGService, hashStr } from '@/utils/random';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { computeStableCouncilReport } from '@/engine/advisor/stableCouncilService';
import { applyCouncilPlan } from '@/engine/advisor/applyCouncilPlan';
import { runAutosim, type AutosimResult } from '@/engine/autosim';
import { truncateState } from '@/engine/storage/truncation';
import { stripNonSerializable } from '@/state/serialization';
import type { WarriorId } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';

function playerOffersOf(state: GameState) {
  const ids = new Set(state.roster.map((w) => w.id));
  return Object.values(state.boutOffers ?? {}).filter((o) =>
    o.warriorIds.some((id) => ids.has(id as WarriorId))
  );
}

function printCouncil(state: GameState, label: string) {
  const report = computeStableCouncilReport(state);
  console.log(`\n═══ COUNCIL REPORT (${label}) ═══`);
  console.log(
    `summary: warriors=${report.summary.totalWarriors} ready=${report.summary.combatReadyCount} ` +
      `rehab=${report.summary.rehabCount} contenders=${report.summary.tournamentContenderCount} ` +
      `unassigned=${report.summary.unassignedTrainingCount} pendingOffers=${report.summary.pendingBoutOffersCount} ` +
      `projPurse=${report.summary.projectedPurseGold}G projCost=${report.summary.projectedTrainingCost}G treasury=${report.summary.treasury}G`
  );
  if (report.summary.solvencyWarning) console.log(`solvency: ${report.summary.solvencyWarning}`);
  for (const d of report.summary.stableDirectives) console.log(`  directive: ${d}`);
  for (const c of report.cards) {
    const intel = c.fightAdvice.reasoning.filter((r) => /scout intel/i.test(r));
    const rematch = c.fightAdvice.warnings.filter((w) => /rematch/i.test(w));
    console.log(
      `  ${c.warriorName} [${c.style}] focus=${c.campaignFocus}` +
        `${c.suggestedCampaignFocus !== c.campaignFocus ? ` (suggested:${c.suggestedCampaignFocus})` : ''}` +
        ` fight=${c.fightAdvice.action}${c.fightAdvice.recommendedOfferId ? '→' + c.fightAdvice.recommendedOfferId : ''}` +
        ` danger=${c.fightAdvice.dangerLevel} train=${c.trainingAdvice.mode}` +
        `${c.trainingAdvice.targetAttribute ? ':' + c.trainingAdvice.targetAttribute : ''}` +
        `${c.trainingAdvice.targetTrainerId ? ' trainer✓' : ''}` +
        ` OE=${c.tacticsAdvice.suggestedOE} AL=${c.tacticsAdvice.suggestedAL}` +
        `${c.tacticsAdvice.fallbackCondition ? ' fb=' + c.tacticsAdvice.fallbackCondition : ''}`
    );
    for (const r of intel) console.log(`      ${r}`);
    for (const w of rematch) console.log(`      ⚠ ${w}`);
  }
  return report;
}

function printRun(result: AutosimResult, label: string) {
  console.log(`\n═══ ${label} ═══`);
  console.log(
    `weeksSimmed=${result.weeksSimmed} stop=${result.stopReason} (${result.stopDetail}) ` +
      `finalWeek=${result.finalState.week} absWeek=${result.finalState.absoluteWeek} treasury=${result.finalState.treasury}G`
  );
  for (const s of result.weekSummaries) {
    console.log(
      `  wk${s.week}: bouts=${s.bouts} deaths=${s.deaths}${s.deathNames.length ? ' (' + s.deathNames.join(', ') + ')' : ''}`
    );
  }
  const offers = playerOffersOf(result.finalState);
  const accepted = offers.filter((o) =>
    result.finalState.roster.some((w) => o.responses?.[w.id] === 'Accepted')
  );
  console.log(
    `  playerOffers=${offers.length} accepted=${accepted.length} ` +
      `arenaHistory=${result.finalState.arenaHistory?.length ?? 0} ` +
      `assignments=${(result.finalState.trainingAssignments ?? []).length}`
  );
  for (const o of offers.slice(0, 8)) {
    console.log(`    offer ${o.id} wk${o.boutWeek} status=${o.status} purse=${o.purse} hype=${o.hype}`);
  }
  for (const w of result.finalState.roster) {
    console.log(
      `    ${w.name} status=${w.status ?? 'n/a'} fatigue=${w.fatigue ?? 0} injuries=${(w.injuries ?? []).length} ` +
        `career=${w.career?.wins ?? 0}-${w.career?.losses ?? 0} plan=${w.plan ? `${w.plan.offensiveTactic}/${w.plan.defensiveTactic} OE${w.plan.OE}/AL${w.plan.AL}` : 'none'}`
    );
  }
  return result;
}

// ─── 1. Real new-game path (mirrors StartGame.handleNewGame) ────────────────
let state = createFreshState('alpha-prime-10');
state.player.name = 'E2E Lanista';
state.player.stableName = 'E2E Verification Stable';
const identitySeed = 'slot_e2e'.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
applyBackstoryToPlayer(state, BACKSTORY_IDS[0], new SeededRNGService(identitySeed));
state = resolveImpacts(state, [runRankingsPass(state), runPromoterPass(state)]);
console.log(`\n═══ NEW GAME ═══`);
console.log(
  `stable="${state.player.stableName}" treasury=${state.treasury}G week=${state.week} absWeek=${state.absoluteWeek} rivals=${state.rivals.length} recruitPool=${state.recruitPool.length}`
);

// ─── 2. Recruit warriors (mirrors useRecruitActions.handleRecruit — only
// while treasury covers the cost, as deductFunds enforces in the real UI).
// Treasury is topped up to a typical early-stable bankroll so the run can
// survive long enough for the fight pipeline to populate. ──────────────────
state.treasury += 5000;
const pool = [...(state.recruitPool ?? [])].sort((a, b) => a.cost - b.cost);
for (const w of pool) {
  if (state.roster.length >= 5 || state.treasury - w.cost < 300) break;
  const recruitRng = new SeededRNGService(state.week + hashStr(w.name));
  const warrior = makeWarrior(
    recruitRng.uuid('warrior') as WarriorId,
    w.name,
    w.style,
    w.attributes,
    { age: w.age, potential: w.potential }
  );
  state.roster.push(warrior);
  state.treasury -= w.cost;
  state.recruitPool = (state.recruitPool ?? []).filter((p) => p.id !== w.id);
}
console.log(
  `recruited ${state.roster.length} warriors (treasury now ${state.treasury}G): ` +
    state.roster.map((w) => `${w.name}[${w.style}]`).join(', ')
);

// ─── 3. Council report on the fresh stable ────────────────────────────────
const report1 = printCouncil(state, 'week 1, pre-autopilot');
applyCouncilPlan(state, report1);
console.log(
  `\napplyCouncilPlan: assignments=${(state.trainingAssignments ?? []).length} ` +
    `plansPatched=${state.roster.filter((w) => w.plan).length}/${state.roster.length}`
);

// ─── 4. Play weeks on the baseline heuristic so the world populates, and
// issue challenges — the real Booking Office mechanic that produces
// player-bound offers (rival bids answering state.playerChallenges). ────────
const issueChallenges = (s: GameState) => {
  const challengeable = s.rivals.flatMap((r) => {
    const assigned = new Set((r.trainingAssignments ?? []).map((a) => a.warriorId));
    return r.roster.filter(
      (w) => (w.status ?? 'Active') === 'Active' && !w.isDead && !assigned.has(w.id)
    );
  });
  s.playerChallenges = challengeable.map((w) => w.id);
  console.log(`  challenges → ${challengeable.length} eligible rival warriors`);
};

// Warm-up: two weeks to populate rival rosters, then challenge.
state = (await runAutosim(state, { weeksToSim: 2 })).finalState;
issueChallenges(state);

// LEG 1 — baseline heuristic: challenge offers (purse ~50, hype ~75) never
// clear hype>100||purse>200, so a fresh stable earns nothing. This is the
// contrast case proving the council adds real value.
const leg1 = printRun(await runAutosim(state, { weeksToSim: 6 }), 'LEG 1 — baseline heuristic, 6 weeks');
state = leg1.finalState;

// ─── 5. Council report on the established stable (offers should exist) ──────
printCouncil(state, `week ${state.week}, established`);

// ─── 6. Flip on council autopilot mid-save — the real user story ────────────
issueChallenges(state);
const leg2 = printRun(
  await runAutosim(state, { weeksToSim: 10, councilAutoPilot: true }),
  'LEG 2 — councilAutoPilot, 10 weeks'
);
state = leg2.finalState;

// Post-autopilot council read for intel/rematch visibility
printCouncil(state, `week ${state.week}, post-autopilot`);

// ─── 7. Solvent leg — keep simming under autopilot until the council
// accepts a live offer and the bout actually resolves ───────────────────────
state.treasury += 3000; // treasury rescue so the run isn't dominated by bankruptcy
issueChallenges(state);
const leg3 = printRun(
  await runAutosim(state, { weeksToSim: 8, councilAutoPilot: true }),
  'LEG 3 — councilAutoPilot, solvent, 8 weeks'
);
state = leg3.finalState;

// Did the council get any warriors into real bouts? Check player career bouts
// and whether any player warrior appears in arenaHistory.
const fought = state.roster.filter((w) => (w.career?.wins ?? 0) + (w.career?.losses ?? 0) > 0);
const playerBouts = (state.arenaHistory ?? []).filter((f) =>
  state.roster.some((w) => w.id === f.warriorIdA || w.id === f.warriorIdD)
);
console.log(
  `\nplayer warriors with career bouts: ${fought.length}/${state.roster.length} — ` +
    `player fights in arenaHistory: ${playerBouts.length}`
);
for (const f of playerBouts.slice(0, 5)) {
  console.log(`  fight wk${f.week}: ${f.title} winner=${f.winner} by=${f.by}`);
}

printCouncil(state, `week ${state.week}, final`);

// ─── 7. Optionally emit an importable save for the UI half of the check ─────
const saveIdx = process.argv.indexOf('--save');
if (saveIdx !== -1 && process.argv[saveIdx + 1]) {
  // Mirror exportSlot: truncate for size, strip runtime-only Map caches that
  // GameStateSchema rejects on import.
  writeFileSync(
    process.argv[saveIdx + 1],
    JSON.stringify(stripNonSerializable(truncateState(state)))
  );
  console.log(`\nsave written → ${process.argv[saveIdx + 1]}`);
}

console.log(`\n✔ Advisor E2E complete`);
