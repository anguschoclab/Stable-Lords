/**
 * V23 — design-doctrine review surfaces (Arena 93 design articles):
 * per-style minimum-stat floors, the burner-build note, and Drake's
 * rollup-first ordering advice. Advisory only — the review informs,
 * it never blocks.
 */
import { describe, it, expect } from 'vitest';
import { reviewWarriorDesign } from '@/engine/warrior/designReview';
import { STYLE_DESIGN_MINIMUMS, DA_WL_FLOOR, DA_ST_FLOOR } from '@/data/designDoctrine';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/shared.types';

const attrs = (over: Partial<Attributes> = {}): Attributes => ({
  ST: 10,
  CN: 10,
  SZ: 10,
  WT: 10,
  WL: 10,
  SP: 10,
  DF: 10,
  ...over,
});

describe('STYLE_DESIGN_MINIMUMS — canon minimum-stat tables', () => {
  it('covers all ten fighting styles', () => {
    for (const style of Object.values(FightingStyle)) {
      expect(STYLE_DESIGN_MINIMUMS[style]).toBeDefined();
    }
  });

  it('striker minimums match Assur (ST 9 / WT 11 / WL 9 / DF 11)', () => {
    expect(STYLE_DESIGN_MINIMUMS[FightingStyle.StrikingAttack]).toMatchObject({
      ST: 9,
      WT: 11,
      WL: 9,
      DF: 11,
    });
  });

  it('every minimum sits inside the legal attribute band', () => {
    for (const mins of Object.values(STYLE_DESIGN_MINIMUMS)) {
      for (const v of Object.values(mins ?? {})) {
        expect(v).toBeGreaterThanOrEqual(3);
        expect(v).toBeLessThanOrEqual(25);
      }
    }
  });
});

describe('reviewWarriorDesign — minimums axis (V23)', () => {
  it('a build below its style floor draws a warn-tier minimums item', () => {
    // Striker floor DF 11 — a DF 3 striker is DOA per the articles.
    const items = reviewWarriorDesign(
      attrs({ DF: 3, WT: 15, WL: 15, ST: 12 }),
      FightingStyle.StrikingAttack
    );
    const minimums = items.find((i) => i.title.toLowerCase().includes('minimum'));
    expect(minimums).toBeDefined();
    expect(['warn', 'info']).toContain(minimums!.verdict);
    expect(minimums!.detail).toContain('DF');
  });

  it('a build meeting its floor does not warn on minimums', () => {
    const items = reviewWarriorDesign(
      attrs({ ST: 12, WT: 14, WL: 14, DF: 14 }),
      FightingStyle.StrikingAttack
    );
    const warn = items.filter(
      (i) => i.verdict === 'warn' && i.title.toLowerCase().includes('minimum')
    );
    expect(warn).toHaveLength(0);
  });
});

describe('reviewWarriorDesign — Dark Arena rule + rollup-first note', () => {
  it(`WL < ${DA_WL_FLOOR} or ST < ${DA_ST_FLOOR} raises the DA-rule advisory`, () => {
    const lowWL = reviewWarriorDesign(attrs({ WL: 5 }), FightingStyle.BashingAttack);
    const lowST = reviewWarriorDesign(attrs({ ST: 5 }), FightingStyle.BashingAttack);
    for (const items of [lowWL, lowST]) {
      const da = items.find((i) => /dark arena|doa|rejection/i.test(i.detail + i.title));
      expect(da).toBeDefined();
    }
  });

  it('the rollup-first ordering note is advisory (info tier)', () => {
    const items = reviewWarriorDesign(attrs(), FightingStyle.StrikingAttack);
    const rollup = items.find((i) => /rollup|stat order|allocate/i.test(i.detail + i.title));
    expect(rollup).toBeDefined();
    expect(rollup!.verdict).toBe('info');
  });
});
