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
import { FightingStyle } from '@/types/shared.types';
import type { GameState, Warrior } from '@/types/state.types';
import type { ArenaTitle } from '@/types/state.types';
import type { WarriorId, BoutOfferId } from '@/types/shared.types';
import { ARENA_TITLE } from '@/constants/arena';

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
});
