import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';

describe('rival trait AI (integration)', () => {
  it('over a season, rival rosters acquire traits and churn without crashing', () => {
    let state = populateInitialWorld(createFreshState('rival-ai'), 12345);
    const before = state.rivals
      .flatMap((r) => r.roster)
      .reduce((s, w) => s + (w.traits?.length ?? 0), 0);
    for (let i = 0; i < 26; i++) state = advanceWeek(state, { headless: true });
    const after = state.rivals
      .flatMap((r) => r.roster)
      .reduce((s, w) => s + (w.traits?.length ?? 0), 0);
    // Trait training over 26 weeks should have grown total trait count across rival rosters.
    expect(after).toBeGreaterThan(before);
    // No rival roster should be empty (churn cuts but recruitment refills).
    expect(state.rivals.every((r) => r.roster.length > 0)).toBe(true);

    // Soft cap: development must not drive the whole world to the trait cap.
    const allRivalWarriors = state.rivals.flatMap((r) => r.roster);
    const atOrAboveHardCap = allRivalWarriors.filter(
      (w) => (w.traits ?? []).length >= 3
    ).length;
    expect(atOrAboveHardCap / Math.max(1, allRivalWarriors.length)).toBeLessThan(0.25);
  });
});
