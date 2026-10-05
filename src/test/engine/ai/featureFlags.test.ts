/**
 * Phase-3 plan §8 — AI feature flags: globalThis toggles for soak
 * bisection. Unset = enabled (shipped behavior); explicit `false` makes the
 * feature inert. Each flag gates BOTH authoring and resolution where
 * applicable, so a disabled feature is truly dark.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { aiFeature } from '@/engine/ai/featureFlags';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import {
  competenceJitter,
  competenceReserveScale,
  competenceConditionCap,
} from '@/engine/ai/competence';
import { applyDecoyMask, emitDecoyReveal } from '@/engine/combat/resolution/decoyShift';
import type { CombatEvent } from '@/types/combat.types';
import {
  makeFighterState,
  makePlan,
  makeWarrior,
} from '@/test/_fixtures/factories';

const FLAGS = ['AI_COMPETENCE', 'AI_SEASON_PLANS', 'AI_READS', 'AI_DECOY'] as const;

afterEach(() => {
  for (const f of FLAGS) delete (globalThis as Record<string, unknown>)[f];
});

describe('aiFeature', () => {
  it('unset flags default to enabled', () => {
    for (const f of FLAGS) expect(aiFeature(f)).toBe(true);
  });

  it('explicit false disables; any other value keeps it enabled', () => {
    (globalThis as Record<string, unknown>).AI_DECOY = false;
    expect(aiFeature('AI_DECOY')).toBe(false);
    (globalThis as Record<string, unknown>).AI_DECOY = true;
    expect(aiFeature('AI_DECOY')).toBe(true);
  });
});

describe('AI_DECOY gate', () => {
  const deceptiveWarrior = () =>
    makeWarrior({
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 16, WL: 10, SP: 10, DF: 10 },
    });

  it('off: no decoy is authored and a loaded decoy plan resolves unmasked', () => {
    (globalThis as Record<string, unknown>).AI_DECOY = false;
    const plan = aiPlanForWarrior({
      w: deceptiveWarrior(),
      personality: 'Tactician',
      philosophy: 'Opportunist',
      now: 10,
    });
    expect(plan.decoyAxes).toBeUndefined();

    const loaded = makePlan({
      decoyAxes: { untilPhase: 'mid', OE: 2, AL: 7 },
    });
    expect(applyDecoyMask(loaded, 'opening')).toBe(loaded);
    const f = makeFighterState({ label: 'A', plan: loaded });
    const events: CombatEvent[] = [];
    emitDecoyReveal(f, 'mid', events);
    expect(events).toHaveLength(0);
    expect(f.decoyRevealed).toBeUndefined();
  });
});

describe('AI_READS gate', () => {
  it('off: the streak-punish adaptation is not authored', () => {
    const args = {
      w: makeWarrior({
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 16, WL: 10, SP: 10, DF: 10 },
      }),
      personality: 'Tactician' as const,
      philosophy: 'Opportunist',
      now: 10,
    };
    const on = aiPlanForWarrior(args);
    expect(
      on.conditions?.some((c) => c.trigger.type === 'OPPONENT_TACTIC_STREAK')
    ).toBe(true);
    (globalThis as Record<string, unknown>).AI_READS = false;
    const off = aiPlanForWarrior(args);
    expect(
      off.conditions?.some((c) => c.trigger.type === 'OPPONENT_TACTIC_STREAK')
    ).toBe(false);
  });
});

describe('AI_COMPETENCE gate', () => {
  const master = { id: 'o1' as never, competence: 'Master' as const };

  it('off: all competence effects are neutral', () => {
    (globalThis as Record<string, unknown>).AI_COMPETENCE = false;
    expect(competenceJitter(master, 'salt', 3)).toBe(0);
    expect(competenceReserveScale(master)).toBe(1);
    expect(competenceConditionCap(master, 8, 1)).toBe(8);
  });
});

describe('AI_SEASON_PLANS gate', () => {
  it('off: applySeasonPlan strips the objective from memory', async () => {
    const { applySeasonPlan } = await import('@/engine/ai/plan/seasonPlan');
    const rival = {
      id: 'r1',
      treasury: 500,
      warriors: [],
      agentMemory: {
        seasonObjective: { kind: 'TREASURY', weeksRemaining: 8 },
      },
    } as never;
    (globalThis as Record<string, unknown>).AI_SEASON_PLANS = false;
    const out = applySeasonPlan(rival, {} as never);
    expect(out.agentMemory?.seasonObjective).toBeUndefined();
  });
});
