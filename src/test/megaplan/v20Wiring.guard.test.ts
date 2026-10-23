import { describe, it, expect } from 'vitest';
import { narrativeContent } from '@/data/narrative';
import offseasonData from '@/data/narrative/offseason.json';
import { EVENT_HANDLERS } from '@/engine/pipeline/seasonal';

/**
 * V20 wiring guards — event registration parity.
 *
 * Authored test-first during the V20 consolidation campaign: the parity
 * describes below are live ratchets (green at commit, must stay green as
 * PR #1066 merges). The MEGAPLAN-V* .skip specs encode post-merge state and
 * un-skip as their branch lands:
 *   V1 — canonical OFFSEASON_EFFECT_TYPES tuple (F4 fix, Phase 5)
 *   V2 — mysterious_trader weekly event (PR #1066)
 *   V3 — chaos_squall_exposure handler + JSON entry (PR #1066)
 *
 * Motivation: the V15 #1048 lesson — an event can be added to the JSON pool
 * and typed correctly yet never roll because a registration surface was
 * missed. Both directions of the offseason map are asserted so that class
 * of bug fails loudly here instead of shipping silently.
 */

const offseasonEvents = offseasonData.offseason_events as Record<
  string,
  { effectType?: string }
>;

describe('offseason event wiring parity (live guard)', () => {
  it('every offseason_events JSON effectType resolves to a registered handler', () => {
    const missing = Object.entries(offseasonEvents)
      .filter(([, e]) => !EVENT_HANDLERS[e.effectType ?? ''])
      .map(([key]) => key);
    expect(
      missing,
      `offseason JSON events with no handler: ${missing.join(', ')}`
    ).toEqual([]);
  });

  it('every EVENT_HANDLERS key is reachable by at least one offseason event', () => {
    const used = new Set(Object.values(offseasonEvents).map((e) => e.effectType));
    const dead = Object.keys(EVENT_HANDLERS).filter((k) => !used.has(k));
    expect(
      dead,
      `registered handlers unreachable from the JSON pool: ${dead.join(', ')}`
    ).toEqual([]);
  });

  it('every offseason JSON entry carries a non-empty effectType string', () => {
    const bad = Object.entries(offseasonEvents)
      .filter(([, e]) => typeof e.effectType !== 'string' || e.effectType.length === 0)
      .map(([key]) => key);
    expect(bad).toEqual([]);
  });
});

describe('weekly events surface (live guard)', () => {
  it('narrativeContent.events exposes all events consumed by EventPass', () => {
    const events = narrativeContent.events as unknown as Record<string, unknown>;
    for (const key of [
      'tavern_brawl',
      'celestial_blessing',
      'lost_relic',
      'mysterious_patron',
      'goblin_merchant',
    ]) {
      expect(events[key], `narrativeContent.events.${key} missing`).toBeDefined();
    }
  });
});

describe('MEGAPLAN-V1: canonical OFFSEASON_EFFECT_TYPES tuple', () => {
  it.skip('OFFSEASON_EFFECT_TYPES contains every JSON effectType (MEGAPLAN-V1)', async () => {
    // `as unknown` — the const tuple doesn't exist until the F4 fix lands;
    // the parked spec encodes the post-merge export surface.
    const { OFFSEASON_EFFECT_TYPES } = (await import(
      '@/engine/pipeline/offseasonEvents/types'
    )) as unknown as { OFFSEASON_EFFECT_TYPES: readonly string[] };
    const canonical = new Set<string>(OFFSEASON_EFFECT_TYPES);
    const missing = Object.values(offseasonEvents)
      .map((e) => e.effectType ?? '')
      .filter((et) => !canonical.has(et));
    expect(missing).toEqual([]);
    // The pre-V20 drift instance the tuple must cover.
    expect(canonical.has('cursed_treasure_discovery')).toBe(true);
  });

  it.skip('EVENT_HANDLERS keys are a subset of OFFSEASON_EFFECT_TYPES (MEGAPLAN-V1)', async () => {
    const { OFFSEASON_EFFECT_TYPES } = (await import(
      '@/engine/pipeline/offseasonEvents/types'
    )) as unknown as { OFFSEASON_EFFECT_TYPES: readonly string[] };
    const canonical = new Set<string>(OFFSEASON_EFFECT_TYPES);
    const extra = Object.keys(EVENT_HANDLERS).filter((k) => !canonical.has(k));
    expect(extra).toEqual([]);
  });
});

describe('MEGAPLAN-V2: mysterious_trader weekly event (PR #1066)', () => {
  it('narrativeContent.events includes mysterious_trader (MEGAPLAN-V2)', () => {
    const events = narrativeContent.events as unknown as Record<string, unknown>;
    expect(events['mysterious_trader']).toBeDefined();
  });
});

describe('MEGAPLAN-V3: chaos_squall_exposure offseason event (PR #1066)', () => {
  it('chaos_squall_exposure is a rollable JSON entry with a registered handler (MEGAPLAN-V3)', () => {
    const entry = offseasonEvents['chaos_squall_exposure'];
    expect(entry, 'chaos_squall_exposure missing from offseason_events').toBeDefined();
    expect(
      EVENT_HANDLERS['chaos_squall_exposure'],
      'handler not registered in EVENT_HANDLERS'
    ).toBeDefined();
  });

  it('handleChaosSquallExposure grants +30 xp and +15 fatigue to an active warrior (MEGAPLAN-V3)', async () => {
    const { handleChaosSquallExposure } = (await import(
      '@/engine/pipeline/offseasonEvents'
    )) as unknown as { handleChaosSquallExposure: (run: unknown) => void };
    const ctx = {
      rosterUpdates: new Map(),
      newsletterItems: [],
      ledgerEntries: [],
      insightTokens: [],
      treasuryDelta: 0,
    };
    const warrior = {
      id: 'w-squall',
      name: 'Squallbait',
      status: 'Active',
      xp: 10,
      fatigue: 5,
      injuries: [],
    };
    const rng = {
      next: () => 0.5,
      pick: (arr: unknown[]) => arr[0],
      uuid: () => 'uuid-1',
      roll: () => 1,
      chance: () => true,
      int: (a: number) => a,
      fork: () => rng,
    };
    handleChaosSquallExposure({
      state: { roster: [warrior] },
      nextWeek: 1,
      e: { title: 'Caught in a Chaos Squall', effectType: 'chaos_squall_exposure', newsletter: ['n'] },
      rng,
      ctx,
    });
    const update = ctx.rosterUpdates.get('w-squall') as { xp?: number; fatigue?: number };
    expect(update?.xp).toBe(40);
    expect(update?.fatigue).toBe(20);
    expect(ctx.newsletterItems.length).toBe(1);
  });
});
