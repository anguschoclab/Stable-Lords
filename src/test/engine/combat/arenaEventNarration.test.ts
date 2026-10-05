/**
 * ARENA_EVENTS — narration-layer integration.
 *
 * Arena events are more than standalone flavor lines: hazard damage emits
 * cause-tagged HIT events that must narrate as environmental damage (with
 * the victim named, severity reactions, and spatial classification), bleed
 * ticks get dedicated lines instead of weapon-flavored "...'s BLEED" text,
 * endurance drains get a follow-up line, and pending initiative/riposte
 * mods echo into the next exchange with the hazard named.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { narrateEvents, type NarrationContext } from '@/engine/combat/narrative/narrator';
import { peekArchive, interpolateTemplate } from '@/engine/narrative/narrativePBPUtils';
import { loadCombatNarrative } from '@/data/narrative';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';

beforeAll(async () => {
  await loadCombatNarrative();
});

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

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);

/** True if `text` is any pool template interpolated for the victim name. */
const matchesPool = (text: string, pool: string[], name: string) =>
  pool.some((t) => interpolateTemplate(t, { name }) === text);

const bleedHit = (target: 'A' | 'D', value = 3): CombatEvent => ({
  type: 'HIT',
  actor: target === 'A' ? 'D' : 'A',
  target,
  value,
  location: 'Bleed',
  metadata: { cause: 'BLEED', stacks: 2 },
});

const arenaEvent = (id: string, over: Record<string, unknown> = {}): CombatEvent => ({
  type: 'ARENA_EVENT',
  actor: 'A',
  metadata: {
    arenaEventId: id,
    hazardName: 'Crowd Riot',
    narrativeText: 'The crowd riots in a frenzy, throwing debris into the arena!',
    effect: 'damage',
    ...over,
  },
});

const hazardHit = (target: 'A' | 'D', id = 'crowd_riot', value = 2): CombatEvent => ({
  type: 'HIT',
  actor: target,
  target,
  value,
  metadata: {
    cause: 'ARENA_EVENT',
    arenaEventId: id,
    hazardName: 'Crowd Riot',
    appliedDamage: value,
  },
});

describe('arena/bleed damage narration', () => {
  it('narrates a bleed tick from the bleed pool — never "...\'s BLEED"', () => {
    const { log } = narrateEvents([bleedHit('D')], createNarrCtx(), 5);

    expect(log.length).toBeGreaterThan(0);
    expect(log.every((l) => !l.text.includes('BLEED'))).toBe(true);
    expect(log.every((l) => !l.text.includes('Bleed'))).toBe(true);

    const bleedPool = peekArchive(['pbp', 'bleed']) ?? [];
    expect(bleedPool.length).toBeGreaterThan(0);
    expect(log.some((l) => matchesPool(l.text, bleedPool, 'Lightning'))).toBe(true);
  });

  it('does not emit a weapon-flavored attack lead or hit template for bleed', () => {
    const { log } = narrateEvents([bleedHit('D')], createNarrCtx(), 5);

    // Weapon hits run through attacks.* / strikes.* pools — none of those
    // templates may appear for a cause-tagged tick.
    expect(log.every((l) => !/\b(slash|blow|strike|thrust|swing)\b/i.test(l.text) || l.text.includes('Lightning'))).toBe(
      true
    );
    expect(log.every((l) => noRawTokens(l.text))).toBe(true);
  });

  it('narrates hazard damage from the arena damage pool with the victim named', () => {
    const events = [arenaEvent('crowd_riot'), hazardHit('D')];
    const { log } = narrateEvents(events, createNarrCtx(), 5);

    const dmgPool =
      peekArchive(['pbp', 'arena_events', 'crowd_riot', 'damage']) ??
      peekArchive(['pbp', 'arena_fx', 'damage']) ??
      [];
    expect(dmgPool.length).toBeGreaterThan(0);
    expect(
      log.some((l) => matchesPool(l.text, dmgPool, 'Lightning')),
      `expected a crowd_riot damage line in: ${JSON.stringify(log.map((l) => l.text))}`
    ).toBe(true);
  });

  it('attaches the source ARENA_EVENT to hazard damage lines (spatial classification)', () => {
    const events = [arenaEvent('crowd_riot'), hazardHit('D')];
    const { log } = narrateEvents(events, createNarrCtx(), 5);

    const dmgLine = log.find((l) =>
      l.events?.some((e) => e.type === 'HIT' && e.metadata?.cause === 'ARENA_EVENT')
    );
    expect(dmgLine).toBeTruthy();
    expect(dmgLine?.events?.some((e) => e.type === 'ARENA_EVENT')).toBe(true);
  });

  it('emits a severity state-change line when hazard damage crosses an hp threshold', () => {
    const ctx = { ...createNarrCtx(), prevHpRatioD: 1.0, postHpRatioD: 0.35 };
    const { log } = narrateEvents([hazardHit('D', 'crowd_riot', 60)], ctx, 5);

    // postHpRatioD 0.35 crosses the 0.4 threshold → 'desperate' pool.
    const desperate = peekArchive(['pbp', 'status_changes', 'desperate']) ?? [];
    expect(log.some((l) => matchesPool(l.text, desperate, 'Lightning'))).toBe(true);
  });

  it('appends an endurance-drain follow-up line after the announce', () => {
    const events = [
      arenaEvent('shadow_tendrils', {
        hazardName: 'Shadow Tendrils',
        narrativeText: 'Shadow tendrils lash out from the darkness!',
        effect: 'endurance_drain',
      }),
    ];
    const { log } = narrateEvents(events, createNarrCtx(), 5);

    expect(log.length).toBeGreaterThanOrEqual(2);
    const drainPool =
      peekArchive(['pbp', 'arena_events', 'shadow_tendrils', 'drain']) ??
      peekArchive(['pbp', 'arena_fx', 'drain']) ??
      [];
    expect(drainPool.length).toBeGreaterThan(0);
    expect(log.some((l) => drainPool.some((t) => interpolateTemplate(t, {}) === l.text))).toBe(
      true
    );
  });
});

describe('arena mod echo narration', () => {
  const initiativeEvent = (sources?: string[]): CombatEvent => ({
    type: 'INITIATIVE',
    actor: 'A',
    value: 12,
    metadata: sources ? { arenaModSources: sources } : {},
  });

  it('echoes an initiative mod source into the next exchange line', () => {
    const { log } = narrateEvents([initiativeEvent(['Mist Veil'])], createNarrCtx(), 6);

    const echoPool = peekArchive(['pbp', 'arena_fx', 'echo', 'initiative']) ?? [];
    expect(echoPool.length).toBeGreaterThan(0);
    expect(log.some((l) => l.text.includes('Mist Veil'))).toBe(true);
    expect(log.some((l) => matchesPool(l.text, echoPool, 'Thunderstrike'))).toBe(true);
  });

  it('emits no echo line when the initiative event carries no mod sources', () => {
    const { log } = narrateEvents([initiativeEvent()], createNarrCtx(), 6);

    expect(log.every((l) => !l.text.includes('Mist Veil'))).toBe(true);
  });

  it('echoes even when the initiative flavor line is suppressed', () => {
    // narrateInitiativeEvent's normal line is 30%-gated; the echo is an
    // attribution beat and must not be swallowed by that gate.
    for (let seed = 1; seed <= 20; seed++) {
      const ctx = { ...createNarrCtx(), rng: new SeededRNG(seed) };
      const { log } = narrateEvents([initiativeEvent(['Monolith Pulse'])], ctx, 6);
      expect(
        log.some((l) => l.text.includes('Monolith Pulse')),
        `seed ${seed} produced no echo`
      ).toBe(true);
    }
  });

  it('echoes a riposte mod source on the riposte defense line', () => {
    const events: CombatEvent[] = [
      { type: 'ATTACK', actor: 'A', result: 'swing' },
      {
        type: 'DEFENSE',
        actor: 'D',
        result: 'RIPOSTE',
        metadata: { arenaModSources: ['Deep Miasma'] },
      },
    ];
    const { log } = narrateEvents(events, createNarrCtx(), 6);

    const echoPool = peekArchive(['pbp', 'arena_fx', 'echo', 'riposte']) ?? [];
    expect(echoPool.length).toBeGreaterThan(0);
    expect(log.some((l) => l.text.includes('Deep Miasma'))).toBe(true);
  });
});
