import { describe, it, expect } from 'vitest';
import { fightingCondition } from '@/engine/warrior/condition';
import type { InjuryData, InjurySeverity } from '@/types/warrior.types';

const injury = (severity: InjurySeverity): InjuryData =>
  ({
    id: `inj-${severity}`,
    name: severity,
    description: '',
    severity,
    weeksRemaining: 2,
    penalties: {},
  }) as InjuryData;

describe('fightingCondition', () => {
  it('is 100 for an unhurt warrior', () => {
    expect(fightingCondition({ injuries: [] })).toBe(100);
  });

  it('drops with each active injury, harder for worse severities', () => {
    const minor = fightingCondition({ injuries: [injury('Minor')] });
    const moderate = fightingCondition({ injuries: [injury('Moderate')] });
    const severe = fightingCondition({ injuries: [injury('Severe')] });
    expect(minor).toBeLessThan(100);
    expect(moderate).toBeLessThan(minor);
    expect(severe).toBeLessThan(moderate);
  });

  it('stacks injuries and floors at 0', () => {
    expect(fightingCondition({ injuries: [injury('Minor'), injury('Minor')] })).toBe(60);
    expect(
      fightingCondition({ injuries: [injury('Critical'), injury('Severe'), injury('Severe')] })
    ).toBe(0);
  });

  it('does not depend on max hit points', () => {
    // derivedStats.hp is the max-HP stat (~20–55), not a health percentage:
    // a frail warrior with no injuries is fully fit.
    const frail = { injuries: [], derivedStats: { hp: 22 } };
    expect(fightingCondition(frail)).toBe(100);
  });
});
