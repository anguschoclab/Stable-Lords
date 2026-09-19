/**
 * E.0 — Rematch learning (G11).
 * `aiPlanForWarrior` accepts an optional opponent dossier: a warrior with a
 * losing record against this opponent generates a measurably different plan
 * (patient — lower OE / higher AL bias) than the first-meeting baseline.
 * All deltas are deterministic and stay inside the 1–10 clamps; no combat
 * math is touched.
 */
import { describe, it, expect } from 'vitest';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { OpponentDossier } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';

const BASELINE_ARGS = [
  'Pragmatic',
  'Opportunist',
  FightingStyle.BashingAttack,
  'CONSOLIDATION',
  0,
] as const;

function losingDossier(): OpponentDossier {
  return {
    lastSeenWeek: 9,
    knownStyles: [FightingStyle.BashingAttack],
    estimatedThreat: 0.8,
    recordVs: { w: 0, l: 3, k: 1 },
  };
}

describe('rematch adaptation', () => {
  it('a losing record produces a more patient plan than the baseline', () => {
    const w = makeWarrior();
    const baseline = aiPlanForWarrior(w, ...BASELINE_ARGS);
    const rematch = aiPlanForWarrior(w, ...BASELINE_ARGS, losingDossier());

    expect(rematch.OE).toBeLessThanOrEqual(baseline.OE!);
    expect(rematch.AL).toBeGreaterThanOrEqual(baseline.AL!);
    // The dossier must actually move at least one dial
    expect(rematch.OE !== baseline.OE || rematch.AL !== baseline.AL).toBe(true);
  });

  it('a kill suffered against the opponent raises killDesire', () => {
    const w = makeWarrior();
    const baseline = aiPlanForWarrior(w, ...BASELINE_ARGS);
    const rematch = aiPlanForWarrior(w, ...BASELINE_ARGS, losingDossier());
    expect(rematch.killDesire!).toBeGreaterThanOrEqual(baseline.killDesire!);
  });

  it('a first meeting (no dossier history) matches the baseline plan', () => {
    const w = makeWarrior();
    const baseline = aiPlanForWarrior(w, ...BASELINE_ARGS);
    const fresh = aiPlanForWarrior(w, ...BASELINE_ARGS, {
      lastSeenWeek: 9,
      knownStyles: [],
      estimatedThreat: 0.5,
      recordVs: { w: 0, l: 0, k: 0 },
    });
    expect(fresh.OE).toBe(baseline.OE);
    expect(fresh.AL).toBe(baseline.AL);
    expect(fresh.killDesire).toBe(baseline.killDesire);
  });

  it('a winning record does not trigger the loss-adaptation deltas', () => {
    const w = makeWarrior();
    const baseline = aiPlanForWarrior(w, ...BASELINE_ARGS);
    const winning = aiPlanForWarrior(w, ...BASELINE_ARGS, {
      lastSeenWeek: 9,
      knownStyles: [FightingStyle.BashingAttack],
      estimatedThreat: 0.3,
      recordVs: { w: 3, l: 0, k: 0 },
    });
    expect(winning.OE).toBe(baseline.OE);
    expect(winning.AL).toBe(baseline.AL);
  });

  it('determinism: same inputs produce identical plans', () => {
    const w = makeWarrior();
    const a = aiPlanForWarrior(w, ...BASELINE_ARGS, losingDossier());
    const b = aiPlanForWarrior(w, ...BASELINE_ARGS, losingDossier());
    expect(a).toEqual(b);
  });
});
