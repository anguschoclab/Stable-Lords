import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import type { GameState } from '@/types/state.types';

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

const totalRivalWarriors = (s: GameState) => s.rivals.reduce((acc, r) => acc + r.roster.length, 0);

describe('world evolves while the player is stopped', () => {
  beforeEach(reset, 120000);

  it('keeps running rival bouts after the player goes bankrupt', () => {
    let state = populateInitialWorld(createFreshState('freeze-fix'), 777);
    state.treasury = -10000; // force the player permanently below BANKRUPTCY_THRESHOLD

    // advance one week so any in-flight offers settle, then measure the baseline
    state = advanceWeek(state, { headless: true });
    const boutsAfterWarmup = state.arenaHistory.length;

    for (let i = 0; i < 8; i++) state = advanceWeek(state, { headless: true });

    // The bug: arenaHistory freezes once bankrupt. The fix: rival-vs-rival
    // world bouts keep firing, so the bout count must grow.
    expect(state.treasury).toBeLessThanOrEqual(-500); // still bankrupt the whole time
    expect(state.arenaHistory.length).toBeGreaterThan(boutsAfterWarmup);
  }, 120000);

  it('keeps rival rosters alive when the player roster is empty', () => {
    let state = populateInitialWorld(createFreshState('empty-roster'), 778);
    state.roster = []; // player has no warriors

    for (let i = 0; i < 8; i++) state = advanceWeek(state, { headless: true });

    // World keeps churning: rivals must still exist and have non-empty rosters.
    expect(state.rivals.length).toBeGreaterThan(0);
    expect(state.rivals.every((r) => r.roster.length > 0)).toBe(true);
    // Rival population should not have collapsed to nothing.
    expect(totalRivalWarriors(state)).toBeGreaterThan(0);
  }, 120000);
});
