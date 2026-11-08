/**
 * V23 canon — Pagan, "Getting the Jump" (Arena 93):
 *  1. OE is the biggest controllable factor in winning the jump.
 *  2. At bout open, contested jumps "clash" — both warriors try again
 *     until a clear winner emerges (bounded by JUMP_CLASH_MAX).
 */
import { describe, it, expect } from 'vitest';
import { resolveInitiativePhase } from '@/engine/combat/resolution/initiativePhase';
import { JUMP_OE_COEFF, JUMP_CLASH_MAX } from '@/constants/combat';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import type { CombatEvent } from '@/types/combat.types';
import type { ResolutionContext } from '@/engine/combat/resolution/types';

const baseArgs = (ctx: ResolutionContext, events: CombatEvent[], OE_A = 5, OE_D = 5) => ({
  ctx,
  fA: makeFighterState({ label: 'A' }),
  fD: makeFighterState({ label: 'D' }),
  OE_A,
  AL_A: 5,
  OE_D,
  AL_D: 5,
  fatA: 0,
  fatD: 0,
  defModsA: { iniBonus: 0 } as never,
  defModsD: { iniBonus: 0 } as never,
  passA: { iniBonus: 0 } as never,
  passD: { iniBonus: 0 } as never,
  psychA: { iniMod: 0 } as never,
  psychD: { iniMod: 0 } as never,
  dynTraitsA: { iniMod: 0 } as never,
  dynTraitsD: { iniMod: 0 } as never,
  events,
});

describe('OE term in the jump sum (canon: biggest controllable factor)', () => {
  it('raising OE raises the initiative total by JUMP_OE_COEFF per point', () => {
    const ctx = makeResolutionContext({ rng: () => 0.5 });
    const low = resolveInitiativePhase(baseArgs(ctx, [], 3, 3));
    const high = resolveInitiativePhase(baseArgs(ctx, [], 10, 3));
    expect(high.iniA - low.iniA).toBeCloseTo((10 - 3) * JUMP_OE_COEFF);
  });

  it('OE only affects the side it belongs to', () => {
    const ctx = makeResolutionContext({ rng: () => 0.5 });
    const a = resolveInitiativePhase(baseArgs(ctx, [], 8, 3));
    const b = resolveInitiativePhase(baseArgs(ctx, [], 8, 8));
    expect(b.iniD - a.iniD).toBeCloseTo(5 * JUMP_OE_COEFF);
    expect(b.iniA).toBeCloseTo(a.iniA);
  });
});

describe('opening clash loop (canon: contested jumps re-fight until disparity)', () => {
  it('a near-tied first exchange emits CLASH events before the decision', () => {
    const events: CombatEvent[] = [];
    // Mirror fighters → iniA ≈ iniD → |Δ| < JUMP_DISPARITY → clashes.
    const ctx = makeResolutionContext({ exchange: 0, rng: () => 0.5 });
    const out = resolveInitiativePhase(baseArgs(ctx, events));
    expect(events.filter((e) => e.type === 'CLASH').length).toBeGreaterThanOrEqual(1);
    // The last roll still decides the exchange.
    expect(typeof out.aGoesFirst).toBe('boolean');
  });

  it('clashes are bounded by JUMP_CLASH_MAX — never an infinite loop', () => {
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ exchange: 0, rng: () => 0.5 });
    resolveInitiativePhase(baseArgs(ctx, events));
    expect(events.filter((e) => e.type === 'CLASH').length).toBeLessThanOrEqual(
      JUMP_CLASH_MAX
    );
  });

  it('later exchanges do not clash — the loop only runs at bout open', () => {
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ exchange: 3, rng: () => 0.5 });
    resolveInitiativePhase(baseArgs(ctx, events));
    expect(events.some((e) => e.type === 'CLASH')).toBe(false);
  });
});
