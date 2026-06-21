/**
 * Temporary deep-instrumentation harness: runs a long headless sim and prints
 * an emergent-behavior report. Not a real test (single assert that it ran).
 */
import { describe, test, vi, beforeEach, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import { TRAITS } from '@/engine/traits';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

vi.mock('@/engine/storage/opfsArchive', () => {
  const mockInstance = {
    isSupported: () => true,
    archiveBoutLog: vi.fn().mockResolvedValue(undefined),
    retrieveBoutLog: vi.fn().mockResolvedValue(null),
    archiveGazette: vi.fn().mockResolvedValue(undefined),
    retrieveGazette: vi.fn().mockResolvedValue(null),
    archiveHotState: vi.fn().mockResolvedValue(undefined),
    retrieveHotState: vi.fn().mockResolvedValue(null),
    getArchivedBoutIdsForSeason: vi.fn().mockResolvedValue([]),
  };
  return {
    OPFSArchiveService: class {
      isSupported = mockInstance.isSupported;
      archiveBoutLog = mockInstance.archiveBoutLog;
      retrieveBoutLog = mockInstance.retrieveBoutLog;
      archiveGazette = mockInstance.archiveGazette;
      retrieveGazette = mockInstance.retrieveGazette;
      archiveHotState = mockInstance.archiveHotState;
      retrieveHotState = mockInstance.retrieveHotState;
      getArchivedBoutIdsForSeason = mockInstance.getArchivedBoutIdsForSeason;
    },
    opfsArchive: mockInstance,
    ArchiveConflictError: class extends Error {},
    assertSafeFileNamePart: vi.fn(),
  };
});

function resetGlobalState() {
  let idCounter = 0;
  setMockIdGenerator(() => `id_${++idCounter}`);
  engineEventBus.clear();
  NewsletterFeed.clear();
}

// ---- helpers -------------------------------------------------------------
const tierOf = (id: string) => TRAITS[id]?.tier ?? '???';
const allWarriors = (s: GameState): Warrior[] => [
  ...s.roster,
  ...s.rivals.flatMap((r) => r.roster),
];
function traitHistogram(ws: Warrior[]) {
  const tier: Record<string, number> = {};
  let withTrait = 0;
  let totalTraits = 0;
  let flaws = 0;
  let classTraits = 0;
  for (const w of ws) {
    const ts = w.traits ?? [];
    if (ts.length) withTrait++;
    totalTraits += ts.length;
    for (const id of ts) {
      const t = TRAITS[id];
      tier[tierOf(id)] = (tier[tierOf(id)] ?? 0) + 1;
      if (t?.tier === 'Flaw') flaws++;
      if (t?.styles?.length) classTraits++;
    }
  }
  return { count: ws.length, withTrait, totalTraits, flaws, classTraits, tier };
}
const pct = (n: number, d: number) => (d ? ((100 * n) / d).toFixed(1) : '0.0') + '%';

describe('Emergent behavior report', () => {
  beforeEach(resetGlobalState, 600000);

  test('3-year headless sim', () => {
    const WEEKS = 156;
    const seed = 4242;
    let state = populateInitialWorld(createFreshState(seed.toString()), seed);

    const startRivalRosters = state.rivals.map((r) => r.roster.length);
    const startRecruitPool = state.recruitPool.length;
    const seededRivalOwners = state.rivals.map((r) => r.owner.personality ?? 'none');

    const rows: string[] = [];
    const header = `Wk  | yr | PlyRost | Dead | Retd | Rivals | RivWarr | AvgRivTreas | Bouts | TraitedWarr`;

    for (let w = 1; w <= WEEKS; w++) {
      // headless: auto-accept any decent player offer so player keeps fighting
      const playerIds = new Set(state.roster.map((x) => x.id));
      Object.values(state.boutOffers || {}).forEach((offer) => {
        if (offer.status !== 'Proposed') return;
        if (!offer.warriorIds.some((id) => playerIds.has(id))) return;
        offer.warriorIds
          .filter((id) => playerIds.has(id))
          .forEach((id) => {
            offer.responses[id] = 'Accepted';
          });
        if (offer.warriorIds.every((wid) => offer.responses[wid] !== 'Pending')) {
          offer.status = 'Signed';
        }
      });

      state = advanceWeek(state);

      // keep player alive so the sim doesn't stall (auto-recruit on empty)
      if (state.roster.length === 0 && state.recruitPool.length > 0) {
        state.roster.push({ ...state.recruitPool[0] } as Warrior);
        state.recruitPool.shift();
      }

      if (w % 12 === 0 || w === WEEKS) {
        const rivWarr = state.rivals.reduce((s, r) => s + r.roster.length, 0);
        const avgT = state.rivals.length
          ? Math.round(state.rivals.reduce((s, r) => s + r.treasury, 0) / state.rivals.length)
          : 0;
        const traited = allWarriors(state).filter((x) => (x.traits ?? []).length).length;
        rows.push(
          `${String(state.week).padEnd(3)} | ${String(state.year).padEnd(2)} | ` +
            `${String(state.roster.length).padEnd(7)} | ${String(state.graveyard.length).padEnd(4)} | ` +
            `${String(state.retired.length).padEnd(4)} | ${String(state.rivals.length).padEnd(6)} | ` +
            `${String(rivWarr).padEnd(7)} | ${String(avgT).padEnd(11)} | ` +
            `${String(state.arenaHistory.length).padEnd(5)} | ${traited}`
        );
      }
    }

    // ---- final deep snapshot --------------------------------------------
    const all = allWarriors(state);
    const hist = traitHistogram(all);
    const playerHist = traitHistogram(state.roster);

    const styleCount: Record<string, number> = {};
    const ages: number[] = [];
    for (const wr of all) {
      styleCount[wr.style] = (styleCount[wr.style] ?? 0) + 1;
      if (typeof wr.age === 'number') ages.push(wr.age);
    }
    const avgAge = ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : 'n/a';

    const rivalRosterSizes = state.rivals.map((r) => r.roster.length).sort((a, b) => a - b);
    const rivalTreasuries = state.rivals.map((r) => r.treasury).sort((a, b) => a - b);
    const personaCount: Record<string, number> = {};
    state.rivals.forEach((r) => {
      const p = r.owner.personality ?? 'none';
      personaCount[p] = (personaCount[p] ?? 0) + 1;
    });

    // per-personality churn proxy: graveyard+retired traceability isn't owner-tagged,
    // so report rival roster spread & treasury spread as the balance signal.
    const flawCarriers = all.filter((w) =>
      (w.traits ?? []).some((id) => TRAITS[id]?.tier === 'Flaw')
    );
    const multiFlaw = all.filter(
      (w) => (w.traits ?? []).filter((id) => TRAITS[id]?.tier === 'Flaw').length >= 2
    );

    const R: string[] = [];
    R.push(
      '\n================ EMERGENT BEHAVIOR REPORT (156 weeks / 3 yrs, seed 4242) ================'
    );
    R.push('\n--- TIMELINE (yearly-ish snapshots) ---');
    R.push(header);
    R.push(rows.join('\n'));

    R.push('\n--- WORLD POPULATION (final) ---');
    R.push(
      `Total living warriors: ${all.length}  (player ${state.roster.length}, rivals ${all.length - state.roster.length})`
    );
    R.push(`Graveyard (dead): ${state.graveyard.length}   Retired: ${state.retired.length}`);
    R.push(`Total bouts fought: ${state.arenaHistory.length}`);
    R.push(`Avg warrior age: ${avgAge}  (min ${Math.min(...ages)}, max ${Math.max(...ages)})`);
    R.push(`Recruit pool: start ${startRecruitPool} -> end ${state.recruitPool.length}`);

    R.push('\n--- RIVAL STABLES (final) ---');
    R.push(`Rival count: start ${startRivalRosters.length} -> end ${state.rivals.length}`);
    R.push(`Rival roster sizes (start): [${startRivalRosters.join(', ')}]`);
    R.push(`Rival roster sizes (end):   [${rivalRosterSizes.join(', ')}]`);
    R.push(`Rival treasuries (end, sorted): [${rivalTreasuries.join(', ')}]`);
    R.push(`Personality mix (end): ${JSON.stringify(personaCount)}`);
    R.push(
      `Personality mix (start): ${JSON.stringify(seededRivalOwners.reduce((m: Record<string, number>, p) => ((m[p] = (m[p] ?? 0) + 1), m), {}))}`
    );

    R.push('\n--- TRAIT EMERGENCE (the new systems) ---');
    R.push(
      `Warriors carrying >=1 trait: ${hist.withTrait}/${hist.count} (${pct(hist.withTrait, hist.count)})`
    );
    R.push(
      `  player roster: ${playerHist.withTrait}/${playerHist.count} (${pct(playerHist.withTrait, playerHist.count)})`
    );
    R.push(
      `Total traits in world: ${hist.totalTraits}  (avg ${(hist.totalTraits / hist.count).toFixed(2)}/warrior)`
    );
    R.push(`Tier distribution: ${JSON.stringify(hist.tier)}`);
    R.push(`Class-restricted traits earned: ${hist.classTraits}`);
    R.push(
      `Flaw instances: ${hist.flaws}  | warriors with >=1 flaw: ${flawCarriers.length}  | with >=2 flaws (cut candidates): ${multiFlaw.length}`
    );

    R.push('\n--- STYLE SPREAD (final, all warriors) ---');
    R.push(JSON.stringify(styleCount));

    R.push(
      '\n========================================================================================\n'
    );
    console.log(R.join('\n'));

    expect(state.week).toBeGreaterThan(WEEKS - 5);
  }, 600000);
});
