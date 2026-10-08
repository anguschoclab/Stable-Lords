import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { runAutosim } from '@/engine/autosim/autosim';
import { TimeAdvanceService } from '@/engine/pipeline/tick/timeAdvance/service';

/**
 * MEGAPLAN-V14 span-teardown parity (characterization):
 *
 * Every multi-week entry point must end with the same teardown guarantees:
 * terminal tournament sweep (no unresolved brackets escape a batch), archive
 * drain (logs surfaced to `pendingArchives` — or, for autosim, none produced
 * because headless), and bounded-history truncation. Autosim additionally
 * routes player-offer processing per week, so final states legitimately
 * differ; the contract pinned here is teardown *shape*, not byte equality.
 */

const SEED = 'v14-teardown-parity';
const T0 = '2026-04-28T09:00:00Z';

describe('batch teardown parity', () => {
  it('advanceQuarter returns swept, drained, truncated state', async () => {
    const result = await TimeAdvanceService.advanceQuarter(createFreshState(SEED, T0), {
      headless: true,
    });
    expect(result.weeksCompleted).toBe(13);
    expect(
      (result.state.tournaments ?? []).every((t) => t.completed),
      'quarter returned with an unfinished tournament — terminal sweep missing'
    ).toBe(true);
    expect(
      result.state.deferredBoutLogs ?? [],
      'quarter returned deferredBoutLogs on state — weekly drain into pendingArchives missed them'
    ).toEqual([]);
    expect(result.state.arenaHistory.length).toBeLessThanOrEqual(500);
  });

  it('autosim finishes swept, truncated, and transcript-free', async () => {
    const result = await runAutosim(createFreshState(SEED, T0), {
      weeksToSim: 13,
      stopConditions: [],
    });
    expect(result.weeksSimmed).toBe(13);
    expect(
      (result.finalState.tournaments ?? []).every((t) => t.completed),
      'autosim returned with an unfinished tournament — terminal sweep missing'
    ).toBe(true);
    expect(result.finalState.deferredBoutLogs ?? []).toEqual([]);
    expect(result.finalState.arenaHistory.length).toBeLessThanOrEqual(500);
  });

  it(
    'advanceYear composes four quarters with one pendingArchives stream',
    async () => {
      const result = await TimeAdvanceService.advanceYear(createFreshState(SEED, T0), {
        headless: true,
      });
      expect(result.quarterResults).toHaveLength(4);
      for (const q of result.quarterResults) {
        expect(q.weeksCompleted).toBe(13);
        expect(q.state.deferredBoutLogs ?? []).toEqual([]);
      }
      expect((result.state.tournaments ?? []).every((t) => t.completed)).toBe(true);
    },
    // 52 headless weeks exceed bun's 5s default test timeout (~11s there).
    60_000
  );
});
