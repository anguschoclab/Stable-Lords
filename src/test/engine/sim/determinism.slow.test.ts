import { describe, it, expect, vi, afterEach } from 'vitest';
import { runSimulation } from '@/scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import { createHash } from 'crypto';

vi.mock('@/engine/storage/opfsArchive', () => {
  const m = {
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
      isSupported = () => true;
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

function resetIds() {
  let n = 0;
  setMockIdGenerator(() => `id_${++n}`);
}

function rivalsHash(state: { rivals: unknown }): string {
  return createHash('sha256').update(JSON.stringify(state.rivals)).digest('hex');
}

describe('harness determinism (I.2)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('two runs, one seed → identical SimPulse sequence and rivals hash', async () => {
    const FIXED_ISO = '2026-04-11T09:00:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

    resetIds();
    engineEventBus.clear();
    NewsletterFeed.clear();
    const a = await runSimulation({ weeks: 8, seed: 777, logFrequency: 1, ignoreBankruptcy: true });

    resetIds();
    engineEventBus.clear();
    NewsletterFeed.clear();
    const b = await runSimulation({ weeks: 8, seed: 777, logFrequency: 1, ignoreBankruptcy: true });

    expect(JSON.stringify(a.pulses)).toBe(JSON.stringify(b.pulses));
    expect(rivalsHash(a.finalState)).toBe(rivalsHash(b.finalState));
  }, 240000);
});
