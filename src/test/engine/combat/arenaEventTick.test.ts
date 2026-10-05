/**
 * ARENA_EVENTS engine wiring — contract tests.
 *
 * The arena-event registry (constants/arenaEvents.ts) declares trigger
 * conditions, narrative text, and mechanical effects. These tests pin the
 * production wiring: a per-exchange `tickArenaEvents` pass inside
 * `resolveExchange` that evaluates tag-matched events against the
 * exchange's outcome, applies mechanical effects, and emits ARENA_EVENT
 * CombatEvents that narrate into the bout log.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import { tickArenaEvents } from '@/engine/combat/mechanics/arenaEvents';
import { resolveExchange } from '@/engine/combat/resolution/resolution';
import { narrateEvents, type NarrationContext } from '@/engine/combat/narrative/narrator';
import { peekArchive } from '@/engine/narrative/narrativePBPUtils';
import { loadCombatNarrative } from '@/data/narrative';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';
import type { ArenaConfig, ArenaTag } from '@/types/shared.types';
import { getArenaById } from '@/data/arenas';

beforeAll(async () => {
  await loadCombatNarrative();
});

const arenaWithTags = (tags: ArenaTag[]): ArenaConfig => ({
  ...getArenaById('standard_arena'),
  tags,
});

const arenaEventIds = (events: CombatEvent[]) =>
  events.filter((e) => e.type === 'ARENA_EVENT').map((e) => e.metadata?.arenaEventId);

const heavyHit = (value: number): CombatEvent => ({
  type: 'HIT',
  actor: 'A',
  target: 'D',
  value,
  location: 'chest',
});

describe('tickArenaEvents — trigger evaluation', () => {
  it('fires crowd_riot on a heavy hit in a premium arena', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [heavyHit(16)];

    tickArenaEvents(ctx, fA, fD, events);

    expect(arenaEventIds(events)).toContain('crowd_riot');
  });

  it('does not fire when the heaviest hit is below the trigger threshold', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [heavyHit(14)];

    tickArenaEvents(ctx, fA, fD, events);

    expect(arenaEventIds(events)).not.toContain('crowd_riot');
  });

  it('ignores bleed ticks when evaluating heavy_hit triggers', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [
      { ...heavyHit(30), location: 'Bleed', metadata: { cause: 'BLEED' } },
    ];

    tickArenaEvents(ctx, fA, fD, events);

    expect(arenaEventIds(events)).toHaveLength(0);
  });

  it('fires random events when the RNG roll lands below the trigger value', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['ruins', 'cramped']),
      rng: () => 0.01, // below falling_debris 0.03
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [];

    tickArenaEvents(ctx, fA, fD, events);

    expect(arenaEventIds(events)).toContain('falling_debris');
  });

  it('suppresses random events on a high RNG roll', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['ruins', 'cramped']),
      rng: () => 0.99,
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [];

    tickArenaEvents(ctx, fA, fD, events);

    expect(arenaEventIds(events)).toHaveLength(0);
  });

  it('fires exchange_interval events on the interval boundary', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['water', 'uneven']),
      exchange: 6, // geyser_eruption: every 6
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [];

    tickArenaEvents(ctx, fA, fD, events);

    expect(arenaEventIds(events)).toContain('geyser_eruption');
  });

  it('does not fire exchange_interval events off the boundary', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['water', 'uneven']),
      exchange: 7,
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [];

    tickArenaEvents(ctx, fA, fD, events);

    expect(arenaEventIds(events)).not.toContain('geyser_eruption');
  });

  it('emits nothing for arenas whose tags host no events', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['outdoor', 'open']),
      rng: () => 0.0,
      exchange: 12,
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [heavyHit(50)];

    tickArenaEvents(ctx, fA, fD, events);

    expect(arenaEventIds(events)).toHaveLength(0);
    expect(events).toHaveLength(1); // only the input HIT event
  });
});

describe('tickArenaEvents — weather_combo gating', () => {
  it('fires blood-moon events under Blood Moon but not Mana Surge', () => {
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const ctxBlood = makeResolutionContext({
      arenaConfig: arenaWithTags(['cursed']),
      weather: 'Blood Moon',
      rng: () => 0.99,
    });
    const bloodEvents: CombatEvent[] = [];

    tickArenaEvents(ctxBlood, fA, fD, bloodEvents);

    expect(arenaEventIds(bloodEvents)).toContain('blood_moon_amplification');
    expect(arenaEventIds(bloodEvents)).toContain('blood_moon_lighting');

    const ctxMana = makeResolutionContext({
      arenaConfig: arenaWithTags(['cursed']),
      weather: 'Mana Surge',
      rng: () => 0.99,
    });
    const manaEvents: CombatEvent[] = [];
    tickArenaEvents(ctxMana, fA, fD, manaEvents);
    expect(arenaEventIds(manaEvents)).not.toContain('blood_moon_amplification');
    expect(arenaEventIds(manaEvents)).not.toContain('blood_moon_lighting');
  });

  it('fires aether_surge under Mana Surge but not Blood Moon', () => {
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const ctxMana = makeResolutionContext({
      arenaConfig: arenaWithTags(['magical']),
      weather: 'Mana Surge',
      rng: () => 0.99,
    });
    const manaEvents: CombatEvent[] = [];

    tickArenaEvents(ctxMana, fA, fD, manaEvents);

    expect(arenaEventIds(manaEvents)).toContain('aether_surge');

    const ctxBlood = makeResolutionContext({
      arenaConfig: arenaWithTags(['magical']),
      weather: 'Blood Moon',
      rng: () => 0.99,
    });
    const bloodEvents: CombatEvent[] = [];
    tickArenaEvents(ctxBlood, fA, fD, bloodEvents);
    expect(arenaEventIds(bloodEvents)).not.toContain('aether_surge');
  });

  it('fires a weather_combo event only once per fight', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['cursed']),
      weather: 'Blood Moon',
      rng: () => 0.99,
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });

    const first: CombatEvent[] = [];
    tickArenaEvents(ctx, fA, fD, first);
    const second: CombatEvent[] = [];
    tickArenaEvents(ctx, fA, fD, second);
    const third: CombatEvent[] = [];
    tickArenaEvents(ctx, fA, fD, third);

    expect(arenaEventIds(first)).toContain('blood_moon_lighting');
    expect(arenaEventIds(second)).not.toContain('blood_moon_lighting');
    expect(arenaEventIds(third)).not.toContain('blood_moon_lighting');
  });
});

describe('tickArenaEvents — mechanical effects', () => {
  it('applies damage effects to both fighters', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    const fA = makeFighterState({ hp: 100 });
    const fD = makeFighterState({ label: 'D', hp: 80 });
    const events: CombatEvent[] = [heavyHit(16)];

    tickArenaEvents(ctx, fA, fD, events);

    // crowd_riot: damage 2 to both
    expect(fA.hp).toBe(98);
    expect(fD.hp).toBe(78);
  });

  it('ends the bout when hazard damage drops one fighter to 0 hp', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    const fA = makeFighterState({ hp: 100 });
    const fD = makeFighterState({ label: 'D', hp: 2 }); // crowd_riot dmg 2 → 0
    const events: CombatEvent[] = [heavyHit(16)];

    tickArenaEvents(ctx, fA, fD, events);

    const boutEnd = events.find((e) => e.type === 'BOUT_END');
    expect(boutEnd?.result).toBe('KO');
    expect(boutEnd?.actor).toBe('A');
    expect(boutEnd?.metadata?.cause).toBe('ARENA_HAZARD');
  });

  it('ends in a draw when hazard damage drops both fighters', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    const fA = makeFighterState({ hp: 2 });
    const fD = makeFighterState({ label: 'D', hp: 1 }); // crowd_riot dmg 2 → both ≤0
    const events: CombatEvent[] = [heavyHit(16)];

    tickArenaEvents(ctx, fA, fD, events);

    const boutEnd = events.find((e) => e.type === 'BOUT_END');
    // Mutual incapacitation — Exhaustion maps to winner=null downstream.
    expect(boutEnd?.result).toBe('Exhaustion');
    expect(boutEnd?.metadata?.cause).toBe('ARENA_HAZARD');
  });

  it('does not double-end a bout already decided by a hit', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    const fA = makeFighterState({ hp: 100 });
    const fD = makeFighterState({ label: 'D', hp: 2 });
    const events: CombatEvent[] = [
      heavyHit(16),
      { type: 'BOUT_END', actor: 'A', result: 'Kill', metadata: { cause: 'FATAL_DAMAGE' } },
    ];

    tickArenaEvents(ctx, fA, fD, events);

    // Hazard tick must not stack a second BOUT_END after the deciding one.
    expect(events.filter((e) => e.type === 'BOUT_END')).toHaveLength(1);
  });

  it('emits a cause-tagged HIT per fighter when a damage effect fires', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    const fA = makeFighterState({ hp: 100 });
    const fD = makeFighterState({ label: 'D', hp: 80 });
    const events: CombatEvent[] = [heavyHit(16)];

    tickArenaEvents(ctx, fA, fD, events);

    const hazardHits = events.filter(
      (e) => e.type === 'HIT' && e.metadata?.cause === 'ARENA_EVENT'
    );
    expect(hazardHits).toHaveLength(2);
    expect(hazardHits.map((h) => h.target).sort()).toEqual(['A', 'D']);
    // crowd_riot: damage 2
    expect(hazardHits.every((h) => h.value === 2)).toBe(true);
    expect(hazardHits.every((h) => h.metadata?.arenaEventId === 'crowd_riot')).toBe(true);
    expect(hazardHits.every((h) => h.metadata?.hazardName === 'Crowd Riot')).toBe(true);
    // No location — hazard damage has no body part and must not pollute
    // buildExchangeLogEntry.hitLocation.
    expect(hazardHits.every((h) => h.location === undefined)).toBe(true);
  });

  it('does not count cause-tagged hits toward heavy_hit triggers', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [
      {
        type: 'HIT',
        actor: 'A',
        target: 'A',
        value: 50,
        metadata: { cause: 'ARENA_EVENT', arenaEventId: 'crowd_riot' },
      },
    ];

    tickArenaEvents(ctx, fA, fD, events);

    expect(arenaEventIds(events)).toHaveLength(0);
  });

  it('names the triggering hitter as the ARENA_EVENT actor on heavy_hit triggers', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    const events: CombatEvent[] = [{ ...heavyHit(20), actor: 'D', target: 'A' }];

    tickArenaEvents(ctx, fA, fD, events);

    const arenaEvent = events.find((e) => e.type === 'ARENA_EVENT');
    expect(arenaEvent?.actor).toBe('D');
    expect(arenaEvent?.metadata?.hazardName).toBe('Crowd Riot');
  });

  it('applies endurance_drain to both fighters and floors at 0', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['cursed']) });
    const fA = makeFighterState({ endurance: 100 });
    const fD = makeFighterState({ label: 'D', endurance: 3 });
    // shadow_tendrils: heavy_hit 20 → endurance_drain 5
    const events: CombatEvent[] = [heavyHit(25)];

    tickArenaEvents(ctx, fA, fD, events);

    expect(arenaEventIds(events)).toContain('shadow_tendrils');
    expect(fA.endurance).toBe(95);
    expect(fD.endurance).toBe(0);
  });

  it('queues initiative_mod into the pending arena-event modifier for the next exchange', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['magical', 'elevated']),
      rng: () => 0.01, // below monolith_pulse 0.05
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });

    tickArenaEvents(ctx, fA, fD, []);

    expect(ctx.arenaEventMods?.initiativeMod).toBe(-3);
  });

  it('expires pending mods when no mod event fires on the next tick', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['magical', 'elevated']),
      rng: () => 0.01,
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });

    tickArenaEvents(ctx, fA, fD, []);
    expect(ctx.arenaEventMods?.initiativeMod).toBe(-3);

    // Next exchange: roll lands above the trigger → no fire → mods cleared.
    (ctx as { rng: () => number }).rng = () => 0.99;
    tickArenaEvents(ctx, fA, fD, []);
    expect(ctx.arenaEventMods?.initiativeMod ?? 0).toBe(0);
  });

  it('supports riposte_mod effects through the pending modifier channel', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    // Inject a synthetic riposte_mod candidate — the registry has none yet,
    // but the mechanicalEffect union declares the type.
    ctx.arenaEventCandidates = [
      {
        id: 'synthetic_riposte',
        name: 'Synthetic',
        description: 'test',
        requiredTags: ['premium'],
        triggerCondition: 'exchange_interval',
        triggerValue: 1,
        narrativeText: 'test',
        mechanicalEffect: { type: 'riposte_mod', value: -4 },
      },
    ];
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });
    ctx.exchange = 1;

    tickArenaEvents(ctx, fA, fD, []);

    expect(ctx.arenaEventMods?.riposteMod).toBe(-4);
  });

  it('records firing event names in arenaEventModSources for echo narration', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['magical', 'elevated']),
      rng: () => 0.01, // below monolith_pulse 0.05
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });

    tickArenaEvents(ctx, fA, fD, []);

    expect(ctx.arenaEventModSources?.initiative).toContain('Monolith Pulse');
  });

  it('records riposte-mod sources and clears them when nothing fires', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    ctx.arenaEventCandidates = [
      {
        id: 'synthetic_riposte',
        name: 'Synthetic',
        description: 'test',
        requiredTags: ['premium'],
        triggerCondition: 'exchange_interval',
        triggerValue: 3,
        narrativeText: 'test',
        mechanicalEffect: { type: 'riposte_mod', value: -4 },
      },
    ];
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });

    ctx.exchange = 3;
    tickArenaEvents(ctx, fA, fD, []);
    expect(ctx.arenaEventModSources?.riposte).toContain('Synthetic');

    ctx.exchange = 4;
    tickArenaEvents(ctx, fA, fD, []);
    expect(ctx.arenaEventModSources?.riposte ?? []).toHaveLength(0);
  });
});

describe('arena events — resolution integration', () => {
  it('resolveExchange emits ARENA_EVENT when an interval trigger lands', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['water', 'uneven']),
      exchange: 6,
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });

    const events = resolveExchange(ctx, fA, fD);

    expect(arenaEventIds(events)).toContain('geyser_eruption');
  });

  it('pending initiative_mod shifts the next exchange initiative sum', () => {
    const base = makeResolutionContext({
      arenaConfig: arenaWithTags(['outdoor', 'open']),
    });
    const modded = makeResolutionContext({
      arenaConfig: arenaWithTags(['outdoor', 'open']),
    });
    modded.arenaEventMods = { initiativeMod: -3, riposteMod: 0 };
    const fA1 = makeFighterState();
    const fD1 = makeFighterState({ label: 'D' });
    const fA2 = makeFighterState();
    const fD2 = makeFighterState({ label: 'D' });

    const iniBaseline = resolveExchange(base, fA1, fD1).find(
      (e) => e.type === 'INITIATIVE'
    )!.value!;
    const iniModded = resolveExchange(modded, fA2, fD2).find(
      (e) => e.type === 'INITIATIVE'
    )!.value!;

    // Identical fighters → winner's ini drops by exactly the pending mod.
    expect(iniModded).toBe(iniBaseline - 3);
  });
});

describe('arena events — narration', () => {
  const createNarrCtx = (): NarrationContext => ({
    rng: new SeededRNG(42),
    nameA: 'Thunderstrike',
    nameD: 'Lightning',
    weaponA: 'broadsword',
    weaponD: 'short_spear',
    styleA: FightingStyle.StrikingAttack,
    styleD: FightingStyle.TotalParry,
    maxHpA: 100,
    maxHpD: 100,
    prevHpRatioA: 1.0,
    prevHpRatioD: 1.0,
    fameA: 10,
    fameD: 10,
  });

  it('narrates ARENA_EVENT from the arena-events announce pool', () => {
    const events: CombatEvent[] = [
      {
        type: 'ARENA_EVENT',
        actor: 'A',
        metadata: {
          arenaEventId: 'geyser_eruption',
          hazardName: 'Geyser Eruption',
          narrativeText: 'A hidden geyser erupts, blasting scalding water into the air!',
        },
      },
    ];

    const { log } = narrateEvents(events, createNarrCtx(), 3);

    const line = log.find((l) => l.events?.some((e) => e.type === 'ARENA_EVENT'));
    expect(line).toBeTruthy();
    // Announce text comes from pbp.arena_events.<id>.lines; the registry
    // narrativeText remains the fallback for unregistered ids.
    const pool = peekArchive(['pbp', 'arena_events', 'geyser_eruption', 'lines']) ?? [];
    expect(pool.length).toBeGreaterThanOrEqual(3);
    expect([...pool, 'A hidden geyser erupts, blasting scalding water into the air!']).toContain(
      line!.text
    );
  });

  it('falls back to metadata narrativeText for unregistered arenaEventIds', () => {
    const events: CombatEvent[] = [
      {
        type: 'ARENA_EVENT',
        actor: 'A',
        metadata: {
          arenaEventId: 'unregistered_event',
          narrativeText: 'Something inexplicable happens.',
        },
      },
    ];

    const { log } = narrateEvents(events, createNarrCtx(), 3);

    expect(log[0]?.text).toBe('Something inexplicable happens.');
  });
});

describe('arena events — bout-level integration', () => {
  it('a cursed-arena bout under Blood Moon narrates the arena event', () => {
    const attrs = { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 };
    const wA = makeWarrior({ id: undefined, name: 'A', style: FightingStyle.StrikingAttack, attrs });
    const wD = makeWarrior({ id: undefined, name: 'D', style: FightingStyle.TotalParry, attrs });

    const outcome = simulateFight({
      planA: defaultPlanForWarrior(wA),
      planD: defaultPlanForWarrior(wD),
      warriorA: wA,
      warriorD: wD,
      providedRng: 4242,
      // outdoor + cursed — indoor arenas resolve weather down to Clear
      arenaId: 'the_gallows_tree',
      weather: 'Blood Moon',
      deathRateMult: 0,
    });

    const lines = outcome.log.map((m) => m.text ?? '');
    expect(lines.some((t) => /blood moon/i.test(t))).toBe(true);
    // The hazard's damage is narrated — at least one minute carries an
    // ARENA_EVENT-caused HIT alongside the announce.
    expect(
      outcome.log.some((m) =>
        m.events?.some((e) => e.type === 'HIT' && e.metadata?.cause === 'ARENA_EVENT')
      )
    ).toBe(true);
  });

  it('same seed reproduces identical arena-event outcomes (determinism)', () => {
    const attrs = { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 };
    const mk = (style: FightingStyle) =>
      makeWarrior({ id: undefined, name: 'W', style, attrs });
    const run = (headless: boolean) => {
      const wA = mk(FightingStyle.StrikingAttack);
      const wD = mk(FightingStyle.TotalParry);
      return simulateFight({
        planA: defaultPlanForWarrior(wA),
        planD: defaultPlanForWarrior(wD),
        warriorA: wA,
        warriorD: wD,
        providedRng: 777,
        arenaId: 'the_gallows_tree',
        weather: 'Blood Moon',
        headless,
        deathRateMult: 0,
      });
    };

    const r1 = run(true);
    const r2 = run(true);
    expect(r1.minutes).toBe(r2.minutes);
    expect(r1.winner).toBe(r2.winner);

    // Narrated runs: flavor draws come from the seeded narRng, so the log
    // text must be identical too.
    const n1 = run(false);
    const n2 = run(false);
    expect(n1.log.map((m) => m.text)).toEqual(n2.log.map((m) => m.text));
  });
});

describe('arena events — next-exchange attribution', () => {
  it('stamps the pending initiative mod source on the INITIATIVE event', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['cramped', 'outdoor']),
      exchange: 7, // mist_veil fires on the 7s
    });
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });

    resolveExchange(ctx, fA, fD); // mist_veil fires → pending mod + source
    expect(ctx.arenaEventModSources?.initiative).toContain('Mist Veil');

    ctx.exchange = 8;
    const events = resolveExchange(ctx, fA, fD);
    const ini = events.find((e) => e.type === 'INITIATIVE');
    expect(ini?.metadata?.arenaModSources).toContain('Mist Veil');
  });

  it('stamps the pending riposte mod source on the riposte DEFENSE event', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['premium']),
      // roll 1 → every skill check succeeds → a riposte fires deterministically
      rng: () => 0,
    });
    ctx.arenaEventMods = { initiativeMod: 0, riposteMod: -4 };
    ctx.arenaEventModSources = { initiative: [], riposte: ['Synthetic'] };
    ctx.arenaEventCandidates = []; // keep the tick from clobbering sources
    const fA = makeFighterState();
    const fD = makeFighterState({ label: 'D' });

    const events = resolveExchange(ctx, fA, fD);
    const riposte = events.find((e) => e.type === 'DEFENSE' && e.result === 'RIPOSTE');
    expect(riposte).toBeTruthy();
    expect(riposte?.metadata?.arenaModSources).toContain('Synthetic');
  });

  it('emits a RIPOSTE_FAILED marker carrying the mod source when a pending riposte_mod suppresses the counter', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['premium']),
    });
    ctx.arenaEventMods = { initiativeMod: 0, riposteMod: -4 };
    ctx.arenaEventModSources = { initiative: [], riposte: ['Mist Veil'] };
    ctx.arenaEventCandidates = []; // keep the tick from clobbering sources
    // ATT/RIP floored → the attack whiffs and the whiff-riposte check fails,
    // so the pending mod's counter is suppressed deterministically.
    const cantHit = { ATT: -100, PAR: 10, DEF: 10, INI: 10, RIP: -100, DEC: 10 };
    const fA = makeFighterState({ skills: { ...cantHit } });
    const fD = makeFighterState({ label: 'D', skills: { ...cantHit } });

    const events = resolveExchange(ctx, fA, fD);

    const marker = events.find((e) => e.type === 'DEFENSE' && e.result === 'RIPOSTE_FAILED');
    expect(marker).toBeTruthy();
    expect(marker?.metadata?.arenaModSources).toContain('Mist Veil');
  });

  it('emits no RIPOSTE_FAILED marker when no riposte mod source is pending', () => {
    const ctx = makeResolutionContext({
      arenaConfig: arenaWithTags(['premium']),
    });
    ctx.arenaEventMods = { initiativeMod: 0, riposteMod: 0 };
    ctx.arenaEventModSources = { initiative: [], riposte: [] };
    ctx.arenaEventCandidates = [];
    const cantHit = { ATT: -100, PAR: 10, DEF: 10, INI: 10, RIP: -100, DEC: 10 };
    const fA = makeFighterState({ skills: { ...cantHit } });
    const fD = makeFighterState({ label: 'D', skills: { ...cantHit } });

    const events = resolveExchange(ctx, fA, fD);

    expect(events.every((e) => e.result !== 'RIPOSTE_FAILED')).toBe(true);
  });
});

describe('bleed termination — hazard attribution', () => {
  it('attributes a bleed-down to BLEED, not ARENA_HAZARD, even in a tagged arena', () => {
    const ctx = makeResolutionContext({ arenaConfig: arenaWithTags(['premium']) });
    // Attack skill floored on both fighters → every attack whiffs and no
    // riposte can fire, so the bleed tick is the only thing that can drop
    // fD (hp 3 - stacks 5 × 1).
    // The end must say BLEED and the arena tick must not stack a second
    // ARENA_HAZARD end on top.
    const cantHit = { ATT: -100, PAR: 10, DEF: 10, INI: 10, RIP: -100, DEC: 10 };
    const fA = makeFighterState({ hp: 100, skills: { ...cantHit } });
    const fD = makeFighterState({ label: 'D', hp: 3, bleedStacks: 5, skills: { ...cantHit } });

    const events = resolveExchange(ctx, fA, fD);

    const boutEnds = events.filter((e) => e.type === 'BOUT_END');
    expect(boutEnds).toHaveLength(1);
    expect(boutEnds[0]?.metadata?.cause).toBe('BLEED');
    expect(boutEnds[0]?.result).toBe('KO');
    expect(boutEnds[0]?.actor).toBe('A');
  });
});
