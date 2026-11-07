import { describe, it, expect } from 'vitest';
import {
  createChampionshipDelta,
  effectiveOffers,
} from '@/engine/championship/arenaChampionship';
import { makeBoutOffer, makeGameState } from '@/test/_fixtures/factories';
import type { BoutOffer } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';

/**
 * Characterization pins for effectiveOffers — the single-pass rewrite
 * (megaplan allocation audit) must preserve the observable result exactly:
 * base offers in record order, canceled excluded by offer-id key, delta
 * newOffers appended last.
 */
const offer = (id: string, over: Partial<BoutOffer> = {}) =>
  makeBoutOffer({ id: id as BoutOfferId, ...over });

const rec = (...os: BoutOffer[]) =>
  Object.fromEntries(os.map((o) => [o.id, o])) as Record<BoutOfferId, BoutOffer>;

const stateWith = (boutOffers: Record<BoutOfferId, BoutOffer>) =>
  makeGameState({ boutOffers });

describe('effectiveOffers — delta overlay over state.boutOffers', () => {
  it('returns base offers in record order with delta newOffers appended after', () => {
    const o1 = offer('o-1');
    const o2 = offer('o-2');
    const fresh = offer('o-new');
    const delta = createChampionshipDelta();
    delta.newOffers.push(fresh);
    expect(effectiveOffers(stateWith(rec(o1, o2)), delta)).toEqual([o1, o2, fresh]);
  });

  it('excludes offers whose ids are canceled in the delta', () => {
    const o1 = offer('o-1');
    const o2 = offer('o-2');
    const delta = createChampionshipDelta();
    delta.canceledOffers[o1.id] = { ...o1, status: 'Canceled' };
    expect(effectiveOffers(stateWith(rec(o1, o2)), delta)).toEqual([o2]);
  });

  it('applies cancellation and newOffer append together', () => {
    const o1 = offer('o-1');
    const fresh = offer('o-new');
    const delta = createChampionshipDelta();
    delta.canceledOffers[o1.id] = { ...o1, status: 'Canceled' };
    delta.newOffers.push(fresh);
    expect(effectiveOffers(stateWith(rec(o1)), delta)).toEqual([fresh]);
  });

  it('treats a missing delta as no overlay — all base offers returned', () => {
    const o1 = offer('o-1');
    const o2 = offer('o-2');
    expect(effectiveOffers(stateWith(rec(o1, o2)), undefined)).toEqual([o1, o2]);
  });

  it('skips falsy record values (defensive parity)', () => {
    const o1 = offer('o-1');
    const bogus = null as unknown as BoutOffer;
    const state = stateWith({ ...rec(o1), 'o-bogus': bogus } as Record<BoutOfferId, BoutOffer>);
    expect(effectiveOffers(state, undefined)).toEqual([o1]);
  });

  it('empty boutOffers and empty delta → []', () => {
    expect(effectiveOffers(stateWith({}), createChampionshipDelta())).toEqual([]);
    expect(effectiveOffers(stateWith({}), undefined)).toEqual([]);
  });
});
