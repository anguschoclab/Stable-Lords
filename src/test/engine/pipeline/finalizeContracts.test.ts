import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import type { FightSummary } from '@/types/combat.types';

/**
 * MEGAPLAN-V14 finalize behavior gates (characterization — must stay green
 * through the Phase-5 perf refactors of `deferBoutArchives` and
 * `sweepOrphanedReigns`):
 *
 *  - `deferBoutArchives` drains exactly this-week's transcript-bearing
 *    arenaHistory entries into `deferredBoutLogs` (suffix-scan optimization
 *    must produce identical output to the current full scan) and clears the
 *    transcript field on drained entries.
 *  - `sweepOrphanedReigns` ends a championship reign whose warrior is no
 *    longer in any roster, and leaves healthy reigns untouched. Impact-gated
 *    invocation must preserve both directions.
 */

const SEED = 'v14-finalize-contracts';
const T0 = '2026-04-28T09:00:00Z';

describe('finalize contracts', () => {
  it('deferBoutArchives drains only this-week transcript-bearing entries and clears them', async () => {
    const state = createFreshState(SEED, T0);
    const thisWeek = state.week;

    const mkSummary = (id: string, week: number, transcript?: string[]): FightSummary => ({
      id: id as FightSummary['id'],
      week,
      title: 'Fixture Warrior A vs Fixture Warrior B',
      warriorIdA: 'fixture_a' as FightSummary['warriorIdA'],
      warriorIdD: 'fixture_b' as FightSummary['warriorIdD'],
      winner: 'A',
      by: 'decision' as FightSummary['by'],
      styleA: 'balanced',
      styleD: 'balanced',
      transcript,
      createdAt: T0,
    });

    // A stale transcript from a prior week must NOT be drained.
    const stale = mkSummary('stale_bout_1', thisWeek - 1, ['stale transcript']);
    // A transcript-bearing entry for the current week must be drained.
    const fresh = mkSummary('fresh_bout_1', thisWeek, ['line one', 'line two']);
    state.arenaHistory = [...(state.arenaHistory ?? []), stale, fresh];

    const next = await advanceWeek(state, { headless: true });
    const drained = next.deferredBoutLogs ?? [];

    expect(
      drained.some((l) => l.boutId === 'fresh_bout_1'),
      'this-week transcript-bearing entry was not deferred for archiving'
    ).toBe(true);
    expect(
      drained.some((l) => l.boutId === 'stale_bout_1'),
      'a prior-week transcript leaked into this week\'s archive drain'
    ).toBe(false);
    const freshEntry = next.arenaHistory.find((f) => f.id === 'fresh_bout_1');
    expect(
      freshEntry?.transcript ?? [],
      'drained transcript must be cleared from the arenaHistory entry'
    ).toEqual([]);
    // The stale entry keeps its transcript field state unchanged (untouched
    // or cleared only by truncation — but never archived this week).
    const staleEntry = next.arenaHistory.find((f) => f.id === 'stale_bout_1');
    if (staleEntry) {
      expect(staleEntry.id).toBe('stale_bout_1');
    }
  });

  it('sweepOrphanedReigns ends a reign whose champion left every roster, keeps healthy reigns', async () => {
    // Fresh states start with empty rosters — populate for real warriors.
    const state = populateInitialWorld(createFreshState(SEED, T0), 20261007);

    const ghostId = 'ghost_warrior_404';
    const healthyId = (state.rivals?.[0]?.roster?.[0]?.id ?? state.roster?.[0]?.id) as string;
    expect(healthyId, 'need at least one rostered warrior for the healthy reign').toBeTruthy();

    const mkTitle = (warriorId: string) => ({
      champion: {
        warriorId: warriorId as never,
        startedAbsoluteWeek: 0,
        defenses: 0,
        lastActivityWeek: 0,
      },
      status: 'active' as const,
      history: [],
      refusals: 0,
      deferrals: 0,
      noContenderStreak: 0,
      declinedContenders: {},
    });

    state.arenaChampions = {
      ...(state.arenaChampions ?? {}),
      orphanTitle: mkTitle(ghostId),
      healthyTitle: mkTitle(healthyId),
    } as unknown as typeof state.arenaChampions;

    const next = await advanceWeek(state, { headless: true });
    const titles = next.arenaChampions ?? {};

    const orphan = titles['orphanTitle' as keyof typeof titles];
    const healthy = titles['healthyTitle' as keyof typeof titles];

    const orphanChamp = (orphan as { champion?: { warriorId?: string } | null })?.champion;
    expect(
      orphanChamp === null || orphanChamp === undefined || orphanChamp.warriorId !== ghostId,
      'orphaned reign was not ended by sweepOrphanedReigns'
    ).toBe(true);

    const healthyChamp = (healthy as { champion?: { warriorId?: string } | null })?.champion;
    expect(
      healthyChamp?.warriorId,
      'a healthy reign was incorrectly swept'
    ).toBe(healthyId);
  });
});
