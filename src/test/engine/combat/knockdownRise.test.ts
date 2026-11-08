/**
 * V23 canon — "Effects of Coordination": clumsy fighters are slower to
 * rise after a knockdown (the auto-clear becomes a gated roll), plus a
 * small coordination-based knockdown-susceptibility term (house-approved).
 */
import { describe, it, expect } from 'vitest';
import { prepareExchange } from '@/engine/combat/resolution/exchangePrep';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import type { CombatEvent } from '@/types/combat.types';

const fA = () => makeFighterState({ label: 'A', weaponId: 'broadsword' });

describe('knockdown rise gate — clumsy fighters stay down longer', () => {
  it('a Clumsy fighter fails the rise roll and stays down (no RECOVERY)', () => {
    const fD = makeFighterState({
      label: 'D',
      knockedDown: true,
      coordination: 'Clumsy',
    });
    const events: CombatEvent[] = [];
    // disarmRng 0.99 → rise-fail chance (0.5 for Clumsy) → stays down.
    const ctx = makeResolutionContext({ disarmRng: () => 0.99 });
    prepareExchange(ctx, fA(), fD, events);
    expect(fD.knockedDown).toBe(true);
    expect(events.some((e) => e.type === 'RECOVERY' && e.actor === 'D')).toBe(false);
  });

  it('the same Clumsy fighter rises on a successful roll', () => {
    const fD = makeFighterState({
      label: 'D',
      knockedDown: true,
      coordination: 'Clumsy',
    });
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ disarmRng: () => 0 });
    prepareExchange(ctx, fA(), fD, events);
    expect(fD.knockedDown).toBe(false);
    expect(events.some((e) => e.type === 'RECOVERY' && e.actor === 'D')).toBe(true);
  });

  it('Normal-and-better fighters always rise (no roll consumed)', () => {
    const fD = makeFighterState({
      label: 'D',
      knockedDown: true,
      coordination: 'Normal',
    });
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ disarmRng: () => 0.99 });
    prepareExchange(ctx, fA(), fD, events);
    expect(fD.knockedDown).toBe(false);
    expect(events.some((e) => e.type === 'RECOVERY' && e.actor === 'D')).toBe(true);
  });

  it('fighters without a coordination rating always rise (legacy states)', () => {
    const fD = makeFighterState({ label: 'D', knockedDown: true });
    const events: CombatEvent[] = [];
    const ctx = makeResolutionContext({ disarmRng: () => 0.99 });
    prepareExchange(ctx, fA(), fD, events);
    expect(fD.knockedDown).toBe(false);
  });
});
