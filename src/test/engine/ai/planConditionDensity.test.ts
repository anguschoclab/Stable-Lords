import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { Attributes } from '@/types/shared.types';

function warriorWithWt(wt: number): Warrior {
  const attrs: Attributes = { ST: 15, CN: 15, SZ: 15, WT: wt, WL: 15, SP: 15, DF: 15 };
  return makeWarrior(
    { id: undefined, name: 'W', style: FightingStyle.LungingAttack, attrs: attrs, overrides: undefined, rng: new SeededRNGService(1) }
  );
}

describe('F.3 — WIT-gated condition density (mistake-shaped plans)', () => {
  it('high-WIT warriors keep the full adaptive condition set', () => {
    const plan = aiPlanForWarrior(
      { w: warriorWithWt(15), personality: 'Aggressive', philosophy: 'Expansionist', opponentStyle: undefined, intent: 'VENDETTA' }
    );
    // universal + base + personality adaptations (Aggressive under kill intent yields ≥2)
    expect(plan.conditions?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('mid-WIT warriors keep only a sparse condition set', () => {
    const plan = aiPlanForWarrior(
      { w: warriorWithWt(5), personality: 'Aggressive', philosophy: 'Expansionist', opponentStyle: undefined, intent: 'VENDETTA' }
    );
    expect(plan.conditions?.length ?? 0).toBeLessThanOrEqual(2);
  });

  it('low-WIT warriors carry only the universal safety condition', () => {
    const plan = aiPlanForWarrior(
      { w: warriorWithWt(3), personality: 'Aggressive', philosophy: 'Expansionist', opponentStyle: undefined, intent: 'VENDETTA' }
    );
    expect(plan.conditions?.length).toBe(1);
    expect(plan.conditions?.[0]?.trigger.type).toBe('ENDURANCE_BELOW');
  });

  it('density ordering is monotonic in WIT', () => {
    const n = (wt: number) =>
      aiPlanForWarrior({ w: warriorWithWt(wt), personality: 'Aggressive', philosophy: 'Expansionist', opponentStyle: undefined, intent: 'VENDETTA' })
        .conditions?.length ?? 0;
    expect(n(3)).toBeLessThanOrEqual(n(5));
    expect(n(5)).toBeLessThanOrEqual(n(15));
  });
});
