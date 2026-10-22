import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectSizes } from '../../../scripts/function-length.mjs';

/**
 * MEGAPLAN-V19 single-responsibility decomposition spec (authored test-first).
 *
 * The V18 >80-line queue drained to zero; V19 re-baseline found 6 new
 * functions past 80 (grown since by perf/feature commits). Every contract
 * asserts the target file holds no function over FN_BUDGET after the split —
 * orchestrator + named-helper pattern (v18Srp precedent).
 *
 * Queue from MEGAPLAN_V19_FINDINGS §A — S35…S40.
 */

const FN_BUDGET = 60;

interface FnRec {
  file: string;
  name: string;
  len: number;
}

describe('megaplan V19: single-responsibility decomposition', () => {
  const { functions } = collectSizes() as { functions: FnRec[] };

  const budgetFor = (file: string) =>
    functions.filter((f) => f.file === file && f.len > FN_BUDGET).map((f) => `${f.name} (${f.len})`);

  it('S35: processArenaEvent decomposed — no function exceeds budget — MEGAPLAN-S35', () => {
    expect(
      budgetFor('src/hooks/arenaAnimationUtils.ts'),
      'extract per-event-case pose handlers from processArenaEvent'
    ).toEqual([]);
  });

  it('S36: assessCrownOpportunity decomposed — no function exceeds budget — MEGAPLAN-S36', () => {
    expect(
      budgetFor('src/engine/ai/workers/crownWorker.ts'),
      'extract index-build + per-candidate scorer from assessCrownOpportunity'
    ).toEqual([]);
  });

  it('S37: projectEvent decomposed — no function exceeds budget — MEGAPLAN-S37', () => {
    expect(
      budgetFor('src/engine/simulate/logging.ts'),
      'extract per-event-kind projection handlers from projectEvent'
    ).toEqual([]);
  });

  it('S38: computeEffectiveSkills decomposed — no function exceeds budget — MEGAPLAN-S38', () => {
    expect(
      budgetFor('src/engine/bout/fighterState.ts'),
      'extract per-skill addend builder from computeEffectiveSkills'
    ).toEqual([]);
  });

  it('S39: createFighterState decomposed — no function exceeds budget — MEGAPLAN-S39', () => {
    expect(
      budgetFor('src/engine/bout/fighterState.ts'),
      'extract field-builder from createFighterState'
    ).toEqual([]);
  });

  it('S40: recordGrandChampions decomposed — no function exceeds budget — MEGAPLAN-S40', () => {
    expect(
      budgetFor('src/engine/championship/championsTournament.ts'),
      'extract award application from recordGrandChampions'
    ).toEqual([]);
  });
});
