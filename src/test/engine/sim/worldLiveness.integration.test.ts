import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';
import { runSimulation } from '@/scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';

// OPFS archive is browser-only; mock it exactly as the headless harness test does.
vi.mock('@/engine/storage/opfsArchive', () => {
  const m = {
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
      isSupported = m.isSupported;
      archiveBoutLog = m.archiveBoutLog;
      retrieveBoutLog = m.retrieveBoutLog;
      archiveGazette = m.archiveGazette;
      retrieveGazette = m.retrieveGazette;
      archiveHotState = m.archiveHotState;
      retrieveHotState = m.retrieveHotState;
      getArchivedBoutIdsForSeason = m.getArchivedBoutIdsForSeason;
    },
    opfsArchive: m,
    ArchiveConflictError: class extends Error {},
    assertSafeFileNamePart: vi.fn(),
  };
});

function reset() {
  let n = 0;
  setMockIdGenerator(() => `id_${++n}`);
  engineEventBus.clear();
  NewsletterFeed.clear();
}

describe('world liveness over a long sim (104 weeks)', () => {
  beforeEach(reset, 300000);

  it('never freezes: bouts keep happening through the back half of the run', () => {
    const { pulses } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 4, // a pulse every 4 weeks
      ignoreBankruptcy: true, // keep advancing even if the player goes broke
    });

    expect(pulses.length).toBeGreaterThan(10);
    const mid = pulses[Math.floor(pulses.length / 2)]!;
    const end = pulses[pulses.length - 1]!;

    // FREEZE GUARD: total bouts must keep climbing in the second half of the run.
    // Pre-fix, this is flat (the world froze once the player went bankrupt).
    expect(end.totalBouts).toBeGreaterThan(mid.totalBouts);
  }, 400000);

  it('rival population stays alive and does not monotonically bleed out', () => {
    const { finalState, pulses } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 4,
      ignoreBankruptcy: true,
    });

    // Every rival stable still fields warriors at the end (recruiting refills churn).
    expect(finalState.rivals.length).toBeGreaterThan(0);
    expect(finalState.rivals.every((r) => r.roster.length > 0)).toBe(true);

    const totalRivalWarriors = finalState.rivals.reduce((s, r) => s + r.roster.length, 0);
    // World started ~350+ rival warriors; a healthy world keeps a large standing
    // population. A collapse (the unrefilled-bleed symptom) would drop far below this.
    expect(totalRivalWarriors).toBeGreaterThan(150);

    // Deaths should accumulate (combat is lethal sometimes) but not exterminate.
    const end = pulses[pulses.length - 1]!;
    expect(end.deadCount).toBeGreaterThan(0);
  }, 400000);

  it('traits keep emerging across the world', () => {
    const { pulses } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 4,
      ignoreBankruptcy: true,
    });
    const end = pulses[pulses.length - 1]!;

    // A meaningful share of the world carries traits (births + development).
    expect(end.traitedWarriors).toBeGreaterThan(0);
    expect(end.totalTraits).toBeGreaterThan(0);
    // Some flaws exist in the world (births + training botches).
    expect(end.flawInstances).toBeGreaterThan(0);
  }, 400000);

  it('class identity and Signatures emerge, with acquisition in a sane band', () => {
    const { pulses, finalState } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 4,
      ignoreBankruptcy: true,
    });
    const end = pulses[pulses.length - 1]!;
    const allWarriors = [...finalState.roster, ...finalState.rivals.flatMap((r) => r.roster)];

    // Class-restricted traits now reachable: at least a few exist world-wide.
    expect(end.classTraitInstances).toBeGreaterThan(0);
    // The top tier shows up at least once across the world over a season.
    expect(end.signatureInstances).toBeGreaterThan(0);

    // Acquisition is present (not zero) but doesn't fully saturate to the
    // hard cap — the soft-cap guard in rivalTraitAI.integration.test.ts checks
    // that < 25% reach 3 traits. Here we only assert presence + a floor.
    const traitedShare = end.traitedWarriors / Math.max(1, allWarriors.length);
    expect(traitedShare).toBeGreaterThan(0.2); // traits do emerge
    expect(traitedShare).toBeLessThan(0.8); // …but the world is NOT saturated (was 0.99)
    const blankShare = 1 - traitedShare;
    expect(blankShare).toBeGreaterThan(0.18); // a real population stays permanently blank
  }, 300000);

  it('multi-flaw warriors occur during the run, feeding the Release cull', () => {
    const { pulses } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 2, // sample often so transient multi-flaw warriors are caught
      ignoreBankruptcy: true,
    });
    const peakMultiFlaw = Math.max(...pulses.map((p) => p.multiFlawWarriors));
    // Flaw exposure pushes some struggling/flawed warriors to 2 flaws before the
    // liability cull releases them — so we must see at least one across the run.
    expect(peakMultiFlaw).toBeGreaterThan(0);
  }, 300000);
});

describe('world liveness — measured baseline (diagnostic, no hard assert)', () => {
  beforeEach(reset, 400000);

  it('logs end-of-run trait & churn metrics', () => {
    const { pulses, finalState } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 4,
      ignoreBankruptcy: true,
    });
    const end = pulses[pulses.length - 1]!;
    const all = [...finalState.roster, ...finalState.rivals.flatMap((r) => r.roster)];

    console.log(
      `[liveness] week=${end.week} bouts=${end.totalBouts} dead=${end.deadCount} ` +
        `traited=${end.traitedWarriors}/${all.length} totalTraits=${end.totalTraits} ` +
        `flaws=${end.flawInstances} multiFlaw=${end.multiFlawWarriors} ` +
        `classTraits=${end.classTraitInstances} signature=${end.signatureInstances}`
    );
    expect(end.week).toBeGreaterThan(0);
  }, 400000);
});
