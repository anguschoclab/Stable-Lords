// @vitest-isolate — mutates the shared TRUNCATION_CAPS const; must not run in
// a shared worker alongside tests that read the caps mid-flight.
import { describe, it, expect, afterAll } from 'vitest';
import type { GameState } from '@/types/state.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { TimeAdvanceService } from '@/engine/pipeline/tick/timeAdvance/service';
import { TRUNCATION_CAPS } from '@/engine/storage/truncation';
import { drainDeferredBoutLogs } from '@/engine/storage/deferredBoutLogs';

/**
 * MEGAPLAN-V14 B1 — truncation-cadence determinism (test-first; RED until
 * the Phase-5b cadence normalization lands):
 *
 * `truncateState` is applied at batch-span boundaries (month: w4, quarter:
 * w13, year: every quarter end) and every 50 weeks + finish in autosim —
 * but NEVER on the sequential `advanceWeek` path (in-session it is applied
 * only to the persisted copy at save time). Capped arrays
 * (`matchHistory`, `arenaHistory`, `rivalries`, `newsletter`, `graveyard`…)
 * are read by sim passes (rivalStableShard, PromoterPass, WorldPass,
 * arenaChampionship), so once a cap is crossed mid-run the two paths no
 * longer produce identical worlds.
 *
 * This spec shrinks the caps so a single quarter crosses them, then runs the
 * same seeded 13 weeks through sequential advanceWeek vs advanceQuarter and
 * byte-compares the final states (deferredBoutLogs drained on both sides —
 * sequential leaves them on the state, batch drains weekly; that asymmetry
 * is by design and normalized here).
 */

const SAVED_CAPS = { ...TRUNCATION_CAPS };

afterAll(() => {
  Object.assign(TRUNCATION_CAPS, SAVED_CAPS);
});

describe('truncation cadence — sequential vs batch determinism', () => {
  it('sequential weekly advance and a month span produce identical final state once caps are crossed', async () => {
    // Shrink caps far below what 13 weeks of a fresh world generates.
    Object.assign(TRUNCATION_CAPS, {
      arenaHistory: 4,
      arenaHistoryTranscripts: 2,
      matchHistory: 4,
      newsletter: 2,
      ledger: 8,
      graveyard: 4,
      retired: 4,
      killEvents: 8,
      tournaments: 4,
      scoutReports: 2,
      hallOfFame: 4,
      rivalries: 4,
      moodHistory: 4,
    });

    const seed = 'v14-truncation-cadence';
    const t0 = '2026-04-28T09:00:00Z';

    let sequential = createFreshState(seed, t0);
    for (let i = 0; i < 4; i++) {
      sequential = await advanceWeek(sequential, { headless: true, mutableInput: i > 0 });
    }
    // Sequential sessions surface deferred logs on the state; drain them so
    // only sim-affecting differences remain.
    drainDeferredBoutLogs(sequential);

    const batch = await TimeAdvanceService.advanceMonth(createFreshState(seed, t0), {
      headless: true,
    });

    // lastWeekBoutDisplay is UI-only chrome — never read inbound by the
    // engine, stripped at serialization — and its per-path lifetime differs
    // by design: sequential weeks keep it (finalizeState restores the display
    // the bout phase produced), while span-end teardown truncation clears it
    // (pre-V14 batch semantics). Excluded from the sim-state byte-compare.
    const stripDisplay = (s: GameState) => JSON.stringify({ ...s, lastWeekBoutDisplay: undefined });

    expect(
      stripDisplay(sequential) === stripDisplay(batch.state),
      'sequential vs batch worlds diverged once truncation caps were crossed — ' +
        'truncateState cadence is not uniform across time scales (B1)'
    ).toBe(true);
  });
});
