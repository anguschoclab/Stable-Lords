// @vitest-environment jsdom
/**
 * V25 — archetype-aware AI plan doctrine: after the per-style caps, the
 * build's winning-archetype fit shapes the plan (canon: tanks run upper
 * offensive effort; scum stays conservative).
 */
import { describe, it, expect } from 'vitest';
import { applyStyleDoctrine } from '@/engine/ai/plan/coreGenerator';
import { classifyArchetype } from '@/data/warriorArchetypes';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/combat.types';

const plan = (oe: number, al: number, kd: number, style = FightingStyle.StrikingAttack): FightPlan =>
  ({ style, OE: oe, AL: al, killDesire: kd }) as FightPlan;

// Canon tank frame: heavy ST+CN, encumbrance capacity for plate.
const TANK_BA = makeComputedWarrior(
  { ST: 16, CN: 16, SZ: 9, WT: 9, WL: 15, SP: 4, DF: 9 },
  FightingStyle.BashingAttack
);
// Canon riposting-hybrid frame: low-will tank profile on WS — veteran
// (≥10 fights) so the young-wall OE-6 floor does not fire and only the
// archetype tank floor can lift the plan.
const TANK_WS = makeComputedWarrior(
  { ST: 18, CN: 13, SZ: 5, WT: 9, WL: 6, SP: 11, DF: 9 },
  FightingStyle.WallOfSteel,
  { career: { wins: 7, losses: 6, kills: 0 } }
);
// Fragile offensive — not a tank frame.
const FRAGILE_ST = makeComputedWarrior(
  { ST: 9, CN: 5, SZ: 9, WT: 17, WL: 15, SP: 11, DF: 15 },
  FightingStyle.StrikingAttack
);

describe('applyStyleDoctrine — archetype shaping (V25)', () => {
  it('floors OE at 5 for tank-classified builds — tanks run upper offensive effort', () => {
    const p = plan(2, 3, 3);
    applyStyleDoctrine(p, TANK_BA);
    expect(p.OE).toBeGreaterThanOrEqual(5);
  });

  it('floors OE at 5 for a low-will tank-classified wall', () => {
    const p = plan(1, 2, 2);
    applyStyleDoctrine(p, TANK_WS);
    expect(p.OE).toBeGreaterThanOrEqual(5);
  });

  it('does not floor OE for a fragile pure offensive — not a tank frame', () => {
    const p = plan(3, 3, 3);
    applyStyleDoctrine(p, FRAGILE_ST);
    // striker doctrine floors at 5 anyway; the archetype shaping must not
    // push it higher than the style floor.
    expect(p.OE).toBe(5);
  });
});

describe('classifyArchetype — feeds the doctrine layer', () => {
  it('the tank frames actually classify as tank hybrids', () => {
    expect(classifyArchetype(TANK_BA.attributes, TANK_BA.style)[0]?.archetype).toMatch(/tank/);
    expect(classifyArchetype(TANK_WS.attributes, TANK_WS.style)[0]?.archetype).toMatch(/tank/);
  });
});
