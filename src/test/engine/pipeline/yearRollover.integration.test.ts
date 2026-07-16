import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';

// OPFS archive is browser-only; mock it exactly as the headless harness does.
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

describe('year rollover', () => {
  beforeEach(reset, 120000);

  it('world bouts keep firing across the week-52 → week-1 boundary', () => {
    let state = populateInitialWorld(createFreshState('rollover'), 4141);
    // Jump to late in the year. Keep week/year/absoluteWeek consistent.
    state.week = 50;
    state.year = 1;
    // We add absoluteWeek as required by the new type
    (state as any).absoluteWeek = deriveAbsoluteWeek(1, 50);

    const boutsPerWeek: number[] = [];
    let prev = state.arenaHistory.length;
    for (let i = 0; i < 6; i++) {
      state = advanceWeek(state, { headless: true });
      boutsPerWeek.push(state.arenaHistory.length - prev);
      prev = state.arenaHistory.length;
    }

    // Weeks simulated: 51, 52, 1(y2), 2, 3, 4. The bug: bouts booked in week 52
    // for "week 53" never match week 1, so the rollover week goes silent.
    expect(state.year).toBe(2);
    const rolloverWeekBouts = boutsPerWeek[2]!; // the first week of year 2
    expect(rolloverWeekBouts, `bouts per week: [${boutsPerWeek.join(', ')}]`).toBeGreaterThan(0);
    // And the counter is monotonic:
    expect((state as any).absoluteWeek).toBe(deriveAbsoluteWeek(1, 50) + 6);
  }, 120000);
});
