// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import {
  makeWarrior,
  makeGameState,
  makeBoutOffer,
  makeFightSummary,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import { makeVenueWarrior, makeArenaTitle, makeCareerRecord } from '@/test/_fixtures/arenaTitle';
import {
  isReigningChampion,
  isActiveChampion,
  isChampionBookingLocked,
  getCurrentArenaTitles,
  seedChampions,
  selectTitleContender,
  enforceVacancies,
  resolveTitleBoutResults,
  sweepTitleRefusals,
  applyLifecycleTransitions,
  scheduleTitleBouts,
  applyChampionPerks,
  relinquishCrown,
  createChampionshipDelta,
  type ChampionshipDelta,
} from '@/engine/championship/arenaChampionship';
import { ARENA_TITLE, ARENA_COMMISSION_ID } from '@/constants/arena';
import { STABLE_DISSOLVED_REASON } from '@/engine/bout/mutations/contractMutations';
import { EPITHET_TABLES } from '@/data/names/epithets';
import type { ArenaTitle, BoutOffer, GameState } from '@/types/state.types';
import type { Warrior, CareerRecord } from '@/types/warrior.types';
import type { WarriorId, BoutOfferId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

// Deterministic rng for tests — uuid counter + fixed picks.
let uuidN = 0;
const rng = {
  uuid: (prefix = 'id') => `${prefix}-test-${++uuidN}`,
} as unknown as IRNGService;

function career(over: Partial<CareerRecord> = {}): CareerRecord {
  return makeCareerRecord(over);
}

function warriorAtArena(
  id: string,
  arenaId: string,
  rec: { wins: number; losses: number; kills?: number }
) {
  return makeVenueWarrior(id, {
    wins: rec.wins,
    losses: rec.losses,
    kills: rec.kills ?? 0,
    arenaId,
  });
}

function makeTitleAt(
  _arenaId: string,
  championId: string | null,
  over: Partial<ArenaTitle> = {}
): ArenaTitle {
  return makeArenaTitle(championId, over);
}

function titleOffer(
  champId: string,
  challengerId: string,
  arenaId: string,
  over: Partial<BoutOffer> = {}
): BoutOffer {
  return makeBoutOffer({
    warriorIds: [champId as WarriorId, challengerId as WarriorId],
    promoterId: ARENA_COMMISSION_ID as BoutOffer['promoterId'],
    titleArenaId: arenaId,
    status: 'Proposed',
    responses: { [champId]: 'Pending', [challengerId]: 'Pending' } as BoutOffer['responses'],
    ...over,
  });
}

/** Merge a delta's title overlay into a plain lookup for assertions. */
function effTitle(
  state: GameState,
  delta: ChampionshipDelta,
  arenaId: string
): ArenaTitle | undefined {
  return delta.arenaChampions[arenaId] ?? state.arenaChampions?.[arenaId];
}

beforeEach(() => {
  resetFixtureIds();
  uuidN = 0;
});

// ─── Queries ────────────────────────────────────────────────────────────────

describe('champion status queries', () => {
  it('isReigningChampion matches any status; isActiveChampion only active', () => {
    const state = makeGameState({
      arenaChampions: {
        arena_a: makeTitleAt('arena_a', 'w1', { status: 'dormant' }),
        arena_b: makeTitleAt('arena_b', 'w2', { status: 'active' }),
      },
    });
    expect(isReigningChampion(state, 'w1' as WarriorId)).toBe(true);
    expect(isActiveChampion(state, 'w1' as WarriorId)).toBe(false);
    expect(isActiveChampion(state, 'w2' as WarriorId)).toBe(true);
    expect(isReigningChampion(state, 'w3' as WarriorId)).toBe(false);
  });

  it('isChampionBookingLocked is true unless the title is dormant', () => {
    const state = makeGameState({
      arenaChampions: {
        arena_a: makeTitleAt('arena_a', 'w1', { status: 'dormant' }),
        arena_b: makeTitleAt('arena_b', 'w2', { status: 'pendingReengagement' }),
        arena_c: makeTitleAt('arena_c', 'w3', { status: 'active' }),
      },
    });
    expect(isChampionBookingLocked(state, 'w1' as WarriorId)).toBe(false);
    expect(isChampionBookingLocked(state, 'w2' as WarriorId)).toBe(true);
    expect(isChampionBookingLocked(state, 'w3' as WarriorId)).toBe(true);
    expect(isChampionBookingLocked(state, 'w4' as WarriorId)).toBe(false);
  });

  it('getCurrentArenaTitles derives champion labels per warrior', () => {
    const state = makeGameState({
      arenaChampions: {
        arena_a: makeTitleAt('arena_a', 'w1'),
        arena_b: makeTitleAt('arena_b', 'w2'),
      },
    });
    expect(getCurrentArenaTitles(state, 'w1' as WarriorId)).toEqual(['arena_a']);
    expect(getCurrentArenaTitles(state, 'w9' as WarriorId)).toEqual([]);
  });
});

// ─── Seeding ────────────────────────────────────────────────────────────────

describe('seedChampions', () => {
  it('crowns the warrior with the best venue record meeting MIN_BOUTS', () => {
    const arenaId = 'standard_arena';
    const wTop = warriorAtArena('w-top', arenaId, { wins: 5, losses: 1 });
    const wMid = warriorAtArena('w-mid', arenaId, { wins: 4, losses: 2 });
    const state = makeGameState({ roster: [wTop, wMid] });
    const delta = createChampionshipDelta();
    seedChampions(state, delta);
    const title = delta.arenaChampions[arenaId]!;
    expect(title).toBeDefined();
    expect(title.champion?.warriorId).toBe('w-top');
    expect(title.status).toBe('active');
  });

  it('skips warriors under the MIN_BOUTS threshold', () => {
    const arenaId = 'underpit_arena';
    const wThin = warriorAtArena('w-thin', arenaId, { wins: 2, losses: 0 });
    const state = makeGameState({ roster: [wThin] });
    const delta = createChampionshipDelta();
    seedChampions(state, delta);
    expect(delta.arenaChampions[arenaId]?.champion ?? null).toBeNull();
  });

  it('gives a contested warrior the crown at the largest-margin venue (single crown)', () => {
    const a = 'standard_arena';
    const b = 'underpit_arena';
    // w-ace leads at both; margin bigger at b.
    const wAce = makeWarrior({
      id: 'w-ace' as WarriorId,
      career: career({
        byArena: {
          [a]: { wins: 4, losses: 0, kills: 0 },
          [b]: { wins: 9, losses: 0, kills: 0 },
        },
      }),
    });
    const wB = warriorAtArena('w-b', a, { wins: 3, losses: 1 });
    const wC = warriorAtArena('w-c', b, { wins: 3, losses: 1 });
    const state = makeGameState({ roster: [wAce, wB, wC] });
    const delta = createChampionshipDelta();
    seedChampions(state, delta);

    // w-ace holds exactly one crown — the higher-margin venue.
    const crowns = Object.values(delta.arenaChampions).filter(
      (t) => t.champion?.warriorId === ('w-ace' as WarriorId)
    );
    expect(crowns).toHaveLength(1);
    expect(crowns[0]!.champion).toBeDefined();
    // The other arena crowns its next-best eligible warrior.
    const otherArena = crowns[0] === delta.arenaChampions[a] ? b : a;
    const other = delta.arenaChampions[otherArena];
    expect(other?.champion?.warriorId).not.toBe('w-ace');
    expect(other?.champion?.warriorId).toBeDefined();
  });

  it('is idempotent — does not overwrite existing reigns', () => {
    const arenaId = 'standard_arena';
    const existing = makeTitleAt(arenaId, 'w-reigning');
    const wTop = warriorAtArena('w-top', arenaId, { wins: 9, losses: 0 });
    const state = makeGameState({ roster: [wTop], arenaChampions: { [arenaId]: existing } });
    const delta = createChampionshipDelta();
    seedChampions(state, delta);
    expect(effTitle(state, delta, arenaId)?.champion?.warriorId).toBe('w-reigning');
  });

  it('does not crown a champion for the reserved tournament venue', () => {
    const w = warriorAtArena('w1', 'bloodsands_arena', { wins: 10, losses: 0 });
    const state = makeGameState({ roster: [w] });
    const delta = createChampionshipDelta();
    seedChampions(state, delta);
    expect(delta.arenaChampions['bloodsands_arena']?.champion ?? null).toBeNull();
  });
});

// ─── Contender selection ────────────────────────────────────────────────────

describe('selectTitleContender', () => {
  const arenaId = 'standard_arena';

  it('ranks contenders by wins, then win rate, then kills', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const wMoreWins = warriorAtArena('w-a', arenaId, { wins: 6, losses: 3 });
    const wFewerWins = warriorAtArena('w-b', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      roster: [champ, wMoreWins, wFewerWins],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
    });
    expect(selectTitleContender(state, arenaId)?.id).toBe('w-a');
  });

  it('excludes reigning champions at other arenas (single crown)', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const otherChamp = makeWarrior({
      id: 'w-other-champ' as WarriorId,
      career: career({ byArena: { [arenaId]: { wins: 9, losses: 0, kills: 0 } } }),
    });
    const state = makeGameState({
      roster: [champ, otherChamp],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ'),
        other_arena: makeTitleAt('other_arena', 'w-other-champ'),
      },
    });
    expect(selectTitleContender(state, arenaId)).toBeNull();
  });

  it('excludes warriors in a contender cooldown window', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const wCool = warriorAtArena('w-cool', arenaId, { wins: 5, losses: 0 });
    const wOk = warriorAtArena('w-ok', arenaId, { wins: 4, losses: 1 });
    const state = makeGameState({
      week: 10,
      absoluteWeek: 10,
      roster: [champ, wCool, wOk],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', {
          declinedContenders: { 'w-cool': 20 }, // cooldown until abs week 20
        }),
      },
    });
    expect(selectTitleContender(state, arenaId)?.id).toBe('w-ok');
  });

  it('excludes dead warriors and warriors below MIN_BOUTS', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const wDead = warriorAtArena('w-dead', arenaId, { wins: 9, losses: 0 });
    wDead.status = 'Dead';
    const wThin = warriorAtArena('w-thin', arenaId, { wins: 1, losses: 0 });
    const state = makeGameState({
      roster: [champ, wDead, wThin],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
    });
    expect(selectTitleContender(state, arenaId)).toBeNull();
  });
});

// ─── Vacancies ──────────────────────────────────────────────────────────────

describe('enforceVacancies', () => {
  const arenaId = 'standard_arena';

  it('ends the reign when the champion is in the graveyard', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    champ.status = 'Dead';
    const state = makeGameState({
      graveyard: [champ],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
    });
    const delta = createChampionshipDelta();
    enforceVacancies(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.champion).toBeNull();
    expect(title.history).toHaveLength(1);
    expect(title.history[0]!.endReason).toBe('died');
    expect(title.history[0]!.warriorId).toBe('w-champ');
  });

  it('ends the reign when the champion retires', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    champ.status = 'Retired';
    const state = makeGameState({
      retired: [champ],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
    });
    const delta = createChampionshipDelta();
    enforceVacancies(state, delta);
    expect(effTitle(state, delta, arenaId)!.champion).toBeNull();
    expect(effTitle(state, delta, arenaId)!.history[0]!.endReason).toBe('retired');
  });

  it('ends the reign as displaced (not retired) when the champion vanished with a folded stable', () => {
    // The champion is nowhere: not on any roster, not retired, not dead.
    // Their stable folded and they left as a free agent — 'retired' would be
    // a lie about why the crown opened.
    const state = makeGameState({
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-gone') },
    });
    const delta = createChampionshipDelta();
    enforceVacancies(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.champion).toBeNull();
    expect(title.history[0]!.endReason).toBe('displaced');
  });
});

// ─── Result resolution ──────────────────────────────────────────────────────

describe('resolveTitleBoutResults', () => {
  const arenaId = 'standard_arena';

  it('champion win increments defenses and refreshes activity', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 50,
      week: 50,
      roster: [champ, cont],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', {
          champion: {
            warriorId: 'w-champ' as WarriorId,
            startedAbsoluteWeek: 20,
            defenses: 1,
            lastActivityWeek: 46,
          },
        }),
      },
      arenaHistory: [
        makeFightSummary({
          titleArenaId: arenaId,
          warriorIdA: 'w-champ' as WarriorId,
          warriorIdD: 'w-cont' as WarriorId,
          winner: 'A',
          absoluteWeek: 50,
        }),
      ],
    });
    const delta = createChampionshipDelta();
    resolveTitleBoutResults(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.champion?.warriorId).toBe('w-champ');
    expect(title.champion?.defenses).toBe(2);
    expect(title.champion?.lastActivityWeek).toBe(50);
  });

  it('a won defense decays refusals by one rather than resetting them', () => {
    // refusals accrue only while the champion keeps ducking — each completed
    // defense erodes one refusal instead of wiping the slate clean.
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 50,
      week: 50,
      roster: [champ, cont],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', { refusals: 2 }),
      },
      arenaHistory: [
        makeFightSummary({
          titleArenaId: arenaId,
          warriorIdA: 'w-champ' as WarriorId,
          warriorIdD: 'w-cont' as WarriorId,
          winner: 'A',
          absoluteWeek: 50,
        }),
      ],
    });
    const delta = createChampionshipDelta();
    resolveTitleBoutResults(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.refusals).toBe(1);
    expect(title.champion?.warriorId).toBe('w-champ');
  });

  it('a won defense never pushes refusals below zero', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 50,
      week: 50,
      roster: [champ, cont],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ', { refusals: 0 }) },
      arenaHistory: [
        makeFightSummary({
          titleArenaId: arenaId,
          warriorIdA: 'w-champ' as WarriorId,
          warriorIdD: 'w-cont' as WarriorId,
          winner: 'A',
          absoluteWeek: 50,
        }),
      ],
    });
    const delta = createChampionshipDelta();
    resolveTitleBoutResults(state, delta);
    expect(effTitle(state, delta, arenaId)!.refusals).toBe(0);
  });

  it('challenger win ends the reign and crowns the challenger', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 50,
      week: 50,
      roster: [champ, cont],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
      arenaHistory: [
        makeFightSummary({
          titleArenaId: arenaId,
          warriorIdA: 'w-champ' as WarriorId,
          warriorIdD: 'w-cont' as WarriorId,
          winner: 'D',
          absoluteWeek: 50,
        }),
      ],
    });
    const delta = createChampionshipDelta();
    resolveTitleBoutResults(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.champion?.warriorId).toBe('w-cont');
    expect(title.history).toHaveLength(1);
    expect(title.history[0]!.endReason).toBe('defeated');
    expect(title.history[0]!.warriorId).toBe('w-champ');
  });

  it('crowns a winner on a vacant title bout', () => {
    const a = warriorAtArena('w-a', arenaId, { wins: 5, losses: 0 });
    const b = warriorAtArena('w-b', arenaId, { wins: 4, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 50,
      roster: [a, b],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, null) },
      arenaHistory: [
        makeFightSummary({
          titleArenaId: arenaId,
          warriorIdA: 'w-a' as WarriorId,
          warriorIdD: 'w-b' as WarriorId,
          winner: 'A',
          absoluteWeek: 50,
        }),
      ],
    });
    const delta = createChampionshipDelta();
    resolveTitleBoutResults(state, delta);
    expect(effTitle(state, delta, arenaId)!.champion?.warriorId).toBe('w-a');
  });

  it('champion death in a title bout vacates the crown for the killer', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0, kills: 1 });
    const state = makeGameState({
      absoluteWeek: 50,
      roster: [cont],
      graveyard: [champ],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
      arenaHistory: [
        makeFightSummary({
          titleArenaId: arenaId,
          warriorIdA: 'w-champ' as WarriorId,
          warriorIdD: 'w-cont' as WarriorId,
          winner: 'D',
          by: 'Kill',
          isDeathEvent: true,
          absoluteWeek: 50,
        }),
      ],
    });
    const delta = createChampionshipDelta();
    resolveTitleBoutResults(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.champion?.warriorId).toBe('w-cont');
    expect(title.history[0]!.endReason).toBe('died');
  });
});

// ─── Lifecycle transitions ──────────────────────────────────────────────────

describe('applyLifecycleTransitions', () => {
  const arenaId = 'standard_arena';

  it('drops an active title to dormant after DORMANCY_STREAK no-contender weeks', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 20,
      roster: [champ],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', {
          noContenderStreak: ARENA_TITLE.DORMANCY_STREAK - 1,
        }),
      },
    });
    const delta = createChampionshipDelta();
    applyLifecycleTransitions(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.status).toBe('dormant');
    expect(title.noContenderStreak).toBe(ARENA_TITLE.DORMANCY_STREAK);
  });

  it('resets the streak while a contender exists', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 20,
      roster: [champ, cont],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', { noContenderStreak: 2 }),
      },
    });
    const delta = createChampionshipDelta();
    applyLifecycleTransitions(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.status).toBe('active');
    expect(title.noContenderStreak).toBe(0);
  });

  it('moves dormant → pendingReengagement when a contender emerges and cancels unsigned offers', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const unsigned = makeBoutOffer({
      id: 'o-unsigned' as BoutOfferId,
      warriorIds: ['w-champ' as WarriorId, 'w-x' as WarriorId],
      status: 'Proposed',
    });
    const state = makeGameState({
      absoluteWeek: 20,
      week: 20,
      roster: [champ, cont],
      boutOffers: { [unsigned.id]: unsigned },
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', { status: 'dormant' }),
      },
    });
    const delta = createChampionshipDelta();
    applyLifecycleTransitions(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.status).toBe('pendingReengagement');
    // Unsigned offer canceled on entry.
    expect(delta.canceledOffers['o-unsigned']).toBeDefined();
    expect(delta.canceledOffers['o-unsigned']!.status).toBe('Canceled');
  });

  it('stays pending while the champion has signed ordinary offers; goes active when drained', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });

    // With a signed ordinary offer outstanding → stays pending.
    const signed = makeBoutOffer({
      id: 'o-signed' as BoutOfferId,
      warriorIds: ['w-champ' as WarriorId, 'w-x' as WarriorId],
      status: 'Signed',
    });
    const pendingState = makeGameState({
      absoluteWeek: 20,
      week: 20,
      roster: [champ, cont],
      boutOffers: { [signed.id]: signed },
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', { status: 'pendingReengagement' }),
      },
    });
    const delta1 = createChampionshipDelta();
    applyLifecycleTransitions(pendingState, delta1);
    expect(effTitle(pendingState, delta1, arenaId)!.status).toBe('pendingReengagement');
    // The signed offer is NOT canceled — it resolves normally.
    expect(delta1.canceledOffers['o-signed']).toBeUndefined();

    // Drained → active.
    const drainedState = makeGameState({
      absoluteWeek: 21,
      week: 21,
      roster: [champ, cont],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', { status: 'pendingReengagement' }),
      },
    });
    const delta2 = createChampionshipDelta();
    applyLifecycleTransitions(drainedState, delta2);
    expect(effTitle(drainedState, delta2, arenaId)!.status).toBe('active');
  });

  it('falls back to dormant when the pending contender disappears', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 20,
      roster: [champ],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', { status: 'pendingReengagement' }),
      },
    });
    const delta = createChampionshipDelta();
    applyLifecycleTransitions(state, delta);
    expect(effTitle(state, delta, arenaId)!.status).toBe('dormant');
  });
});

// ─── Refusal sweep ──────────────────────────────────────────────────────────

describe('sweepTitleRefusals', () => {
  const arenaId = 'standard_arena';

  it('increments refusals when the champion declines; strips at REFUSALS_TO_STRIP', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const offer = titleOffer('w-champ', 'w-cont', arenaId, {
      status: 'Rejected',
      responses: { 'w-champ': 'Declined', 'w-cont': 'Accepted' } as BoutOffer['responses'],
    });
    const base = {
      roster: [champ, cont],
      boutOffers: { [offer.id]: offer },
    };

    // First refusal.
    const s1 = makeGameState({
      ...base,
      absoluteWeek: 10,
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ', { refusals: 0 }) },
    });
    const d1 = createChampionshipDelta();
    sweepTitleRefusals(s1, d1);
    expect(effTitle(s1, d1, arenaId)!.refusals).toBe(1);
    expect(effTitle(s1, d1, arenaId)!.champion?.warriorId).toBe('w-champ');

    // Second refusal → stripped, ex-champion cooldown recorded.
    const s2 = makeGameState({
      ...base,
      absoluteWeek: 10,
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ', { refusals: 1 }) },
    });
    const d2 = createChampionshipDelta();
    sweepTitleRefusals(s2, d2);
    const title = effTitle(s2, d2, arenaId)!;
    expect(title.champion).toBeNull();
    expect(title.history[0]!.endReason).toBe('stripped');
    expect(title.declinedContenders['w-champ']).toBe(10 + ARENA_TITLE.EX_CHAMPION_COOLDOWN_WEEKS);
  });

  it('a blocking-injury decline is a postponement, not a refusal', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    champ.injuries = [
      {
        id: 'inj-1',
        name: 'Broken Arm',
        description: 'A shattered humerus.',
        severity: 'Severe',
        weeksRemaining: 4,
        penalties: {},
      },
    ] as Warrior['injuries'];
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const offer = titleOffer('w-champ', 'w-cont', arenaId, {
      status: 'Rejected',
      responses: { 'w-champ': 'Declined', 'w-cont': 'Accepted' } as BoutOffer['responses'],
    });
    const state = makeGameState({
      absoluteWeek: 10,
      roster: [champ, cont],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
    });
    const delta = createChampionshipDelta();
    sweepTitleRefusals(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.refusals).toBe(0);
    expect(title.champion?.warriorId).toBe('w-champ');
  });

  it('challenger decline applies a contender cooldown', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const offer = titleOffer('w-champ', 'w-cont', arenaId, {
      status: 'Rejected',
      responses: { 'w-champ': 'Accepted', 'w-cont': 'Declined' } as BoutOffer['responses'],
    });
    const state = makeGameState({
      absoluteWeek: 10,
      roster: [champ, cont],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
    });
    const delta = createChampionshipDelta();
    sweepTitleRefusals(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.declinedContenders['w-cont']).toBe(10 + ARENA_TITLE.CHALLENGER_COOLDOWN_WEEKS);
    expect(title.champion?.warriorId).toBe('w-champ');
  });

  it('a voided champion decline (stable dissolved) is operational — no refusal, no strip', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const offer = titleOffer('w-champ', 'w-cont', arenaId, {
      status: 'Rejected',
      responses: { 'w-champ': 'Declined', 'w-cont': 'Accepted' } as BoutOffer['responses'],
      responseNotes: { 'w-champ': STABLE_DISSOLVED_REASON } as BoutOffer['responseNotes'],
    });
    const state = makeGameState({
      absoluteWeek: 10,
      roster: [champ, cont],
      boutOffers: { [offer.id]: offer },
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', { refusals: ARENA_TITLE.REFUSALS_TO_STRIP - 1 }),
      },
    });
    const delta = createChampionshipDelta();
    sweepTitleRefusals(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    // One shy of the strip threshold — a false refusal would strip here.
    expect(title.refusals).toBe(ARENA_TITLE.REFUSALS_TO_STRIP - 1);
    expect(title.champion?.warriorId).toBe('w-champ');
    expect(title.declinedContenders['w-champ']).toBeUndefined();
  });

  it('a voided challenger decline carries no contender cooldown', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const offer = titleOffer('w-champ', 'w-cont', arenaId, {
      status: 'Rejected',
      responses: { 'w-champ': 'Accepted', 'w-cont': 'Declined' } as BoutOffer['responses'],
      responseNotes: { 'w-cont': STABLE_DISSOLVED_REASON } as BoutOffer['responseNotes'],
    });
    const state = makeGameState({
      absoluteWeek: 10,
      roster: [champ, cont],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
    });
    const delta = createChampionshipDelta();
    sweepTitleRefusals(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.declinedContenders['w-cont']).toBeUndefined();
  });

  it('a lapsed offer does not count a voided champion response as a refusal', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    // Offer still Proposed past its expiration — the void-marked Declined was
    // written by the offer processor before the stable vanished from rosters.
    const offer = titleOffer('w-champ', 'w-cont', arenaId, {
      status: 'Proposed',
      boutWeek: 5,
      expirationWeek: 5,
      responses: { 'w-champ': 'Declined', 'w-cont': 'Accepted' } as BoutOffer['responses'],
      responseNotes: { 'w-champ': STABLE_DISSOLVED_REASON } as BoutOffer['responseNotes'],
    });
    const state = makeGameState({
      absoluteWeek: 10,
      roster: [champ, cont],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
    });
    const delta = createChampionshipDelta();
    sweepTitleRefusals(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.refusals).toBe(0);
    expect(title.champion?.warriorId).toBe('w-champ');
  });

  it('a lapsed offer where a live champion never answered still accrues a refusal', () => {
    // Guard rail: the void marker only exempts operationally-dead offers —
    // genuine silence from a rostered champion is still ducking.
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const offer = titleOffer('w-champ', 'w-cont', arenaId, {
      status: 'Proposed',
      boutWeek: 5,
      expirationWeek: 5,
      responses: { 'w-champ': 'Pending', 'w-cont': 'Accepted' } as BoutOffer['responses'],
    });
    const state = makeGameState({
      absoluteWeek: 10,
      roster: [champ, cont],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
    });
    const delta = createChampionshipDelta();
    sweepTitleRefusals(state, delta);
    expect(effTitle(state, delta, arenaId)!.refusals).toBe(1);
  });

  it('a Signed offer does not clear accumulated refusals — only a fought defense erodes them', () => {
    // Repeat-duck leak: signing a defense offer is not defending. A champion
    // who refuses, signs the next offer, then refuses again must accumulate
    // toward the strip threshold instead of resetting at each signature.
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const offer = titleOffer('w-champ', 'w-cont', arenaId, {
      status: 'Signed',
      responses: { 'w-champ': 'Accepted', 'w-cont': 'Accepted' } as BoutOffer['responses'],
    });
    const state = makeGameState({
      absoluteWeek: 10,
      roster: [champ, cont],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ', { refusals: 1 }) },
    });
    const delta = createChampionshipDelta();
    sweepTitleRefusals(state, delta);
    expect(effTitle(state, delta, arenaId)!.refusals).toBe(1);
  });

  it('repeat ducks accumulate: a refusal after a signed-but-unfought defense still strips', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const cont2 = warriorAtArena('w-cont2', arenaId, { wins: 4, losses: 0 });
    const signedOffer = titleOffer('w-champ', 'w-cont', arenaId, {
      status: 'Signed',
      responses: { 'w-champ': 'Accepted', 'w-cont': 'Accepted' } as BoutOffer['responses'],
    });
    const refusedOffer = titleOffer('w-champ', 'w-cont2', arenaId, {
      status: 'Rejected',
      responses: { 'w-champ': 'Declined', 'w-cont2': 'Accepted' } as BoutOffer['responses'],
    });
    const state = makeGameState({
      absoluteWeek: 10,
      roster: [champ, cont, cont2],
      boutOffers: { [signedOffer.id]: signedOffer, [refusedOffer.id]: refusedOffer },
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ', { refusals: 1 }) },
    });
    const delta = createChampionshipDelta();
    sweepTitleRefusals(state, delta);
    const title = effTitle(state, delta, arenaId)!;
    // 1 prior refusal + signed (no relief) + this refusal = strip threshold.
    expect(title.champion).toBeNull();
    expect(title.history[0]!.endReason).toBe('stripped');
  });
});

// ─── Scheduling ─────────────────────────────────────────────────────────────

describe('scheduleTitleBouts', () => {
  const arenaId = 'standard_arena';

  it('books a defense when cadence elapsed and a contender exists', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 29,
      week: 29,
      roster: [champ, cont],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', {
          champion: {
            warriorId: 'w-champ' as WarriorId,
            startedAbsoluteWeek: 10,
            defenses: 1,
            lastActivityWeek: 29 - ARENA_TITLE.DEFENSE_INTERVAL_WEEKS,
          },
        }),
      },
    });
    const delta = createChampionshipDelta();
    scheduleTitleBouts(state, delta, rng);
    expect(delta.newOffers).toHaveLength(1);
    const offer = delta.newOffers[0]!;
    expect(offer.titleArenaId).toBe(arenaId);
    expect(offer.promoterId).toBe(ARENA_COMMISSION_ID);
    expect(offer.warriorIds).toContain('w-champ');
    expect(offer.warriorIds).toContain('w-cont');
    expect(offer.status).toBe('Proposed');
  });

  it('does not book while inside the defense interval', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 29,
      week: 29,
      roster: [champ, cont],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', {
          champion: {
            warriorId: 'w-champ' as WarriorId,
            startedAbsoluteWeek: 10,
            defenses: 1,
            lastActivityWeek: 28, // only 2 weeks ago
          },
        }),
      },
    });
    const delta = createChampionshipDelta();
    scheduleTitleBouts(state, delta, rng);
    expect(delta.newOffers).toHaveLength(0);
  });

  it('skips dormant and pending titles entirely for booking', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    for (const status of ['dormant', 'pendingReengagement'] as const) {
      const state = makeGameState({
        absoluteWeek: 29,
        week: 29,
        roster: [champ, cont],
        arenaChampions: {
          [arenaId]: makeTitleAt(arenaId, 'w-champ', {
            status,
            champion: {
              warriorId: 'w-champ' as WarriorId,
              startedAbsoluteWeek: 10,
              defenses: 0,
              lastActivityWeek: 1,
            },
          }),
        },
      });
      const delta = createChampionshipDelta();
      scheduleTitleBouts(state, delta, rng);
      expect(delta.newOffers, `status=${status}`).toHaveLength(0);
    }
  });

  it('does not double-book when a title offer is already outstanding', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const existing = titleOffer('w-champ', 'w-cont', arenaId);
    const state = makeGameState({
      absoluteWeek: 29,
      week: 29,
      roster: [champ, cont],
      boutOffers: { [existing.id]: existing },
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', {
          champion: {
            warriorId: 'w-champ' as WarriorId,
            startedAbsoluteWeek: 10,
            defenses: 1,
            lastActivityWeek: 1,
          },
        }),
      },
    });
    const delta = createChampionshipDelta();
    scheduleTitleBouts(state, delta, rng);
    expect(delta.newOffers).toHaveLength(0);
  });

  it('books a top-2 vacant title bout when there is no champion', () => {
    const a = warriorAtArena('w-a', arenaId, { wins: 6, losses: 0 });
    const b = warriorAtArena('w-b', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 29,
      week: 29,
      roster: [a, b],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, null) },
    });
    const delta = createChampionshipDelta();
    scheduleTitleBouts(state, delta, rng);
    expect(delta.newOffers).toHaveLength(1);
    expect(delta.newOffers[0]!.warriorIds).toEqual(expect.arrayContaining(['w-a', 'w-b']));
  });

  it.each([10, 20, 30, 42, 52])('slides defenses during tournament week %i', (week) => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      absoluteWeek: week,
      week,
      roster: [champ, cont],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-champ', {
          champion: {
            warriorId: 'w-champ' as WarriorId,
            startedAbsoluteWeek: 1,
            defenses: 0,
            lastActivityWeek: 1, // cadence long elapsed — only the tournament gates it
          },
        }),
      },
    });
    const delta = createChampionshipDelta();
    scheduleTitleBouts(state, delta, rng);
    expect(delta.newOffers).toHaveLength(0);
    // Tournament weeks bail before any title is touched — the defense simply
    // slides to the next week rather than counting as a deferral.
    expect(delta.arenaChampions[arenaId]).toBeUndefined();
  });
});

// ─── Relinquish ─────────────────────────────────────────────────────────────

describe('relinquishCrown', () => {
  it('ends the reign and records the ex-champion cooldown', () => {
    const arenaId = 'standard_arena';
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 29,
      roster: [champ],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
    });
    const delta = createChampionshipDelta();
    relinquishCrown(state, delta, arenaId);
    const title = effTitle(state, delta, arenaId)!;
    expect(title.champion).toBeNull();
    expect(title.history[0]!.endReason).toBe('relinquished');
    expect(title.declinedContenders['w-champ']).toBe(
      state.absoluteWeek + ARENA_TITLE.EX_CHAMPION_COOLDOWN_WEEKS
    );
  });
});

// ─── Perks ──────────────────────────────────────────────────────────────────

describe('applyChampionPerks', () => {
  const arenaId = 'standard_arena';

  it('trickles fame/pop only for active, recently-fighting champions', () => {
    const champActive = warriorAtArena('w-active', arenaId, { wins: 8, losses: 0 });
    const champStale = warriorAtArena('w-stale', 'underpit_arena', { wins: 8, losses: 0 });
    const champDormant = warriorAtArena('w-dormant', 'highplain_arena', { wins: 8, losses: 0 });
    const now = 30;
    const state = makeGameState({
      absoluteWeek: now,
      roster: [champActive, champStale, champDormant],
      arenaChampions: {
        [arenaId]: makeTitleAt(arenaId, 'w-active', {
          champion: {
            warriorId: 'w-active' as WarriorId,
            startedAbsoluteWeek: 10,
            defenses: 2,
            lastActivityWeek: now - 2,
          },
        }),
        underpit_arena: makeTitleAt('underpit_arena', 'w-stale', {
          champion: {
            warriorId: 'w-stale' as WarriorId,
            startedAbsoluteWeek: 1,
            defenses: 0,
            lastActivityWeek: now - 20, // stale
          },
        }),
        highplain_arena: makeTitleAt('highplain_arena', 'w-dormant', {
          status: 'dormant',
          champion: {
            warriorId: 'w-dormant' as WarriorId,
            startedAbsoluteWeek: 1,
            defenses: 0,
            lastActivityWeek: now - 2,
          },
        }),
      },
    });
    const delta = createChampionshipDelta();
    applyChampionPerks(state, delta);
    expect(delta.rosterUpdates.get('w-active' as WarriorId)?.fame).toBe(
      (champActive.fame ?? 0) + ARENA_TITLE.CHAMPION_FAME_PER_WEEK
    );
    expect(delta.rosterUpdates.get('w-stale' as WarriorId)).toBeUndefined();
    expect(delta.rosterUpdates.get('w-dormant' as WarriorId)).toBeUndefined();
  });
});

// ─── Coronation epithets ────────────────────────────────────────────────────

describe('coronation epithets', () => {
  const arenaId = 'standard_arena';

  it('crowns a challenger with an arena_champion epithet', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      absoluteWeek: 50,
      roster: [champ, cont],
      arenaChampions: { [arenaId]: makeTitleAt(arenaId, 'w-champ') },
      arenaHistory: [
        makeFightSummary({
          titleArenaId: arenaId,
          warriorIdA: 'w-champ' as WarriorId,
          warriorIdD: 'w-cont' as WarriorId,
          winner: 'D',
          absoluteWeek: 50,
        }),
      ],
    });
    const delta = createChampionshipDelta();
    resolveTitleBoutResults(state, delta);
    const epithet = delta.warriorEpithets['w-cont' as WarriorId];
    expect(epithet).toBeDefined();
    expect(EPITHET_TABLES.arena_champion).toContain(epithet);
    // Canonical name is never touched.
    expect(delta.rosterUpdates.get('w-cont' as WarriorId)?.name).toBeUndefined();
  });

  it('seeded champions earn an arena_champion epithet', () => {
    const wTop = warriorAtArena('w-top', arenaId, { wins: 5, losses: 1 });
    const state = makeGameState({ roster: [wTop] });
    const delta = createChampionshipDelta();
    seedChampions(state, delta);
    const epithet = delta.warriorEpithets['w-top' as WarriorId];
    expect(epithet).toBeDefined();
    expect(EPITHET_TABLES.arena_champion).toContain(epithet);
  });
});
