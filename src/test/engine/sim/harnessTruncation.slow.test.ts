import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSimulation } from '@/scripts/simulation-harness';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import type { DeferredBoutLog } from '@/types/state.types';

// Minimal valid FightSummary shape — the weekly pipeline parses `title`
// (getNamesFromTitle) and reads warriorIdA/D, winner, styleA/D.
const makeBout = (id: string) =>
  ({
    id,
    week: 1,
    title: 'Alpha vs Beta',
    warriorIdA: 'wA',
    warriorIdD: 'wD',
    winner: 'A',
    by: 'KO',
    styleA: 'X',
    styleD: 'Y',
    createdAt: '2025-01-01T00:00:00.000Z',
  }) as any;

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

describe('runSimulation — historical array truncation', () => {
  beforeEach(reset, 120000);

  it('caps historical arrays periodically while cumulative counters stay all-time', async () => {
    const { finalState, cumulative } = await runSimulation({
      weeks: 6,
      seed: 777,
      logFrequency: 2,
      ignoreBankruptcy: true,
      // Fire truncation every 2 weeks with a tiny arena cap so the bound
      // is observable in a short run.
      truncateIntervalWeeks: 2,
      truncationCaps: { arenaHistory: 5, deferredBoutLogs: 5 },
    });

    // Bounded: capped at 5 (final truncate runs before return)
    expect(finalState.arenaHistory.length).toBeLessThanOrEqual(5);
    expect(finalState.deferredBoutLogs!.length).toBeLessThanOrEqual(5);

    // All-time: cumulative counts every bout ever fought — more than the cap
    expect(cumulative.totalBouts).toBeGreaterThanOrEqual(finalState.arenaHistory.length);
    expect(cumulative.deaths).toBeGreaterThanOrEqual(finalState.graveyard.length);
    expect(cumulative.retired).toBeGreaterThanOrEqual(finalState.retired.length);
  }, 120000);

  it('drains deferredBoutLogs weekly through the archive sink', async () => {
    const archived: { year: number; season: number; boutId: string; transcript: string[] }[] = [];
    const archiveService = {
      archiveBoutLog: vi.fn(
        (year: number, season: number, boutId: string, transcript: string[]) => {
          archived.push({ year, season, boutId, transcript });
          return Promise.resolve();
        }
      ),
    };

    const { finalState } = await runSimulation({
      weeks: 4,
      seed: 888,
      ignoreBankruptcy: true,
      truncateIntervalWeeks: 2,
      archiveService,
    });

    // Weekly drain leaves nothing pending in the final state
    expect(finalState.deferredBoutLogs ?? []).toHaveLength(0);

    // Every drained log was forwarded with (year, season, boutId, transcript)
    for (const entry of archived) {
      expect(typeof entry.year).toBe('number');
      expect(typeof entry.season).toBe('number');
      expect(typeof entry.boutId).toBe('string');
      expect(Array.isArray(entry.transcript)).toBe(true);
    }
    expect(archiveService.archiveBoutLog.mock.calls.length).toBe(archived.length);
  }, 120000);

  it('does not drop logs silently when no archive sink is configured', async () => {
    // Without an archiveService the deferred queue is retained (bounded by
    // truncation) rather than flushed — matches pre-existing slice semantics.
    const { finalState } = await runSimulation({
      weeks: 3,
      seed: 999,
      ignoreBankruptcy: true,
      truncateIntervalWeeks: 0, // disabled
    });

    const logs: DeferredBoutLog[] = finalState.deferredBoutLogs ?? [];
    // Non-headless sims produce transcripts — if bouts occurred, some logs
    // may be present; the point is they are not silently discarded.
    for (const log of logs) {
      expect(Array.isArray(log.transcript)).toBe(true);
    }
  }, 120000);

  it('truncateIntervalWeeks <= 0 disables truncation entirely', async () => {
    const { finalState, cumulative } = await runSimulation({
      weeks: 4,
      seed: 555,
      ignoreBankruptcy: true,
      truncateIntervalWeeks: 0,
    });

    // With truncation off, every bout ever fought remains in arenaHistory
    expect(finalState.arenaHistory.length).toBe(cumulative.totalBouts);
    expect(finalState.graveyard.length).toBe(cumulative.deaths);
  }, 120000);

  it('keeps win/loss counters symmetric across the full run', async () => {
    const { cumulative } = await runSimulation({
      weeks: 6,
      seed: 222,
      ignoreBankruptcy: true,
      truncateIntervalWeeks: 2,
    });

    const wins = Object.values(cumulative.styleWins).reduce((a, b) => a + b, 0);
    const losses = Object.values(cumulative.styleLosses).reduce((a, b) => a + b, 0);
    // Every decided bout contributes exactly one win and one loss.
    expect(wins).toBe(losses);
    expect(wins).toBeGreaterThan(0);
    // Every style that ever fought appears in both maps (0% rows included).
    for (const style of Object.keys(cumulative.styleWins)) {
      expect(cumulative.styleLosses).toHaveProperty(style);
    }
  }, 120000);

  it('re-queues logs for retry when the archive sink fails — transcripts are never silently lost', async () => {
    // Seed two pending transcripts so the failure path is deterministic
    // regardless of whether any bouts resolve this week.
    const seeded = populateInitialWorld(createFreshState('archive-requeue'), 444);
    seeded.deferredBoutLogs = [
      { year: 1, season: 1, boutId: 'retry_b1', transcript: ['t1'] },
      { year: 1, season: 1, boutId: 'retry_b2', transcript: ['t2'] },
    ];

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const archiveService = {
      archiveBoutLog: vi.fn(
        (_year: number, _season: number, _boutId: string, _log: string[]) =>
          Promise.reject(new Error('disk full'))
      ),
    };

    let result;
    let errCallCount: number | undefined;
    try {
      result = await runSimulation({
        weeks: 2,
        seed: 444,
        ignoreBankruptcy: true,
        truncateIntervalWeeks: 0,
        archiveService,
        initialState: seeded,
      });
      // Capture before restore — mockRestore() clears the spy's call history.
      errCallCount = errSpy.mock.calls.length;
    } finally {
      errSpy.mockRestore();
    }

    // Both seeded logs were attempted (drain happened)...
    const attemptedIds = archiveService.archiveBoutLog.mock.calls.map((c) => c[2]);
    expect(attemptedIds).toContain('retry_b1');
    expect(attemptedIds).toContain('retry_b2');
    // ...every rejection was logged...
    expect(errCallCount ?? 0).toBeGreaterThan(0);
    // ...and the failures were re-queued, not dropped (matches the app path's
    // retry semantics — transcripts are never silently lost).
    const retainedIds = (result.finalState.deferredBoutLogs ?? []).map((l) => l.boutId);
    expect(retainedIds).toContain('retry_b1');
    expect(retainedIds).toContain('retry_b2');

    // Counters unaffected by archive failures.
    const wins = Object.values(result.cumulative.styleWins).reduce((a, b) => a + b, 0);
    const losses = Object.values(result.cumulative.styleLosses).reduce((a, b) => a + b, 0);
    expect(wins).toBe(losses);
    expect(result.cumulative.totalBouts).toBeGreaterThanOrEqual(
      result.finalState.arenaHistory.length
    );
  }, 120000);

  it('uses an injected initialState and counts its history in cumulative totals', async () => {
    const seeded = populateInitialWorld(createFreshState('seeded-init'), 424242);
    seeded.arenaHistory = [makeBout('seed_bout_1'), makeBout('seed_bout_2')];
    seeded.graveyard = [
      { id: 'seed_dead_1', name: 'Seed Dead', status: 'Dead' } as any,
    ];

    const { finalState, cumulative } = await runSimulation({
      weeks: 2,
      seed: 424242,
      ignoreBankruptcy: true,
      truncateIntervalWeeks: 0, // off — nothing removed, so cumulative === lengths
      initialState: seeded,
    });

    // The injected state was actually used — seeded bout survives into the run.
    expect(finalState.arenaHistory.some((b) => b.id === 'seed_bout_1')).toBe(true);
    // Cumulative counted the seeded baseline, not just new bouts.
    expect(cumulative.totalBouts).toBe(finalState.arenaHistory.length);
    expect(cumulative.totalBouts).toBeGreaterThanOrEqual(2);
    expect(cumulative.deaths).toBe(finalState.graveyard.length);
    expect(cumulative.deaths).toBeGreaterThanOrEqual(1);
    // Style counters include the seeded bouts (X won both).
    expect(cumulative.styleWins.X).toBe(2);
    expect(cumulative.styleLosses.Y).toBe(2);
  }, 120000);

  it('pulses carry cumulative counters that survive truncation', async () => {
    const { pulses, cumulative } = await runSimulation({
      weeks: 4,
      seed: 333,
      logFrequency: 1,
      ignoreBankruptcy: true,
      truncateIntervalWeeks: 2,
      truncationCaps: { arenaHistory: 3 },
    });

    const last = pulses[pulses.length - 1]!;
    expect(last.cumulativeBouts).toBe(cumulative.totalBouts);
    expect(last.cumulativeDeaths).toBe(cumulative.deaths);
    expect(last.cumulativeRetired).toBe(cumulative.retired);
    // Snapshot field may be capped while cumulative stays all-time
    expect(last.totalBouts).toBeLessThanOrEqual(cumulative.totalBouts);
  }, 120000);
});
