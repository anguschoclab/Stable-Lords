/**
 * AI challenge-context plan emission — personalities that prepare alternate
 * "special strategies" (canon: plan for your challenge / for being challenged).
 */
import { describe, it, expect } from 'vitest';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { makeWarrior } from '@/test/_fixtures/factories';

function plan(personality: string, intent?: string) {
  return aiPlanForWarrior({
    w: makeWarrior(),
    personality: personality as any,
    philosophy: 'Balanced',
    intent: intent as any,
  });
}

describe('aiPlanForWarrior challengePlans emission', () => {
  it('Tactician prepares both slots', () => {
    const p = plan('Tactician');
    expect(p.challengePlans?.whenProposer).toBeDefined();
    expect(p.challengePlans?.whenChallenged).toBeDefined();
  });

  it('Methodical prepares both slots', () => {
    const p = plan('Methodical');
    expect(p.challengePlans?.whenProposer).toBeDefined();
    expect(p.challengePlans?.whenChallenged).toBeDefined();
  });

  it('Aggressive only prepares an all-out challenge opener', () => {
    const p = plan('Aggressive');
    const alt = p.challengePlans?.whenProposer;
    expect(alt).toBeDefined();
    expect(p.challengePlans?.whenChallenged).toBeUndefined();
    // "All-out" = at least one axis more extreme than the base plan.
    const moreExtreme =
      (alt!.OE ?? 0) > p.OE ||
      (alt!.AL ?? 10) < p.AL ||
      (alt!.killDesire ?? 0) > (p.killDesire ?? 5);
    expect(moreExtreme).toBe(true);
  });

  it('Tactician whenChallenged is more defensive than the base plan', () => {
    const p = plan('Tactician');
    const alt = p.challengePlans!.whenChallenged!;
    expect(alt.AL).toBeGreaterThan(p.AL);
    expect(alt.OE).toBeLessThan(p.OE);
  });

  it('VENDETTA stables prepare a surprise counter when challenged', () => {
    const p = plan('Pragmatic', 'VENDETTA');
    expect(p.challengePlans?.whenChallenged).toBeDefined();
  });

  it('a plain Pragmatic CONSOLIDATION plan emits no slots', () => {
    const p = plan('Pragmatic', 'CONSOLIDATION');
    expect(p.challengePlans).toBeUndefined();
  });
});
