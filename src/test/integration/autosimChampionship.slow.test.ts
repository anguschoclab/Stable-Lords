// @vitest-environment node
/**
 * Long-horizon championship autosim — the only full-fidelity verification that
 * arena crowns emerge, title bouts actually resolve, refusals are counted, and
 * the Grand Championship completes by the end of year two. The aggregate dump
 * stays because a regression here is only debuggable through these numbers.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { stubLocalStorage } from '@/test/_setup/stubLocalStorage';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { runAutosim } from '@/engine/autosim/autosim';
import { makeAutosimWarrior } from '@/test/_setup/testHelpers';
import { CHAMPIONS_TOURNEY } from '@/constants/arena';
import { CHAMPIONSHIP_DEBUG } from '@/engine/championship/arenaChampionship';
import type { GameState } from '@/types/game';

describe('championship autosim — week 52+', () => {
  let errorSpy: any;
  beforeAll(() => {
    stubLocalStorage();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    errorSpy?.mockRestore();
  });

  it('simulates a full year and reports championship aggregates', async () => {
    const state: GameState = createFreshState('autosim-champ-seed');
    state.treasury = 1_000_000; // sim horizon is 60 weeks; the player economy isn't the subject
    state.roster = Array.from({ length: 6 }, (_, i) =>
      makeAutosimWarrior(`pw${i}`, `Player Warrior ${i}`, { fame: 10, popularity: 5 })
    );

    const result = await runAutosim(state, { weeksToSim: 120, councilAutoPilot: true });
    const s = result.finalState;

    const titles = s.arenaChampions ?? {};
    const crowned = Object.values(titles).filter((t) => t.champion);
    const statusCounts = Object.values(titles).reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const titleBouts = (s.arenaHistory ?? []).filter((f) => f.titleArenaId);
    const defensesBooked = Object.values(titles).reduce((n, t) => n + (t.champion?.defenses ?? 0), 0);
    const historyReigns = Object.values(titles).reduce((n, t) => n + t.history.length, 0);
    const titleOffers = Object.values(s.boutOffers ?? {}).filter((o) => o.titleArenaId);
    const titleOfferStatus = titleOffers.reduce((acc: Record<string, number>, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
    const endReasons = Object.values(titles).reduce((acc: Record<string, number>, t) => {
      for (const r of t.history) acc[r.endReason ?? 'unknown'] = (acc[r.endReason ?? 'unknown'] ?? 0) + 1;
      return acc;
    }, {});
    const champsT = (s.tournaments ?? []).filter((t) => t.tierId === CHAMPIONS_TOURNEY.TIER_ID);
    const gc = s.grandChampions ?? [];
    // Diagnostics: how many warriors qualify as contenders (≥3 bouts at one arena)?
    const allWarriors = [
      ...s.roster,
      ...Object.values(s.rivals ?? {}).flatMap((r: any) => r.roster ?? []),
      ...(s.graveyard ?? []),
    ];
    const arenaBoutCounts = new Map<string, number>(); // arenaId → warriors with ≥3 bouts
    let warriorsWithAnyRecord = 0;
    let maxBoutsAtOneArena = 0;
    const boutCountHistogram: Record<number, number> = {};
    for (const w of allWarriors) {
      const recs = w.career?.byArena ?? {};
      if (Object.keys(recs).length > 0) warriorsWithAnyRecord++;
      const careerTotal = (w.career?.wins ?? 0) + (w.career?.losses ?? 0);
      boutCountHistogram[careerTotal] = (boutCountHistogram[careerTotal] ?? 0) + 1;
      for (const [arenaId, rec] of Object.entries(recs)) {
        const n = (rec as any).wins + (rec as any).losses;
        maxBoutsAtOneArena = Math.max(maxBoutsAtOneArena, n);
        if (n >= 3) arenaBoutCounts.set(arenaId, (arenaBoutCounts.get(arenaId) ?? 0) + 1);
      }
    }

    console.log(
      JSON.stringify(
        {
          weeksSimmed: result.weeksSimmed,
          stopReason: result.stopReason,
          titlesSeen: Object.keys(titles).length,
          crownedArenas: crowned.length,
          statusCounts,
          titleBoutsResolved: titleBouts.length,
          titleOffersInState: titleOffers.length,
          titleOfferStatus,
          defensesBooked,
          pastReigns: historyReigns,
          endReasons,
          championsTournaments: champsT.map((t) => ({
            id: t.id,
            week: t.week,
            completed: t.completed,
            champion: t.champion,
            participants: t.participants.length,
          })),
          grandChampions: gc,
          treasury: s.treasury,
          totalWarriors: allWarriors.length,
          graveyardSize: (s.graveyard ?? []).length,
          houseRules: s.houseRules,
          killsInHistory: (s.arenaHistory ?? []).filter((f) => f.by === 'Kill' || f.isDeathEvent)
            .length,
          warriorsWithAnyRecord,
          maxBoutsAtOneArena,
          arenasWithEligibleContenders: arenaBoutCounts.size,
          totalBoutsRecorded: Object.values(s.arenaHistory ?? {}).length ||
            (s.arenaHistory ?? []).length,
          arenaHistoryLen: (s.arenaHistory ?? []).length,
          sampleRecords: allWarriors
            .filter((w) => Object.keys(w.career?.byArena ?? {}).length > 0)
            .slice(0, 5)
            .map((w) => ({ name: w.name, byArena: w.career.byArena, wins: w.career?.wins })),
          sampleArenaIds: (s.arenaHistory ?? []).slice(0, 5).map((f) => f.arenaId),
          careerBoutsHistogram: boutCountHistogram,
          championshipDebug: CHAMPIONSHIP_DEBUG,
          boutsByArenaTop: Object.entries(
            (s.arenaHistory ?? []).reduce((acc: Record<string, number>, f) => {
              acc[f.arenaId ?? 'none'] = (acc[f.arenaId ?? 'none'] ?? 0) + 1;
              return acc;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10),
          busiestWarrior: allWarriors
            .map((w) => ({
              name: w.name,
              total: (w.career?.wins ?? 0) + (w.career?.losses ?? 0),
              byArena: w.career?.byArena,
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3),
        },
        null,
        2
      )
    );

    // Contenders emerge and crowns are seeded.
    expect(crowned.length).toBeGreaterThan(0);
    // Contender emergence: at least one arena produced a warrior with enough
    //    venue experience to qualify for the contender ladder.
    expect(arenaBoutCounts.size).toBeGreaterThan(0);
    // The title-bout lifecycle completes: offers get signed and resolve into
    // recorded title results (the offer-window regression this test guards).
    expect(CHAMPIONSHIP_DEBUG.signedSeen).toBeGreaterThan(0);
    expect(titleBouts.length).toBeGreaterThan(0);
    // Resolved title bouts have consequences — dethronements actually happen
    //    and reign history accumulates.
    expect(endReasons['defeated'] ?? 0).toBeGreaterThan(0);
    expect(historyReigns).toBeGreaterThan(0);
    // Rival title participation: signed/resolved title offers involve rival
    //    warriors, not just player-side bookings.
    const rivalWarriorIds = new Set(
      Object.values(s.rivals ?? {}).flatMap((r: any) =>
        (r.roster ?? []).map((w: any) => w.id)
      )
    );
    const rivalTitleOffers = titleOffers.filter((o) =>
      o.warriorIds.some((id) => rivalWarriorIds.has(id))
    );
    expect(rivalTitleOffers.length).toBeGreaterThan(0);
    // Seasonal tournaments run and complete across the two-plus-year horizon;
    //    an emitted seasonal bracket that never resolved would be a lifecycle bug.
    const seasonals = (s.tournaments ?? []).filter(
      (t) => t.tierId !== CHAMPIONS_TOURNEY.TIER_ID
    );
    expect(seasonals.length).toBeGreaterThan(0);
    expect(seasonals.every((t) => t.completed)).toBe(true);
    // The Grand Championship emits at week 52, completes, and records a winner.
    expect(champsT.length).toBeGreaterThan(0);
    expect(champsT.every((t) => t.completed)).toBe(true);
    expect(gc.length).toBeGreaterThan(0);
  }, 120000);
});
