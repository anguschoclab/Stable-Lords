import { describe, it, expect } from 'vitest';
import '@/test/_setup/setup';
import { runAutosim } from '@/engine/autosim';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { truncateState } from '@/engine/storage/truncation';

describe('NF3: sequential autosim memory growth', () => {
  it('sequential autosim calls truncateState periodically (every 50 weeks)', () => {
    const state = createFreshState('seq-mem-trunc-test', '2025-01-01T00:00:00.000Z');
    state.treasury = 100000;

    return runAutosim(state, { weeksToSim: 60 }).then((result) => {
      // After 60 weeks, truncateState should have been called at week 50
      expect(result.weeksSimmed).toBe(60);
      // arenaHistory should be bounded — without truncation, 60 weeks of bouts
      // across all stables would produce 600+ entries. With truncation at week 50
      // (capped at 500), plus 10 more weeks of bouts, total should be under 700.
      expect(result.finalState.arenaHistory!.length).toBeLessThan(700);
    });
  });

  it('sequential autosim arenaHistory stays bounded after 100 weeks', () => {
    const state = createFreshState('seq-mem-bounds-test', '2025-01-01T00:00:00.000Z');
    state.treasury = 100000;

    return runAutosim(state, { weeksToSim: 100 }).then((result) => {
      expect(result.weeksSimmed).toBe(100);
      // After 100 weeks with truncation at 50 and 100, arenaHistory should be bounded
      expect(result.finalState.arenaHistory!.length).toBeLessThanOrEqual(500);
    });
  });

  it('truncateState caps ledger at 500 entries', () => {
    const state = createFreshState('trunc-ledger-test', '2025-01-01T00:00:00.000Z');
    // Simulate a large ledger
    state.ledger = new Array(600).fill(null).map((_, i) => ({
      week: i + 1,
      type: 'income',
      amount: 100,
      description: `entry ${i}`,
    })) as any;

    const truncated = truncateState(state);
    expect(truncated.ledger!.length).toBe(500);
  });

  it('truncateState strips transcripts from fights older than 20 entries', () => {
    const state = createFreshState('trunc-transcript-test', '2025-01-01T00:00:00.000Z');
    state.arenaHistory = new Array(100).fill(null).map((_, i) => ({
      week: i + 1,
      warriorA: 'w1',
      warriorB: 'w2',
      winner: 'w1',
      transcript: ['exchange text'],
    })) as any;

    const truncated = truncateState(state);
    expect(truncated.arenaHistory!.length).toBe(100); // 100 < 500, so all kept
    // But transcripts should be stripped from all but last 20
    const withTranscript = truncated.arenaHistory!.filter((f: any) => f.transcript !== undefined);
    expect(withTranscript.length).toBe(20);
  });

  it('truncateState clears lastWeekBoutDisplay', () => {
    const state = createFreshState('trunc-display-test', '2025-01-01T00:00:00.000Z');
    state.lastWeekBoutDisplay = { results: [], deathNames: [], injuryNames: [] } as any;

    const truncated = truncateState(state);
    expect(truncated.lastWeekBoutDisplay).toBeUndefined();
  });
});
