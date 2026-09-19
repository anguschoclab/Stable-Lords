import { describe, it, expect } from 'vitest';
import { runNarrativePass } from '@/engine/pipeline/passes/NarrativePass';
import { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import { SeededRNG } from '@/utils/random';

function makeFight(over: Partial<FightSummary> = {}): FightSummary {
  return {
    id: 'bout_1' as FightSummary['id'],
    week: 5,
    absoluteWeek: 5,
    phase: 'resolution',
    title: 'Alpha vs Beta',
    warriorIdA: 'w_a' as FightSummary['warriorIdA'],
    warriorIdD: 'w_d' as FightSummary['warriorIdD'],
    winner: 'A',
    by: 'Kill',
    styleA: FightingStyle.StrikingAttack,
    styleD: FightingStyle.ParryRiposte,
    flashyTags: ['Kill', 'Dominance'],
    fameDeltaA: 3,
    popularityDeltaA: 2,
    transcript: [],
    createdAt: 'wk5',
    ...over,
  } as FightSummary;
}

function makeState(arenaHistory: FightSummary[]): GameState {
  return {
    meta: { gameName: '', version: '', createdAt: '' },
    week: 5,
    year: 1,
    absoluteWeek: 5,
    season: 'Spring',
    arenaHistory,
    graveyard: [],
    gazettes: [],
    newsletter: [],
    roster: [],
    rivals: [],
    crowdMood: 'Calm',
  } as unknown as GameState;
}

describe('runNarrativePass — weekly newsletter issue (D15 wiring)', () => {
  it('emits a Fight of the Week newsletter item generated from real fight data', () => {
    const state = makeState([makeFight()]);
    const impact = runNarrativePass(state, 5, 6, new SeededRNG(42) as never);

    const items = impact.newsletterItems ?? [];
    const issue = items.find((i) => i.title === 'Week in Review');
    expect(issue).toBeDefined();
    expect(issue!.items.some((l) => l.includes('FIGHT OF THE WEEK'))).toBe(true);
    expect(issue!.items.some((l) => l.includes('Alpha vs Beta'))).toBe(true);
  });

  it('emits no issue when the week had no fights', () => {
    const state = makeState([]);
    const impact = runNarrativePass(state, 5, 6, new SeededRNG(42) as never);

    const items = impact.newsletterItems ?? [];
    expect(items.find((i) => i.title === 'Week in Review')).toBeUndefined();
  });

  it('includes style rollup standings computed from the week fights', () => {
    const state = makeState([
      makeFight(),
      makeFight({ id: 'bout_2' as FightSummary['id'], winner: 'D', by: 'KO' }),
    ]);
    const impact = runNarrativePass(state, 5, 6, new SeededRNG(42) as never);

    const issue = (impact.newsletterItems ?? []).find((i) => i.title === 'Week in Review');
    expect(issue?.items.some((l) => l.includes('style table'))).toBe(true);
  });
});

describe('runNarrativePass — season retrospective (D12 wiring)', () => {
  it('appends a season-review gazette when nextWeek crosses a season boundary', () => {
    // absoluteWeek 13 ends Spring (seasons are 13 weeks); nextWeek 14 opens Summer.
    const state = makeState([makeFight({ absoluteWeek: 10 })]);
    state.absoluteWeek = 13;
    state.week = 13;
    state.season = 'Spring';

    const impact = runNarrativePass(state, 13, 14, new SeededRNG(42) as never);

    const review = (impact.gazettes ?? []).find((g) => g.tags?.includes('Season Review'));
    expect(review).toBeDefined();
    expect(review!.headline.length).toBeGreaterThan(0);
  });

  it('does not append a season-review gazette mid-season', () => {
    const state = makeState([makeFight({ absoluteWeek: 10 })]);
    state.absoluteWeek = 10;
    state.week = 10;

    const impact = runNarrativePass(state, 10, 11, new SeededRNG(42) as never);

    expect((impact.gazettes ?? []).some((g) => g.tags?.includes('Season Review'))).toBe(false);
  });
});
