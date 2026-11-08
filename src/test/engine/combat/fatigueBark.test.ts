/**
 * Canon: a tiring warrior shows it — "breathing heavily" at 30% endurance,
 * "barely able to defend himself" at 15%. The FATIGUE event type and its
 * narrator exist; RED until applyEnduranceCosts emits the event on
 * threshold crossings (once per tier per bout).
 */
import { describe, it, expect } from 'vitest';
import { applyEnduranceCosts } from '@/engine/combat/resolution/exchangeHelpers/mechanics/enduranceCosts';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import type { CombatEvent } from '@/types/combat.types';

const noReq = { endurancePenalty: 1 };

const args = (fA: any, fD: any, events: CombatEvent[]) => ({
  events,
  ctx: makeResolutionContext({ rng: () => 0.99 }),
  fA,
  fD,
  aGoesFirst: true,
  curAttOE: 10,
  curAttAL: 10,
  curAttWepReq: noReq,
  curDefWepReq: noReq,
  OE_D: 10,
  AL_D: 10,
  OE_A: 10,
  AL_A: 10,
});

const fighterAt = (endurance: number, max = 50, label: 'A' | 'D' = 'A') =>
  makeFighterState({ label, endurance, maxEndurance: max } as any);

describe('fatigue barks (canon)', () => {
  it('crossing below 30% endurance emits a FATIGUE event with the ratio', () => {
    const events: CombatEvent[] = [];
    const fA = fighterAt(16); // costs push under 15
    const fD = fighterAt(50, 50, 'D');
    applyEnduranceCosts(args(fA, fD, events));
    const fatigue = events.filter((e) => e.type === 'FATIGUE');
    expect(fatigue.length).toBeGreaterThanOrEqual(1);
    expect(fatigue[0]!.value).toBeLessThanOrEqual(0.3);
  });

  it('a crossing fires once per tier, not on every subsequent beat', () => {
    const fA = fighterAt(16);
    const fD = fighterAt(50, 50, 'D');
    const e1: CombatEvent[] = [];
    applyEnduranceCosts(args(fA, fD, e1));
    const firstCount = e1.filter((e) => e.type === 'FATIGUE' && e.actor === 'A').length;
    expect(firstCount).toBe(1);
    // Second beat at the same tier — no repeat bark.
    const e2: CombatEvent[] = [];
    applyEnduranceCosts(args(fA, fD, e2));
    const secondSameTier = e2.filter(
      (e) => e.type === 'FATIGUE' && e.actor === 'A' && (e.value ?? 0) > 0.15
    ).length;
    expect(secondSameTier).toBe(0);
  });

  it('dropping through to the severe tier emits a deeper bark', () => {
    const fA = fighterAt(5); // well under 15%
    const fD = fighterAt(50, 50, 'D');
    const e: CombatEvent[] = [];
    applyEnduranceCosts(args(fA, fD, e));
    const severe = e.filter(
      (ev) => ev.type === 'FATIGUE' && ev.actor === 'A' && (ev.value ?? 1) <= 0.15
    );
    expect(severe.length).toBe(1);
  });

  it('comfortable fighters emit nothing', () => {
    const fA = fighterAt(45);
    const fD = fighterAt(50, 50, 'D');
    const e: CombatEvent[] = [];
    applyEnduranceCosts(args(fA, fD, e));
    expect(e.filter((ev) => ev.type === 'FATIGUE')).toHaveLength(0);
  });
});
