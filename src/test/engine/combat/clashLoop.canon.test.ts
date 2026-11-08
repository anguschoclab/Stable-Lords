/**
 * V24 canon — Pagan's clash model (Arena 93, "Getting the Jump"): a contested
 * opening re-draws BOTH warriors' jump strings until a real disparity
 * emerges (bounded by JUMP_CLASH_MAX), not N blind coin flips of the same sum.
 */
import { describe, it, expect } from 'vitest';
import { resolveInitiativePhase } from '@/engine/combat/resolution/initiativePhase';
import { JUMP_CLASH_MAX } from '@/constants/combat';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import type { CombatEvent } from '@/types/combat.types';
import type { ResolutionContext } from '@/engine/combat/resolution/types';

const baseArgs = (ctx: ResolutionContext, events: CombatEvent[]) => ({
  ctx,
  fA: makeFighterState({ label: 'A' }),
  fD: makeFighterState({ label: 'D' }),
  OE_A: 5,
  AL_A: 5,
  OE_D: 5,
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

const scriptRng = (seq: number[]) => {
  let i = 0;
  return () => seq[i++ % seq.length] ?? 0.5;
};

describe('clash loop re-evaluates disparity (Pagan)', () => {
  it('can terminate early once jitter opens a decisive gap', () => {
    const events: CombatEvent[] = [];
    // Alternating extremes: once the jitter re-draws lands unevenly the gap
    // clears JUMP_DISPARITY and the loop must exit before the max.
    const ctx = makeResolutionContext({ exchange: 0, rng: scriptRng([0.5, 0.01, 0.99, 0.01, 0.99]) });
    resolveInitiativePhase(baseArgs(ctx, events));
    const clashes = events.filter((e) => e.type === 'CLASH');
    expect(clashes.length).toBeLessThan(JUMP_CLASH_MAX);
  });

  it('the reported gap changes between clashes — totals are re-drawn', () => {
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ exchange: 0, rng: scriptRng([0.5, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6]) });
    resolveInitiativePhase(baseArgs(ctx, events));
    const values = events.filter((e) => e.type === 'CLASH').map((e) => e.value);
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it('is seed-deterministic — same stream, same outcome', () => {
    const run = () => {
      const events: CombatEvent[] = [];
      const ctx = makeResolutionContext({ exchange: 0, rng: scriptRng([0.5, 0.3, 0.7]) });
      return { out: resolveInitiativePhase(baseArgs(ctx, events)), events };
    };
    expect(run().out.aGoesFirst).toBe(run().out.aGoesFirst);
  });

  it('still bounded — a perpetually-tied stream never loops forever', () => {
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ exchange: 0, rng: () => 0.5 });
    resolveInitiativePhase(baseArgs(ctx, events));
    expect(events.filter((e) => e.type === 'CLASH').length).toBeLessThanOrEqual(
      JUMP_CLASH_MAX
    );
  });
});
