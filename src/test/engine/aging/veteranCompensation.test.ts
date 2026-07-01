import { describe, it, expect } from 'vitest';
import { getVeteranDefBonus } from '@/engine/aging/veteranCompensation';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { computeWarriorStats } from '@/engine/skillCalc';
import { FightingStyle, type Warrior } from '@/types/game';

function warrior(style: FightingStyle, age: number, id: string): Warrior {
  const attrs = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: id as import('@/types/shared.types').WarriorId,
    name: id,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age,
    traits: [],
  };
}

describe('getVeteranDefBonus', () => {
  it('is zero before the aging penalty kicks in (age <= 28)', () => {
    expect(getVeteranDefBonus(25, 15)).toBe(0);
    expect(getVeteranDefBonus(28, 15)).toBe(0);
  });

  it('grows with age past 28 (more lost speed -> more compensating wisdom)', () => {
    const young = getVeteranDefBonus(31, 15); // penalty 1 (floor(3/3)=1)
    const old = getVeteranDefBonus(34, 15); // penalty 2 (floor(6/3)=2)
    expect(old).toBeGreaterThan(young);
  });

  it('scales with WL (wise veterans convert decline better than dull ones)', () => {
    const wise = getVeteranDefBonus(34, 20);
    const dull = getVeteranDefBonus(34, 5);
    expect(wise).toBeGreaterThan(dull);
  });

  it('never exceeds the speed it compensates (no net buff)', () => {
    // At age 34, penalty = 2 SP + 2 DF lost = 4 attribute points lost.
    // DEF compensation must stay <= that, so aging is still a net decline.
    expect(getVeteranDefBonus(34, 25)).toBeLessThanOrEqual(4);
  });
});

describe('Aged INI-style fighter stays viable', () => {
  it('age-34 LU keeps a win rate above the cliff vs a prime BA', () => {
    const old = warrior(FightingStyle.LungingAttack, 34, 'old_LU');
    const prime = warrior(FightingStyle.BashingAttack, 25, 'prime_BA');
    let wins = 0;
    const N = 150;
    for (let i = 0; i < N; i++) {
      const o = simulateFight(
        defaultPlanForWarrior(old),
        defaultPlanForWarrior(prime),
        old,
        prime,
        i * 5381 + 11
      );
      if (o.winner === 'A') wins++;
    }
    const rate = wins / N;
    expect(rate, `aged LU win rate ${(rate * 100).toFixed(1)}%`).toBeGreaterThan(0.25);
    expect(rate, `aged LU should not out-fight its prime self`).toBeLessThan(0.55);
  });
});
