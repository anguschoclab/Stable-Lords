/**
 * Dead-warrior lifecycle — integration tests over advanceWeek.
 *
 * Covers the kill/death divergence end-to-end:
 *  - a warrior killed while listed as a tournament participant must be
 *    forfeited, not re-fought, when the week-boundary sweep resolves the
 *    bracket (the cross-week re-kill vector);
 *  - a killed player warrior leaves state.roster the same tick and their
 *    pending signed offers are canceled — no bookable corpses;
 *  - a dead finals participant can never be crowned champion.
 */
import { describe, it, expect, vi } from 'vitest';
import type { GameState, Warrior, TournamentEntry } from '@/types/state.types';
import type { BoutOffer, Promoter } from '@/types/state.types';
import { FightingStyle, type WarriorId, type StableId } from '@/types/shared.types';
import type { BoutOfferId, PromoterId } from '@/types/shared.types';

// Force deterministic outcomes — the assertions are about lifecycle
// bookkeeping, not combat tuning.
vi.mock('@/engine/simulate', () => ({
  simulateFight: vi.fn(() => ({
    winner: 'A',
    by: 'Kill',
    minutes: 3,
    log: [],
    exchangeLog: [],
    post: { tags: [], hitsA: 10, hitsD: 2 },
  })),
  defaultPlanForWarrior: vi.fn((w: Warrior) => ({
    killDesire: 5,
    weapon: 'Broadsword',
    planStyle: w.style,
  })),
}));

import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import {
  makeTournamentBaseState,
  makeTournamentWarrior,
  makeTournamentRival,
} from '@/test/_fixtures/tournamentState';

const PLAYER = 'stable-player' as StableId;
const RIVAL = 'stable-rival-1' as StableId;

function unfinishedTournament(
  id: string,
  participants: Warrior[],
  bouts: { a: Warrior; d: Warrior | 'bye' }[]
): TournamentEntry {
  return {
    id: id as never,
    season: 'Spring',
    week: 1,
    tierId: 'Gold',
    name: `${id} Cup`,
    bracket: bouts.map((b, i) => ({
      round: 1,
      matchIndex: i,
      warriorIdA: b.a.id,
      warriorIdD: b.d === 'bye' ? ('bye' as unknown as WarriorId) : b.d.id,
      stableIdA: b.a.stableId,
      stableIdD: b.d === 'bye' ? undefined : b.d.stableId,
    })),
    participants,
    completed: false,
  };
}

describe('advanceWeek — dead tournament participants', () => {
  it('forfeits a participant who died last week — no re-kill, no second graveyard entry', async () => {
    const wLive = makeTournamentWarrior('live-1', 'Live One', FightingStyle.StrikingAttack, RIVAL);
    // The corpse's participant snapshot still claims Active — as they all do.
    const wCorpse = makeTournamentWarrior('dead-1', 'Corpse', FightingStyle.StrikingAttack, RIVAL);

    const state: GameState = makeTournamentBaseState(1);
    state.roster = [makeTournamentWarrior('p1', 'Player One', FightingStyle.StrikingAttack, PLAYER)];
    state.rivals = [makeTournamentRival([wLive])];
    state.graveyard = [{ ...wCorpse, status: 'Dead', isDead: true } as Warrior];
    state.deadWarriorIds = [wCorpse.id];
    state.tournaments = [unfinishedTournament('t-sweep', [wLive, wCorpse], [{ a: wLive, d: wCorpse }])];

    const next = await advanceWeek(state, { headless: true });

    const tour = next.tournaments.find((t) => t.id === 't-sweep');
    expect(tour?.completed).toBe(true);
    expect(tour?.bracket[0]?.winner).toBe('A'); // live side by forfeit

    // One death on record — the original — not a fresh re-kill.
    expect(next.graveyard.filter((w) => w.id === 'dead-1')).toHaveLength(1);
    expect(next.killEvents.filter((e) => e.victimId === 'dead-1')).toHaveLength(0);
    expect(next.arenaHistory.filter((b) => b.by === 'Kill' && b.tournamentId === 't-sweep')).toHaveLength(0);
  });

  it('cannot crown a dead finals participant', async () => {
    const wLive = makeTournamentWarrior('live-f', 'Finalist', FightingStyle.StrikingAttack, RIVAL);
    const wCorpse = makeTournamentWarrior('dead-f', 'Dead Finalist', FightingStyle.StrikingAttack, RIVAL);

    const state: GameState = makeTournamentBaseState(1);
    state.roster = [makeTournamentWarrior('p1', 'Player One', FightingStyle.StrikingAttack, PLAYER)];
    state.rivals = [makeTournamentRival([wLive])];
    state.graveyard = [{ ...wCorpse, status: 'Dead', isDead: true } as Warrior];
    state.deadWarriorIds = [wCorpse.id];
    // Finals bout between the live warrior and the corpse.
    state.tournaments = [
      unfinishedTournament('t-final', [wLive, wCorpse], [{ a: wCorpse, d: wLive }]),
    ];

    const next = await advanceWeek(state, { headless: true });

    const tour = next.tournaments.find((t) => t.id === 't-final');
    expect(tour?.completed).toBe(true);
    expect(tour?.champion).not.toBe('Dead Finalist');
  });
});

describe('advanceWeek — player victim cleanup', () => {
  it('removes a killed player warrior from roster + caches and closes the bout contract', async () => {
    const wVictim = makeTournamentWarrior('pv-1', 'Doomed', FightingStyle.StrikingAttack, PLAYER);
    const wSpare = makeTournamentWarrior('pv-2', 'Spare', FightingStyle.StrikingAttack, PLAYER);
    const wKiller = makeTournamentWarrior('rk-1', 'Killer', FightingStyle.StrikingAttack, RIVAL);
    const wRival2 = makeTournamentWarrior('rk-2', 'Rival Two', FightingStyle.StrikingAttack, RIVAL);

    const promoter: Promoter = {
      id: 'promoter-1' as PromoterId,
      name: 'P',
      age: 40,
      personality: 'Honorable',
      tier: 'Local',
      capacity: 5,
      biases: [],
      history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
    };
    const offer: BoutOffer = {
      id: 'offer-kill' as BoutOfferId,
      promoterId: promoter.id,
      warriorIds: [wKiller.id, wVictim.id],
      boutWeek: 1,
      expirationWeek: 2,
      purse: 500,
      hype: 100,
      status: 'Signed',
      responses: { [wKiller.id]: 'Accepted', [wVictim.id]: 'Accepted' },
    } as BoutOffer;

    const state: GameState = makeTournamentBaseState(1);
    state.roster = [wVictim, wSpare];
    state.rivals = [makeTournamentRival([wKiller, wRival2])];
    state.boutOffers = { [offer.id]: offer };
    state.promoters = { [promoter.id]: promoter };
    state.deadWarriorIds = [];
    state.killEvents = [];

    const next = await advanceWeek(state, { headless: true });

    // Off the roster — not just marked Dead. The graveyard + registry carry them.
    expect(next.roster.some((w) => w.id === 'pv-1')).toBe(false);
    expect(next.graveyard.some((w) => w.id === 'pv-1')).toBe(true);
    expect(next.deadWarriorIds).toContain('pv-1');
    expect(next.killEvents.some((e) => e.victimId === 'pv-1')).toBe(true);
    // Week caches rebuilt post-bout — the corpse is not bookable.
    expect(next.warriorMap?.has('pv-1' as WarriorId) ?? false).toBe(false);
    // Contract closed — not left Signed.
    expect(next.boutOffers['offer-kill' as BoutOfferId]).toBeUndefined();
    // The survivor is untouched.
    expect(next.roster.some((w) => w.id === 'pv-2')).toBe(true);
  });
});
