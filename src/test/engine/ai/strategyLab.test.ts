/**
 * Strategy Lab — stuck detection: a proven plan that keeps losing is not a
 * plan worth exploiting. When the ledger's best cell has enough visits and
 * still can't win, the lab must keep tinkering (explore) instead of
 * exploiting a loser. Evidence-driven, deterministic.
 */
import { describe, it, expect } from 'vitest';
import { pickStrategyTarget, cellKey, bandOf } from '@/engine/ai/plan/strategyLab';
import type { StrategyMemory } from '@/types/warrior.types';

const mem = (cells: StrategyMemory['cells']): StrategyMemory => ({ cells });

describe('pickStrategyTarget — stuck detection', () => {
  it('keeps exploring when the best-proven cell still loses most of the time', () => {
    const stuck = mem({
      'M/M': { w: 1, l: 5 },
      'H/M': { w: 2, l: 4 },
      'VL/L': { w: 0, l: 4 },
    });
    // Across many weeks the lab must never "exploit" a 30%-ish cell.
    for (let week = 1; week <= 20; week++) {
      const target = pickStrategyTarget(stuck, 'warrior-stuck', week);
      expect(target).not.toBeNull();
      expect(target!.exploring).toBe(true);
    }
  });

  it('exploits a proven winning cell when the hash allows it', () => {
    const proven = mem({
      'H/M': { w: 6, l: 1 },
      'M/M': { w: 1, l: 4 },
    });
    // Find a deterministic week where the roll lands on exploit.
    let exploited: ReturnType<typeof pickStrategyTarget> = null;
    for (let week = 1; week <= 60 && !exploited; week++) {
      const t = pickStrategyTarget(proven, 'warrior-winner', week);
      if (t && !t.exploring) exploited = t;
    }
    expect(exploited).not.toBeNull();
    // The winning cell is H/M → mid-band representatives.
    expect(exploited!.oe).toBe(8);
    expect(exploited!.al).toBe(6);
  });

  it('returns null on an empty ledger (fight first, learn later)', () => {
    expect(pickStrategyTarget(mem({}), 'w', 1)).toBeNull();
  });

  it('is deterministic — same id + week → same target', () => {
    const m = mem({ 'M/M': { w: 3, l: 1 }, 'L/L': { w: 1, l: 2 } });
    const a = pickStrategyTarget(m, 'same-warrior', 7);
    const b = pickStrategyTarget(m, 'same-warrior', 7);
    expect(a).toEqual(b);
  });
});

describe('cellKey/bandOf', () => {
  it('buckets OE/AL into the canon rhythm bands', () => {
    expect(bandOf(1)).toBe('VL');
    expect(bandOf(2)).toBe('VL');
    expect(bandOf(5)).toBe('M');
    expect(bandOf(10)).toBe('VH');
    expect(cellKey(9, 3)).toBe('VH/L');
  });
});
