// @vitest-environment node
/**
 * Championship lifecycle through the real weekly pipeline.
 *
 * Exercises advanceWeek end-to-end: a dormant title with a live contender
 * re-engages, drains the champion's signed ordinary offer, returns to
 * active, and books a defense — all within the booking-horizon bound
 * (max one signed batch beyond the pending tick + one tick to book).
 */
import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { drainDeferredBoutLogs } from '@/engine/storage/deferredBoutLogs';
import { makeComputedWarrior, makeBoutOffer } from '@/test/_fixtures/factories';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { GameState, Warrior } from '@/types/state.types';
import type { ArenaTitle } from '@/types/state.types';
import type { WarriorId, BoutOfferId } from '@/types/shared.types';
import { ARENA_TITLE, CHAMPIONS_TOURNEY } from '@/constants/arena';

const ARENA = 'standard_arena';

const computed = (id: string, name: string, over: Partial<Warrior> = {}): Warrior =>
  makeComputedWarrior(
    { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 },
    FightingStyle.StrikingAttack,
    { id: id as WarriorId, name, ...over }
  );

function dormantTitle(champId: string): ArenaTitle {
  return {
    champion: {
      warriorId: champId as WarriorId,
      startedAbsoluteWeek: 1,
      defenses: 1,
      lastActivityWeek: 1, // cadence long elapsed → defense books immediately once active
    },
    status: 'dormant',
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: ARENA_TITLE.DORMANCY_STREAK + 2,
    declinedContenders: {},
  };
}

describe('championship lifecycle through advanceWeek', () => {
  it('dormant → pending → active → defense booked within the horizon bound', async () => {
    let state = createFreshState('champ-lifecycle-seed');
    state.week = 15;
    state.year = 1;
    state.absoluteWeek = 15;

    const champ = computed('w-champ', 'The Champion');
    // Player-owned contender never gets signed into ordinary bouts (player
    // offers stay Proposed) → stays fight-ready, eligibility is deterministic.
    const cont = computed('w-cont', 'The Contender', {
      career: {
        wins: 4,
        losses: 1,
        kills: 0,
        byArena: { [ARENA]: { wins: 4, losses: 1, kills: 0 } },
      },
    });
    const opponent = computed('w-opp', 'Ordinary Opponent');
    state.roster = [champ, cont];
    state.rivals = [
      {
        ...(state.rivals?.[0] ?? {}),
        id: 'r1',
        owner: { id: 'r1', stableName: 'Rival Stab' },
        roster: [opponent],
      } as GameState['rivals'][number],
    ];
    state.arenaChampions = { [ARENA]: dormantTitle('w-champ') };

    // A signed ordinary offer for the dormant champion, booked for next week —
    // the drain the pending state must wait out before re-activating.
    const drain = makeBoutOffer({
      id: 'o-drain' as BoutOfferId,
      status: 'Signed',
      warriorIds: ['w-champ' as WarriorId, 'w-opp' as WarriorId],
      boutWeek: 16,
      expirationWeek: 16,
      createdAbsoluteWeek: 15,
      arenaId: ARENA,
    });
    state.boutOffers = { [drain.id]: drain };

    const seen: string[] = [];
    let booked = false;
    // Bound: pending (1) + drain resolve (1) + book (1) + slack — never the
    // exact-week assertion the review warned against.
    const BOUND = 6;
    for (let i = 0; i < BOUND && !booked; i++) {
      state = await advanceWeek(state);
      drainDeferredBoutLogs(state);
      const status = state.arenaChampions?.[ARENA]?.status;
      if (status) seen.push(status);
      booked = Object.values(state.boutOffers ?? {}).some(
        (o) => o.titleArenaId === ARENA && (o.status === 'Proposed' || o.status === 'Signed')
      );
    }

    expect(seen).toContain('pendingReengagement');
    expect(state.arenaChampions?.[ARENA]?.status).toBe('active');
    expect(booked).toBe(true);
    const titleOffer = Object.values(state.boutOffers ?? {}).find(
      (o) => o.titleArenaId === ARENA && (o.status === 'Proposed' || o.status === 'Signed')
    );
    expect(titleOffer?.warriorIds).toEqual(
      expect.arrayContaining(['w-champ', 'w-cont'])
    );
  });

  it('a booked defense offer resolves into a title bout result', async () => {
    let state = createFreshState('champ-defense-seed');
    state.week = 15;
    state.year = 1;
    state.absoluteWeek = 15;

    const champ = computed('w-champ', 'The Champion');
    const cont = computed('w-cont', 'The Contender', {
      career: {
        wins: 4,
        losses: 1,
        kills: 0,
        byArena: { [ARENA]: { wins: 4, losses: 1, kills: 0 } },
      },
    });
    state.roster = [];
    // Rival-owned champion + contender — the AI responds for both sides inside
    // the pipeline (a player champion would wait on UI input).
    state.rivals = [
      {
        ...(state.rivals?.[0] ?? {}),
        id: 'r1',
        owner: { id: 'r1', stableName: 'Rival Stab' },
        roster: [champ, cont],
      } as GameState['rivals'][number],
    ];
    state.arenaChampions = {
      [ARENA]: {
        champion: {
          warriorId: 'w-champ' as WarriorId,
          startedAbsoluteWeek: 1,
          defenses: 0,
          lastActivityWeek: 1, // long elapsed → books immediately
        },
        status: 'active',
        history: [],
        refusals: 0,
        deferrals: 0,
        noContenderStreak: 0,
        declinedContenders: {},
      },
    };

    let resolved = false;
    for (let i = 0; i < 8 && !resolved; i++) {
      state = await advanceWeek(state);
      drainDeferredBoutLogs(state);
      resolved = (state.arenaHistory ?? []).some((f) => f.titleArenaId === ARENA);
    }

    expect(resolved).toBe(true);
    const title = state.arenaChampions![ARENA]!;
    expect(
      title.champion!.defenses + title.history.length
    ).toBeGreaterThanOrEqual(1);
  });

  it('year boundary: the Grand Championship emits at 52, resolves, and records its winner', async () => {
    let state = createFreshState('grand-champ-seed');
    state.week = 51;
    state.year = 1;
    state.absoluteWeek = 51;

    const ids = ['gc1', 'gc2', 'gc3', 'gc4'];
    state.roster = ids.map((id, i) => computed(id, `Champ ${i}`));
    const arenas = ['standard_arena', 'mudpit_arena', 'narrow_bridge', 'brass_ring'];
    state.arenaChampions = {};
    arenas.forEach((a, i) => {
      state.arenaChampions![a] = {
        champion: {
          warriorId: ids[i] as WarriorId,
          startedAbsoluteWeek: 1,
          defenses: 0,
          lastActivityWeek: 50,
        },
        status: 'active',
        history: [],
        refusals: 0,
        deferrals: 0,
        noContenderStreak: 0,
        declinedContenders: {},
      };
    });

    // 51 → 52: the pass emits the champions-only bracket.
    state = await advanceWeek(state);
    drainDeferredBoutLogs(state);
    expect(state.week).toBe(52);
    const champsT = (state.tournaments ?? []).find(
      (t) => t.tierId === CHAMPIONS_TOURNEY.TIER_ID
    );
    expect(champsT).toBeDefined();
    expect(champsT!.name).toBe(CHAMPIONS_TOURNEY.NAME);
    expect(champsT!.participants.map((p) => p.id).sort()).toEqual([...ids].sort());

    // 52 → year 2 week 1: the boundary sweep resolves the bracket and the
    // championship pass records the winner with the year it was earned in.
    state = await advanceWeek(state);
    drainDeferredBoutLogs(state);
    expect(state.week).toBe(1);
    expect(state.year).toBe(2);
    const done = (state.tournaments ?? []).find((t) => t.id === champsT!.id);
    expect(done!.completed).toBe(true);
    expect(state.grandChampions ?? []).toHaveLength(1);
    const entry = state.grandChampions![0]!;
    expect(entry.year).toBe(1);
    expect(ids).toContain(entry.warriorId);
    expect(entry.tournamentId).toBe(champsT!.id);
  });
});

describe('calendar migration through advanceWeek', () => {
  it('resolves an in-flight legacy-cadence tournament and emits no week-13 seasonal', async () => {
    // A save made under the old calendar at week 12 with a tournament still
    // in progress: the unfinished-tournament sweep resolves it entry-driven,
    // and the old week-13 seasonal never fires — the accepted loss.
    let state = createFreshState('champ-migration-seed');
    state.week = 12;
    state.year = 1;
    state.absoluteWeek = 12;
    state.tournaments = [];
    state.rivals = [];

    const field = ['f1', 'f2', 'f3', 'f4'].map((id, i) =>
      computed(id, `Freelancer ${i}`)
    );
    const inFlight = TournamentSelectionService.buildTournament(
      'gold',
      'Legacy Bracket',
      field,
      13,
      state.season,
      new SeededRNGService(7),
      1
    );
    state.tournaments = [inFlight];

    state = await advanceWeek(state);
    drainDeferredBoutLogs(state);
    expect(state.week).toBe(13);

    const resolved = (state.tournaments ?? []).find((t) => t.id === inFlight.id);
    expect(resolved!.completed).toBe(true);
    expect(resolved!.champion).toBeTruthy();
    // The migration is additive only: no NEW seasonal was emitted for week 13
    // (the legacy cadence is gone) — the only entry is the resolved in-flight one.
    expect(state.tournaments).toHaveLength(1);
    expect(state.isTournamentWeek).not.toBe(true);
  });
});
