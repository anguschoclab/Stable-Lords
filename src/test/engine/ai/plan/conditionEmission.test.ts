// @vitest-environment node
/**
 * Stage E — the AI emits conditions grounded in real state: vendetta
 * blood-scenting, recovery shells, and dossier-driven counter-conditions.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { FightingStyle } from '@/types/shared.types';
import type { OpponentDossier } from '@/types/state.types';
import { makeWarrior, resetFixtureIds } from '@/test/_fixtures/factories';

beforeEach(() => resetFixtureIds());

const KILLER_DOSSIER: OpponentDossier = {
  lastSeenWeek: 10,
  knownStyles: [FightingStyle.BashingAttack],
  estimatedThreat: 0.8,
  recordVs: { w: 0, l: 2, k: 1 },
};

describe('aiPlanForWarrior — condition emission from real state', () => {
  it('VENDETTA stables emit a blood-scent kill switch', () => {
    const w = makeWarrior();
    const plan = aiPlanForWarrior({ w: w, personality: 'Aggressive', philosophy: 'Opportunist', opponentStyle: undefined, intent: 'VENDETTA' });
    const blood = plan.conditions?.find((c) => c.trigger.type === 'OPPONENT_HP_BELOW');
    expect(blood).toBeDefined();
    // KD bump clamps at 10 for hot personalities — the emitted intent is
    // what matters, not the exact delta.
    expect(blood!.override.killDesire).toBeGreaterThan(5);
    expect(blood!.label).toMatch(/blood/i);
  });

  it('RECOVERY stables shell up when the opponent builds tempo', () => {
    const w = makeWarrior();
    const plan = aiPlanForWarrior({ w: w, personality: 'Pragmatic', philosophy: 'Opportunist', opponentStyle: undefined, intent: 'RECOVERY' });
    const shell = plan.conditions?.find((c) => c.trigger.type === 'OPPONENT_MOMENTUM_LEAD');
    expect(shell).toBeDefined();
    expect((shell!.override.OE ?? 99) < plan.OE!).toBe(true);
  });

  it('a dossier on a known killer emits a defensive counter-condition', () => {
    const w = makeWarrior();
    const plan = aiPlanForWarrior(
      { w: w, personality: 'Pragmatic', philosophy: 'Opportunist', opponentStyle: FightingStyle.BashingAttack, intent: undefined, grudgeIntensity: 0, dossier: KILLER_DOSSIER, now: 10 }
    );
    const shell = plan.conditions?.find(
      (c) => c.trigger.type === 'OPPONENT_MOMENTUM_LEAD' || c.trigger.type === 'PSYCH_IS'
    );
    expect(shell).toBeDefined();
    expect((shell!.override.AL ?? 0) > plan.AL!).toBe(true);
  });

  it('Tactician/Methodical stables press when the opponent gases out', () => {
    const w = makeWarrior();
    for (const personality of ['Tactician', 'Methodical'] as const) {
      const plan = aiPlanForWarrior({ w: w, personality: personality, philosophy: 'Opportunist' });
      const press = plan.conditions?.find((c) => c.trigger.type === 'OPPONENT_ENDURANCE_BELOW');
      expect(press, personality).toBeDefined();
      expect((press!.override.OE ?? 0) > plan.OE!).toBe(true);
    }
  });
});
