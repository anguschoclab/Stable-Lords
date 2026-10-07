/**
 * Kill/death divergence regression — the reason this whole change exists.
 *
 * 300 seeded weeks, asserting every week:
 *   - no registered-dead warrior id appears in ANY live store
 *     (roster, rival rosters, freeAgents, recruitPool, legacyFounderQueue,
 *     and — the historical zombie habitat — tournaments[].participants);
 *   - the death-lifecycle invariants hold.
 * At the end: kill outcomes (resolution-time killEvents) must equal unique
 * deaths exactly. Pre-fix this run measured divergence +11 to +21 driven by
 * stale tournament participant snapshots being re-killed at week boundaries.
 *
 * Note: `arena-champions` violations are deliberately out of this test's
 * scope — a pre-existing single-crown bug reproduces at HEAD on this seed
 * (verified: wk218 warrior-cad1d1f31cc2 double-crowned) and belongs to the
 * title system, not the death lifecycle.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { runSimulation } from '#scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import { validateStateInvariants } from '@/engine/validate/stateInvariants';
import type { GameState } from '@/types/state.types';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

/** Every warrior-id-bearing store a corpse could leak into. */
function deadIdSightings(state: GameState): string[] {
  const deadIds = new Set<string>([
    ...(state.deadWarriorIds ?? []),
    ...(state.graveyard ?? []).map((w) => w.id as string),
  ]);
  if (deadIds.size === 0) return [];
  const out: string[] = [];
  for (const w of state.roster ?? []) {
    if (deadIds.has(w.id)) out.push(`roster:${w.id}`);
  }
  for (const r of state.rivals ?? []) {
    for (const w of r.roster ?? []) {
      if (deadIds.has(w.id)) out.push(`rival ${r.id}:${w.id}`);
    }
  }
  for (const w of state.freeAgents ?? []) {
    if (deadIds.has(w.id as string)) out.push(`freeAgents:${w.id}`);
  }
  for (const w of state.recruitPool ?? []) {
    if (deadIds.has(w.id as string)) out.push(`recruitPool:${w.id}`);
  }
  for (const w of state.legacyFounderQueue ?? []) {
    if (deadIds.has(w.id)) out.push(`legacyFounderQueue:${w.id}`);
  }
  for (const t of state.tournaments ?? []) {
    for (const p of t.participants ?? []) {
      // Stamped-dead snapshots are valid history; un-stamped stale ones are not.
      if (deadIds.has(p.id) && p.status !== 'Dead' && !p.isDead) {
        out.push(`tournament ${t.id} participant:${p.id}`);
      }
    }
  }
  return out;
}

describe('kill/death divergence regression (slow)', () => {
  beforeEach(() => {
    let idCounter = 0;
    setMockIdGenerator(() => `id_${++idCounter}`);
    engineEventBus.clear();
    NewsletterFeed.clear();
  });

  test('300 weeks: zero dead ids in live stores, kill outcomes == unique deaths', async () => {
    const sightings: string[] = [];
    const invariantViolations: string[] = [];

    const result = await runSimulation({
      weeks: 300,
      seed: 12345,
      logFrequency: 50,
      onWeek: (state, w) => {
        for (const s of deadIdSightings(state)) sightings.push(`wk${w} ${s}`);
        for (const v of validateStateInvariants(state)) {
          // Death-lifecycle checks only — `arena-champions` is a known
          // pre-existing title-system bug (see file header).
          if (v.id === 'arena-champions') continue;
          invariantViolations.push(`wk${w} ${v.id}: ${v.message}`);
        }
      },
    });

    expect(invariantViolations.slice(0, 20), invariantViolations.join('\n')).toEqual([]);
    expect(sightings.slice(0, 20), sightings.join('\n')).toEqual([]);

    const c = result.cumulative;
    const killOutcomes = c.weeklyKills + c.tournamentKills;
    expect(
      killOutcomes - c.deaths,
      `killDeathDivergence=${killOutcomes - c.deaths} (kills ${killOutcomes} vs deaths ${c.deaths})`
    ).toBe(0);
  }, 600000);
});
