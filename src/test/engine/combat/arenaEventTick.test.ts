/**
 * V2-DEFERRED — ARENA_EVENTS engine wiring.
 *
 * The arena-event registry (constants/arenaEvents.ts) declares trigger
 * conditions, narrative text, and mechanical effects, but has no production
 * consumer. These tests pin the intended wiring: a per-exchange
 * `tickArenaEvents` pass inside `resolveExchange` that evaluates
 * tag-matched events against the exchange's outcome, applies mechanical
 * effects, and emits ARENA_EVENT CombatEvents that narrate into the bout
 * log.
 */
import { describe, it, expect } from 'vitest';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import { tickArenaEvents } from '@/engine/combat/mechanics/arenaEvents';
import { resolveExchange } from '@/engine/combat/resolution/resolution';
import { narrateEvents, type NarrationContext } from '@/engine/combat/narrative/narrator';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';
import type { ArenaConfig, ArenaTag } from '@/types/shared.types';
import { getArenaById } from '@/data/arenas';

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

  it('narrates ARENA_EVENT via its metadata narrativeText', () => {
    const events: CombatEvent[] = [
      {
        type: 'ARENA_EVENT',
        actor: 'A',
        metadata: {
          arenaEventId: 'geyser_eruption',
          narrativeText: 'A hidden geyser erupts, blasting scalding water into the air!',
        },
      },
    ];

    const { log } = narrateEvents(events, createNarrCtx(), 3);

    const line = log.find((l) => l.text.includes('geyser erupts'));
    expect(line).toBeTruthy();
    // carries the source event so classifyEvent can mark it 'spatial'
    expect(line?.events?.some((e) => e.type === 'ARENA_EVENT')).toBe(true);
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
    expect(
      lines.some((t) => t.includes('blood moon illuminates the cursed ground'))
    ).toBe(true);
  });

  it('same seed reproduces identical arena-event outcomes (determinism)', () => {
    const attrs = { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 };
    const mk = (style: FightingStyle) =>
      makeWarrior({ id: undefined, name: 'W', style, attrs });
    const run = () => {
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
        headless: true,
        deathRateMult: 0,
      });
    };

    const r1 = run();
    const r2 = run();
    expect(r1.minutes).toBe(r2.minutes);
    expect(r1.winner).toBe(r2.winner);
  });
});
