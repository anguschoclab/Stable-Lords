import { describe, it, expect, beforeEach } from 'vitest';
import {
  makeWarrior,
  makeGameState,
  makeBoutOffer,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import { makeVenueWarrior, makeArenaTitle } from '@/test/_fixtures/arenaTitle';
import { runArenaChampionshipPass } from '@/engine/pipeline/passes/ArenaChampionshipPass';
import { resolveImpacts } from '@/engine/impacts';
import { WEEK_PIPELINE_PASSES } from '@/engine/pipeline/services/weekPipelineService';
import { validatePipelinePasses } from '@/engine/pipeline/pipelineStages';
import { generatePairings } from '@/engine/bout/core/pairings';
import { collectUnavailableWarriorIds } from '@/engine/promoters/offerMatchmaking';
import { planWorldBouts } from '@/engine/matchmaking/worldMatchmaking';
import { ARENA_TITLE } from '@/constants/arena';
import type { ArenaTitle, BoutOffer } from '@/types/state.types';
import type { WarriorId, BoutOfferId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { WeekPipelineContext } from '@/engine/pipeline/pipelineStages';
import { makeRival } from '@/test/_fixtures/factories';

let uuidN = 0;
const rng = {
  uuid: (prefix = 'id') => `${prefix}-t-${++uuidN}`,
  next: () => 0.5,
  int: (_min: number, _max: number) => _min,
} as unknown as IRNGService;

const ctx: WeekPipelineContext = {
  currentWeek: 29,
  nextWeek: 30,
  nextYear: 1,
  rootRng: rng,
};


function warriorAtArena(id: string, arenaId: string, rec: { wins: number; losses: number; kills?: number }) {
  return makeVenueWarrior(id, { wins: rec.wins, losses: rec.losses, kills: rec.kills ?? 0, arenaId });
}

function activeTitle(champId: string | null, over: Partial<ArenaTitle> = {}): ArenaTitle {
  return makeArenaTitle(champId, over);
}

beforeEach(() => {
  resetFixtureIds();
  uuidN = 0;
});

// ─── Pipeline legality ──────────────────────────────────────────────────────

describe('ArenaChampionshipPass registration', () => {
  it('is declared and passes validatePipelinePasses', () => {
    const spec = WEEK_PIPELINE_PASSES.find((p) => p.id === 'arenaChampionship');
    expect(spec).toBeDefined();
    expect(spec!.stage).toBe('world');
    expect(validatePipelinePasses(WEEK_PIPELINE_PASSES)).toEqual([]);
  });

  it('writes only declared StateImpact keys', () => {
    const arenaId = 'standard_arena';
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const state = makeGameState({
      week: 29,
      absoluteWeek: 29,
      roster: [champ],
      arenaChampions: {
        [arenaId]: activeTitle('w-champ', { noContenderStreak: ARENA_TITLE.DORMANCY_STREAK }),
      },
    });
    const impact = runArenaChampionshipPass(state, ctx);
    const spec = WEEK_PIPELINE_PASSES.find((p) => p.id === 'arenaChampionship')!;
    for (const key of Object.keys(impact)) {
      expect(spec.writes).toContain(key);
    }
    // Dormancy transition fired → arenaChampions + newsletter written.
    expect(impact.arenaChampions?.[arenaId]?.status).toBe('dormant');
    expect(impact.newsletterItems?.length).toBeGreaterThan(0);
  });
});

// ─── End-to-end through resolveImpacts ──────────────────────────────────────

describe('ArenaChampionshipPass behavior', () => {
  it('seeds champions into state via resolveImpacts', () => {
    const arenaId = 'standard_arena';
    const w = warriorAtArena('w-top', arenaId, { wins: 5, losses: 1 });
    const state = makeGameState({ week: 29, absoluteWeek: 29, roster: [w] });
    const impact = runArenaChampionshipPass(state, ctx);
    const next = resolveImpacts(state, [impact]);
    expect(next.arenaChampions?.[arenaId]?.champion?.warriorId).toBe('w-top');
    expect(next.arenaChampions?.[arenaId]?.status).toBe('active');
  });

  it('books a defense offer when cadence elapsed', () => {
    const arenaId = 'standard_arena';
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      week: 29,
      absoluteWeek: 29,
      roster: [champ, cont],
      arenaChampions: {
        [arenaId]: activeTitle('w-champ', {
          champion: {
            warriorId: 'w-champ' as WarriorId,
            startedAbsoluteWeek: 5,
            defenses: 1,
            lastActivityWeek: 29 - ARENA_TITLE.DEFENSE_INTERVAL_WEEKS,
          },
        }),
      },
    });
    const impact = runArenaChampionshipPass(state, ctx);
    const next = resolveImpacts(state, [impact]);
    const titleOffers = Object.values(next.boutOffers).filter((o) => o.titleArenaId === arenaId);
    expect(titleOffers).toHaveLength(1);
    expect(titleOffers[0]!.warriorIds).toEqual(
      expect.arrayContaining(['w-champ', 'w-cont'])
    );
  });

  it('pendingReengagement → active lands a defense offer in the same pass', () => {
    const arenaId = 'standard_arena';
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const state = makeGameState({
      week: 29,
      absoluteWeek: 29,
      roster: [champ, cont],
      arenaChampions: {
        [arenaId]: activeTitle('w-champ', {
          status: 'pendingReengagement',
          champion: {
            warriorId: 'w-champ' as WarriorId,
            startedAbsoluteWeek: 5,
            defenses: 1,
            lastActivityWeek: 1, // cadence long since elapsed
          },
        }),
      },
    });
    const impact = runArenaChampionshipPass(state, ctx);
    const next = resolveImpacts(state, [impact]);
    expect(next.arenaChampions?.[arenaId]?.status).toBe('active');
    const titleOffers = Object.values(next.boutOffers).filter((o) => o.titleArenaId === arenaId);
    expect(titleOffers).toHaveLength(1);
  });
});

// ─── Choke point ────────────────────────────────────────────────────────────

describe('generatePairings champion choke point', () => {
  const arenaId = 'standard_arena';

  function signedOffer(id: string, aId: string, dId: string, titleArenaId?: string): BoutOffer {
    return makeBoutOffer({
      id: id as BoutOfferId,
      warriorIds: [aId as WarriorId, dId as WarriorId],
      status: 'Signed',
      titleArenaId,
      createdAbsoluteWeek: 28,
      boutWeek: 29,
    });
  }

  it('voids a signed non-title offer involving an ACTIVE champion', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const other = warriorAtArena('w-other', arenaId, { wins: 5, losses: 0 });
    const offer = signedOffer('o1', 'w-champ', 'w-other');
    const state = makeGameState({
      week: 29,
      absoluteWeek: 29,
      roster: [champ, other],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { [arenaId]: activeTitle('w-champ') },
    });
    const { pairings, voidedOffers } = generatePairings(state);
    expect(pairings).toHaveLength(0);
    expect(voidedOffers.map((o) => o.id)).toEqual(['o1']);
  });

  it('lets a dormant champion’s signed ordinary offer resolve', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const other = warriorAtArena('w-other', arenaId, { wins: 5, losses: 0 });
    const offer = signedOffer('o1', 'w-champ', 'w-other');
    const state = makeGameState({
      week: 29,
      absoluteWeek: 29,
      roster: [champ, other],
      boutOffers: { [offer.id]: offer },
      arenaChampions: {
        [arenaId]: activeTitle('w-champ', { status: 'dormant' }),
      },
    });
    const { pairings, voidedOffers } = generatePairings(state);
    expect(pairings).toHaveLength(1);
    expect(voidedOffers).toHaveLength(0);
  });

  it('a pendingReengagement champion’s signed offer still resolves', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const other = warriorAtArena('w-other', arenaId, { wins: 5, losses: 0 });
    const offer = signedOffer('o1', 'w-champ', 'w-other');
    const state = makeGameState({
      week: 29,
      absoluteWeek: 29,
      roster: [champ, other],
      boutOffers: { [offer.id]: offer },
      arenaChampions: {
        [arenaId]: activeTitle('w-champ', { status: 'pendingReengagement' }),
      },
    });
    const { pairings } = generatePairings(state);
    expect(pairings).toHaveLength(1);
  });

  it('a signed title offer for an active champion is not voided by the choke point', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const cont = warriorAtArena('w-cont', arenaId, { wins: 5, losses: 0 });
    const offer = signedOffer('o-title', 'w-champ', 'w-cont', arenaId);
    const state = makeGameState({
      week: 29,
      absoluteWeek: 29,
      roster: [champ, cont],
      boutOffers: { [offer.id]: offer },
      arenaChampions: { [arenaId]: activeTitle('w-champ') },
    });
    const { pairings, voidedOffers } = generatePairings(state);
    expect(pairings).toHaveLength(1);
    expect(voidedOffers).toHaveLength(0);
  });

  it('title offer wins the dedupe over an ordinary offer for the same warrior', () => {
    // Note: under the champion choke this scenario can't arise for champions,
    // but contenders can be double-booked — the title bout wins the slot.
    const a = warriorAtArena('w-a', arenaId, { wins: 8, losses: 0 });
    const b = warriorAtArena('w-b', arenaId, { wins: 5, losses: 0 });
    const c = warriorAtArena('w-c', arenaId, { wins: 4, losses: 0 });
    const titleOffer = signedOffer('z-ordinary-id', 'w-a', 'w-b', arenaId);
    const ordinary = signedOffer('a-early-id', 'w-a', 'w-c');
    const state = makeGameState({
      week: 29,
      absoluteWeek: 29,
      roster: [a, b, c],
      boutOffers: { [titleOffer.id]: titleOffer, [ordinary.id]: ordinary },});
    const { pairings, voidedOffers } = generatePairings(state);
    expect(pairings).toHaveLength(1);
    expect(pairings[0]!.contractId).toBe('z-ordinary-id');
    expect(voidedOffers.map((o) => o.id)).toEqual(['a-early-id']);
  });
});

// ─── Producer exclusion ─────────────────────────────────────────────────────

describe('producer exclusion of booking-locked champions', () => {
  const arenaId = 'standard_arena';

  it('collectUnavailableWarriorIds includes active and pending champions, not dormant', () => {
    const state = makeGameState({
      arenaChampions: {
        arena_a: activeTitle('w-a'),
        arena_b: activeTitle('w-b', { status: 'pendingReengagement' }),
        arena_c: activeTitle('w-c', { status: 'dormant' }),
      },
    });
    const unavailable = collectUnavailableWarriorIds(state, {}, 5);
    expect(unavailable.has('w-a')).toBe(true);
    expect(unavailable.has('w-b')).toBe(true);
    expect(unavailable.has('w-c')).toBe(false);
  });

  it('planWorldBouts never produces an offer for a locked champion', () => {
    const champ = warriorAtArena('w-champ', arenaId, { wins: 8, losses: 0 });
    const w1 = makeWarrior({ id: 'w-1' as WarriorId });
    const w2 = makeWarrior({ id: 'w-2' as WarriorId });
    const rival = makeRival({ roster: [champ, w1, w2] });
    const state = makeGameState({
      week: 29,
      absoluteWeek: 29,
      rivals: [rival],
      arenaChampions: { [arenaId]: activeTitle('w-champ') },
    });
    const offers = planWorldBouts(state, rng);
    for (const o of offers) {
      expect(o.warriorIds).not.toContain('w-champ');
    }
  });
});
