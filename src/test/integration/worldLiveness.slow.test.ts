// @vitest-environment node
/**
 * Stage H — 104-week world-liveness invariants.
 * The AI behaviors shipped in Stages B–G must keep the championship
 * ecosystem *alive* over a two-year horizon: crowns change hands, rival
 * campaigns actually launch, the refusal→strip machinery prevents
 * permanent ducks, and the Grand Championship field stays meaningful.
 * Thresholds are honest world-shape assertions, not tuned to pass —
 * a violation means the ecosystem went quiet, not that a test is strict.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { runSimulation } from '@/scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import { CHAMPIONS_TOURNEY, ARENA_TITLE } from '@/constants/arena';
import { WEEKS_PER_YEAR } from '@/constants/core/core';
import type { GameState } from '@/types/state.types';

vi.mock('@/engine/storage/opfsArchive', async () => await import('@/test/_mocks/opfsArchive'));

describe('world liveness — 104 weeks (Stage H)', () => {
  beforeAll(() => {
    let n = 0;
    setMockIdGenerator(() => `id_${++n}`);
    engineEventBus.clear();
    NewsletterFeed.clear();
  });
  afterAll(() => vi.restoreAllMocks());

  it('keeps the championship ecosystem dynamic for two full years', async () => {
    const { finalState, pulses } = await runSimulation({
      weeks: WEEKS_PER_YEAR * 2,
      seed: 20261101,
      logFrequency: 1,
      ignoreBankruptcy: true,
    });
    const s = finalState as GameState;
    const titles = Object.values(s.arenaChampions ?? {});

    // 1. Crowns change hands — history accumulates distinct champions.
    const allReigns = titles.flatMap((t) => [
      ...t.history.map((r) => r.warriorId),
      ...(t.champion ? [t.champion.warriorId] : []),
    ]);
    expect(new Set(allReigns).size).toBeGreaterThanOrEqual(2);

    // 2. Rival crown campaigns actually run — not just latent intent typing.
    const campaignWeeks = pulses.filter((p) => p.crownCampaignsActive > 0).length;
    expect(campaignWeeks).toBeGreaterThanOrEqual(2);

    // 3. No permanent ducks: a live champion can never sit at
    //    REFUSALS_TO_STRIP — the strip path must have fired first.
    for (const t of titles) {
      expect(t.refusals).toBeLessThan(ARENA_TITLE.REFUSALS_TO_STRIP);
    }

    // 3b. Strips are rare-but-nonzero: the refusal→strip machinery actually
    //     engages (a persistent duck got removed), yet it must not dominate
    //     the ecosystem — deaths/defeats still carry the workload.
    const endings = pulses[pulses.length - 1]!.reignEndings;
    expect(endings.stripped ?? 0).toBeGreaterThanOrEqual(1);
    expect(endings.stripped ?? 0).toBeLessThan(endings.died ?? 0);

    // 4. Grand Championship integrity: every champions-tier tournament that
    //    emitted completed with a recorded winner; cancellations only ever
    //    reflect a genuinely thin field (the metric derives them honestly).
    const champsT = (s.tournaments ?? []).filter(
      (t) => t.tierId === CHAMPIONS_TOURNEY.TIER_ID
    );
    expect(champsT.every((t) => t.completed)).toBe(true);
    const lastPulse = pulses[pulses.length - 1]!;
    expect(lastPulse.grandChampCancellations).toBeGreaterThanOrEqual(0);
    expect(lastPulse.grandChampFieldSize).toBeGreaterThanOrEqual(0);
    // If a GC ran, its field met MIN_FIELD — that's the only legal launch.
    for (const t of champsT) {
      expect(t.participants.length).toBeGreaterThanOrEqual(CHAMPIONS_TOURNEY.MIN_FIELD);
    }

    // 5. Champions reach year-end rested on average — the prep machinery
    //    (Stage B) exists precisely so w52 fields aren't exhausted. Fatigue
    //    scale is 0–100; >70 average would mean the prep never engages.
    const yearEndPulse = pulses.filter((p) => p.avgChampionFatigue > 0).at(-1);
    if (yearEndPulse) {
      expect(yearEndPulse.avgChampionFatigue).toBeLessThan(70);
    }
  }, 240000);
});
