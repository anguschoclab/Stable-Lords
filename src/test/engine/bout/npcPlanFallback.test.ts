/**
 * V26 — `getNPCPlan`'s missing-stable fallback must return the style preset
 * verbatim. Today it overrides `killDesire: 7` for every style — a fallback
 * that quietly turns TotalParrys (preset KD 2) into killers and contradicts
 * the doctrine the real path applies.
 *
 * Live since Phase 7 — no hardcoded killDesire override.
 */
import { describe, it, expect } from 'vitest';
import { getNPCPlan } from '@/engine/bout/services/boutResolution';
import { defaultPlanForWarrior } from '@/engine/simulate';
import { makeGameState, makeWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';

describe('getNPCPlan — missing-stable fallback', () => {
  it('returns the style preset verbatim (no hardcoded KD 7)', () => {
    const w = makeWarrior({
      style: FightingStyle.TotalParry,
      stableId: 'ghost-stable' as never,
    });
    const state = makeGameState({ rivals: [] });
    const plan = getNPCPlan(state, w, FightingStyle.BashingAttack);
    const expected = defaultPlanForWarrior(w);
    expect(plan.killDesire).toBe(expected.killDesire);
    expect(plan).toEqual(expected);
  });
});
